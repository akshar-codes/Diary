import { Types } from "mongoose";
import { FolderModel, IFolder } from "../models/Folder";
import { NoteModel } from "../models/Note";
import { AppError } from "../middlewares/errorMiddleware";
import {
  CreateFolderInput,
  UpdateFolderInput,
  NoteFolder,
} from "@notes/shared";

export class FolderService {
  static async getFolders(userId: string): Promise<NoteFolder[]> {
    const folders = await FolderModel.find({ userId }).sort({ name: 1 });

    const counts = await NoteModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), deletedAt: null } },
      { $group: { _id: "$folderId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c._id) {
        countMap.set(c._id.toString(), c.count);
      }
    }

    return folders.map((f) => ({
      id: f._id.toString(),
      userId: f.userId.toString(),
      name: f.name,
      noteCount: countMap.get(f._id.toString()) || 0,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));
  }

  static async createFolder(
    userId: string,
    input: CreateFolderInput,
  ): Promise<NoteFolder> {
    const existing = await FolderModel.findOne({ userId, name: input.name });
    if (existing) {
      throw new AppError("A folder with this name already exists.", 409);
    }

    const folder = await FolderModel.create({
      userId,
      name: input.name,
    });

    return {
      id: folder._id.toString(),
      userId: folder.userId.toString(),
      name: folder.name,
      noteCount: 0,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }

  static async updateFolder(
    userId: string,
    id: string,
    input: UpdateFolderInput,
  ): Promise<NoteFolder> {
    const folder = await FolderModel.findOne({ _id: id, userId });
    if (!folder) {
      throw new AppError("Folder not found.", 404);
    }

    if (input.name && input.name !== folder.name) {
      const existing = await FolderModel.findOne({ userId, name: input.name });
      if (existing) {
        throw new AppError("A folder with this name already exists.", 409);
      }
      folder.name = input.name;
      await folder.save();
    }

    const count = await NoteModel.countDocuments({
      userId,
      folderId: folder._id,
      deletedAt: null,
    });

    return {
      id: folder._id.toString(),
      userId: folder.userId.toString(),
      name: folder.name,
      noteCount: count,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }

  static async deleteFolder(userId: string, id: string): Promise<void> {
    const folder = await FolderModel.findOne({ _id: id, userId });
    if (!folder) {
      throw new AppError("Folder not found.", 404);
    }

    // Set folderId to null on all notes in this folder (do NOT delete the notes)
    await Promise.all([
      FolderModel.findByIdAndDelete(id),
      NoteModel.updateMany(
        { userId, folderId: id },
        { $set: { folderId: null } },
      ),
    ]);
  }
}
