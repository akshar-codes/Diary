import { Request, Response, NextFunction } from "express";
import { NoteService } from "../services/noteService";
import { NoteStatusFilter, NoteSortOption } from "@notes/shared";

export class NoteController {
  static async getNotes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 30;
      const status = (req.query.status as NoteStatusFilter) || "active";
      const folderId = req.query.folderId as string | undefined;
      const tag = req.query.tag as string | undefined;
      const isPinned =
        req.query.isPinned !== undefined
          ? req.query.isPinned === "true"
          : undefined;
      const search = req.query.search as string | undefined;
      const sort = req.query.sort as NoteSortOption | undefined;

      const result = await NoteService.getNotes(req.userId!, {
        status,
        folderId,
        tag,
        isPinned,
        search,
        sort,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNoteById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await NoteService.getNoteById(req.userId!, id);
      res.json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createNote(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const note = await NoteService.createNote(req.userId!, req.body);
      res.status(201).json({
        success: true,
        message: "Note created",
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateNote(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await NoteService.updateNote(req.userId!, id, req.body);
      res.json({
        success: true,
        message: "Note updated",
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async moveToTrash(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await NoteService.moveToTrash(req.userId!, id);
      res.json({
        success: true,
        message: "Note moved to trash",
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async restoreFromTrash(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await NoteService.restoreFromTrash(req.userId!, id);
      res.json({
        success: true,
        message: "Note restored from trash",
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async permanentDelete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      await NoteService.permanentDelete(req.userId!, id);
      res.json({
        success: true,
        message: "Note permanently deleted",
      });
    } catch (error) {
      next(error);
    }
  }

  static async emptyTrash(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await NoteService.emptyTrash(req.userId!);
      res.json({
        success: true,
        message: `Trash emptied (${result.deletedCount} notes removed)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async purgeOldTrash(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const days = req.body.days ? parseInt(req.body.days, 10) : 30;
      const count = await NoteService.purgeOldTrash(days);
      res.json({
        success: true,
        message: `Purged ${count} notes older than ${days} days from trash.`,
        data: { purgedCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  static async togglePin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await NoteService.togglePin(req.userId!, id);
      res.json({
        success: true,
        message: note.isPinned ? "Note pinned" : "Note unpinned",
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleArchive(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await NoteService.toggleArchive(req.userId!, id);
      res.json({
        success: true,
        message: note.archivedAt ? "Note archived" : "Note unarchived",
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async duplicateNote(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await NoteService.duplicateNote(req.userId!, id);
      res.status(201).json({
        success: true,
        message: "Note duplicated",
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTags(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tags = await NoteService.getTags(req.userId!);
      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  }
}
