import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env";
import { AttachmentModel } from "../models/Attachment";
import { NoteModel } from "../models/Note";
import { AppError } from "../middlewares/errorMiddleware";

// Ensure upload directory exists
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/json",
      "text/markdown",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Unsupported file type. Only common images and documents are allowed.",
          400,
        ),
      );
    }
  },
});

export class AttachmentController {
  static async upload(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError("No file uploaded", 400);
      }

      const noteId = req.body.noteId;
      if (noteId) {
        const note = await NoteModel.findOne({
          _id: noteId,
          userId: req.userId,
        });
        if (!note) {
          throw new AppError("Note not found or does not belong to you", 404);
        }
      }

      const attachment = await AttachmentModel.create({
        userId: req.userId,
        noteId: noteId || null,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        storageKey: req.file.filename,
      });

      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: attachment.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNoteAttachments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { noteId } = req.params;
      const attachments = await AttachmentModel.find({
        noteId,
        userId: req.userId,
      });
      res.json({
        success: true,
        data: attachments.map((a) => a.toJSON()),
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const attachment = await AttachmentModel.findOne({
        _id: id,
        userId: req.userId,
      });
      if (!attachment) {
        throw new AppError("Attachment not found", 404);
      }

      const filePath = path.join(env.UPLOAD_DIR, attachment.storageKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await AttachmentModel.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Attachment deleted",
      });
    } catch (error) {
      next(error);
    }
  }
}
