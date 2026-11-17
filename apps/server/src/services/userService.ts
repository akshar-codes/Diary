import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";
import { SessionModel } from "../models/Session";
import { DiaryEntryModel } from "../models/DiaryEntry";
import { TopicPageModel } from "../models/TopicPage";
import { DiaryTopicLinkModel } from "../models/DiaryTopicLink";
import { NoteModel } from "../models/Note";
import { FolderModel } from "../models/Folder";
import { AttachmentModel } from "../models/Attachment";
import { deleteAttachmentAssets } from "./cloudinaryStorage";
import { AppError } from "../middlewares/errorMiddleware";
import { UpdateProfileInput, ChangePasswordInput, User } from "@notes/shared";

export class UserService {
  static async getProfile(userId: string): Promise<User> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }
    return user.toJSON() as unknown as User;
  }

  static async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<User> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (input.email && input.email.toLowerCase() !== user.email) {
      const existing = await UserModel.findOne({
        email: input.email.toLowerCase(),
      });
      if (existing) {
        throw new AppError("This email is already in use.", 409);
      }
      user.email = input.email.toLowerCase();
    }

    if (input.name) {
      user.name = input.name;
    }

    await user.save();
    return user.toJSON() as unknown as User;
  }

  static async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await UserModel.findById(userId).select("+passwordHash");
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const isMatch = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new AppError("Current password does not match.", 400);
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(input.newPassword, salt);
    await user.save();

    // Revoke all other sessions on password change
    await SessionModel.deleteMany({ userId });
  }

  static async exportUserData(userId: string) {
    const [user, diaryEntries, topics, links, notes, folders] =
      await Promise.all([
        UserModel.findById(userId),
        DiaryEntryModel.find({ userId }),
        TopicPageModel.find({ userId }),
        DiaryTopicLinkModel.find({ userId }),
        NoteModel.find({ userId }),
        FolderModel.find({ userId }),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      user: {
        name: user?.name,
        email: user?.email,
      },
      diaryEntries: diaryEntries.map((e) => e.toJSON()),
      topicPages: topics.map((t) => t.toJSON()),
      diaryTopicLinks: links.map((l) => l.toJSON()),
      notes: notes.map((n) => n.toJSON()),
      folders: folders.map((f) => f.toJSON()),
    };
  }

  static async restoreUserData(userId: string, data: Record<string, unknown>) {
    let restoredCounts = {
      diaryEntries: 0,
      topicPages: 0,
      notes: 0,
      folders: 0,
    };

    if (Array.isArray(data.folders)) {
      for (const item of data.folders) {
        if (item.name) {
          await FolderModel.findOneAndUpdate(
            { userId, name: item.name },
            { $setOnInsert: { userId, name: item.name } },
            { upsert: true },
          );
          restoredCounts.folders++;
        }
      }
    }

    if (Array.isArray(data.diaryEntries)) {
      for (const item of data.diaryEntries) {
        if (item.dateKey) {
          await DiaryEntryModel.findOneAndUpdate(
            { userId, dateKey: item.dateKey },
            {
              $set: {
                content: item.content || "",
                timezone: item.timezone || "UTC",
              },
            },
            { upsert: true },
          );
          restoredCounts.diaryEntries++;
        }
      }
    }

    if (Array.isArray(data.topicPages)) {
      for (const item of data.topicPages) {
        if (item.title) {
          await TopicPageModel.create({
            userId,
            title: item.title,
            content: item.content || "",
          });
          restoredCounts.topicPages++;
        }
      }
    }

    if (Array.isArray(data.notes)) {
      for (const item of data.notes) {
        await NoteModel.create({
          userId,
          title: item.title || "Untitled Note",
          content: item.content || "",
          tags: Array.isArray(item.tags) ? item.tags : [],
          isPinned: Boolean(item.isPinned),
        });
        restoredCounts.notes++;
      }
    }

    return restoredCounts;
  }

  static async deleteAccount(userId: string): Promise<void> {
    const attachments = await AttachmentModel.find({ userId });
    await deleteAttachmentAssets(attachments);
    await Promise.all([
      UserModel.findByIdAndDelete(userId),
      SessionModel.deleteMany({ userId }),
      DiaryEntryModel.deleteMany({ userId }),
      TopicPageModel.deleteMany({ userId }),
      DiaryTopicLinkModel.deleteMany({ userId }),
      NoteModel.deleteMany({ userId }),
      FolderModel.deleteMany({ userId }),
      AttachmentModel.deleteMany({ userId }),
    ]);
  }
}
