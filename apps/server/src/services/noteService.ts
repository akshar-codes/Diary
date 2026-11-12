import { Types } from "mongoose";
import { NoteModel, INote } from "../models/Note";
import { FolderModel } from "../models/Folder";
import { AttachmentModel } from "../models/Attachment";
import { AppError } from "../middlewares/errorMiddleware";
import {
  CreateNoteInput,
  UpdateNoteInput,
  Note,
  NoteStatusFilter,
  NoteSortOption,
  PaginatedResult,
} from "@notes/shared";

export interface NoteFilterOptions {
  status?: NoteStatusFilter;
  folderId?: string | null;
  tag?: string;
  isPinned?: boolean;
  search?: string;
  sort?: NoteSortOption;
  page?: number;
  limit?: number;
}

export class NoteService {
  static async getNotes(
    userId: string,
    options: NoteFilterOptions = {},
  ): Promise<PaginatedResult<Note>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId };

    const status = options.status || "active";
    if (status === "trash") {
      query.deletedAt = { $ne: null };
    } else if (status === "archived") {
      query.deletedAt = null;
      query.archivedAt = { $ne: null };
    } else {
      // active
      query.deletedAt = null;
      query.archivedAt = null;
    }

    if (options.folderId !== undefined) {
      if (options.folderId === "none" || options.folderId === null) {
        query.folderId = null;
      } else if (options.folderId) {
        query.folderId = options.folderId;
      }
    }

    if (options.tag) {
      query.tags = options.tag;
    }

    if (options.isPinned !== undefined) {
      query.isPinned = options.isPinned;
    }

    if (options.search) {
      const searchRegex = { $regex: options.search, $options: "i" };
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Sort order
    const sortObj: Record<string, 1 | -1> = {};
    if (status === "active" && options.isPinned === undefined) {
      sortObj.isPinned = -1; // Pinned notes first
    }

    switch (options.sort) {
      case "updated_asc":
        sortObj.updatedAt = 1;
        break;
      case "created_desc":
        sortObj.createdAt = -1;
        break;
      case "created_asc":
        sortObj.createdAt = 1;
        break;
      case "title_asc":
        sortObj.title = 1;
        break;
      case "title_desc":
        sortObj.title = -1;
        break;
      case "updated_desc":
      default:
        sortObj.updatedAt = -1;
        break;
    }

    const [notes, total] = await Promise.all([
      NoteModel.find(query)
        .populate("folderId", "name")
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      NoteModel.countDocuments(query),
    ]);

    const formattedNotes = notes.map((n) => {
      const json = n.toJSON() as unknown as Note;
      if (
        n.folderId &&
        typeof n.folderId === "object" &&
        "name" in n.folderId
      ) {
        const f = n.folderId as unknown as {
          _id: Types.ObjectId;
          name: string;
        };
        json.folder = {
          id: f._id.toString(),
          userId: n.userId.toString(),
          name: f.name,
          createdAt: "",
          updatedAt: "",
        };
      }
      return json;
    });

    return {
      items: formattedNotes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getNoteById(userId: string, id: string): Promise<Note> {
    const note = await NoteModel.findOne({ _id: id, userId }).populate(
      "folderId",
      "name",
    );
    if (!note) {
      throw new AppError("Note not found.", 404);
    }

    const json = note.toJSON() as unknown as Note;
    if (
      note.folderId &&
      typeof note.folderId === "object" &&
      "name" in note.folderId
    ) {
      const f = note.folderId as unknown as {
        _id: Types.ObjectId;
        name: string;
      };
      json.folder = {
        id: f._id.toString(),
        userId: note.userId.toString(),
        name: f.name,
        createdAt: "",
        updatedAt: "",
      };
    }

    // Attachments
    const attachments = await AttachmentModel.find({ noteId: id });
    json.attachments = attachments.map((a) => a.toJSON() as unknown as any);

    return json;
  }

  static async createNote(
    userId: string,
    input: CreateNoteInput,
  ): Promise<Note> {
    if (input.folderId) {
      const folder = await FolderModel.findOne({ _id: input.folderId, userId });
      if (!folder) {
        throw new AppError("Folder not found or does not belong to user.", 400);
      }
    }

    const note = await NoteModel.create({
      userId,
      title: input.title || "Untitled Note",
      content: input.content || "",
      folderId: input.folderId || null,
      tags: input.tags || [],
      isPinned: input.isPinned || false,
    });

    return note.toJSON() as unknown as Note;
  }

  static async updateNote(
    userId: string,
    id: string,
    input: UpdateNoteInput,
  ): Promise<Note> {
    const note = await NoteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new AppError("Note not found.", 404);
    }

    if (input.folderId !== undefined) {
      if (input.folderId) {
        const folder = await FolderModel.findOne({
          _id: input.folderId,
          userId,
        });
        if (!folder) {
          throw new AppError(
            "Folder not found or does not belong to user.",
            400,
          );
        }
        note.folderId = new Types.ObjectId(input.folderId);
      } else {
        note.folderId = null;
      }
    }

    if (input.title !== undefined) note.title = input.title;
    if (input.content !== undefined) note.content = input.content;
    if (input.tags !== undefined) note.tags = input.tags;
    if (input.isPinned !== undefined) note.isPinned = input.isPinned;

    await note.save();
    return note.toJSON() as unknown as Note;
  }

  static async moveToTrash(userId: string, id: string): Promise<Note> {
    const note = await NoteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new AppError("Note not found.", 404);
    }

    note.deletedAt = new Date();
    note.isPinned = false; // unpin when trashed
    await note.save();

    return note.toJSON() as unknown as Note;
  }

  static async restoreFromTrash(userId: string, id: string): Promise<Note> {
    const note = await NoteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new AppError("Note not found.", 404);
    }

    note.deletedAt = null;
    await note.save();

    return note.toJSON() as unknown as Note;
  }

  static async permanentDelete(userId: string, id: string): Promise<void> {
    const note = await NoteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new AppError("Note not found.", 404);
    }

    await Promise.all([
      NoteModel.findByIdAndDelete(id),
      AttachmentModel.deleteMany({ noteId: id }),
    ]);
  }

  static async emptyTrash(userId: string): Promise<{ deletedCount: number }> {
    const trashedNotes = await NoteModel.find({
      userId,
      deletedAt: { $ne: null },
    }).select("_id");
    const noteIds = trashedNotes.map((n) => n._id);

    const [deleteResult] = await Promise.all([
      NoteModel.deleteMany({ userId, deletedAt: { $ne: null } }),
      AttachmentModel.deleteMany({ noteId: { $in: noteIds } }),
    ]);

    return { deletedCount: deleteResult.deletedCount || 0 };
  }

  static async purgeOldTrash(retentionDays = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldNotes = await NoteModel.find({
      deletedAt: { $lte: cutoffDate },
    }).select("_id");

    const noteIds = oldNotes.map((n) => n._id);
    const result = await NoteModel.deleteMany({ _id: { $in: noteIds } });
    await AttachmentModel.deleteMany({ noteId: { $in: noteIds } });

    return result.deletedCount || 0;
  }

  static async togglePin(userId: string, id: string): Promise<Note> {
    const note = await NoteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new AppError("Note not found.", 404);
    }

    note.isPinned = !note.isPinned;
    await note.save();

    return note.toJSON() as unknown as Note;
  }

  static async toggleArchive(userId: string, id: string): Promise<Note> {
    const note = await NoteModel.findOne({ _id: id, userId });
    if (!note) {
      throw new AppError("Note not found.", 404);
    }

    note.archivedAt = note.archivedAt ? null : new Date();
    if (note.archivedAt) {
      note.isPinned = false; // unpin when archived
    }
    await note.save();

    return note.toJSON() as unknown as Note;
  }

  static async duplicateNote(userId: string, id: string): Promise<Note> {
    const original = await NoteModel.findOne({ _id: id, userId });
    if (!original) {
      throw new AppError("Note not found.", 404);
    }

    const copy = await NoteModel.create({
      userId,
      title: `${original.title} (Copy)`,
      content: original.content,
      folderId: original.folderId,
      tags: [...original.tags],
      isPinned: false,
    });

    return copy.toJSON() as unknown as Note;
  }

  static async getTags(userId: string): Promise<string[]> {
    const tags = await NoteModel.distinct("tags", {
      userId,
      deletedAt: null,
    });
    return tags.filter(Boolean).sort();
  }
}
