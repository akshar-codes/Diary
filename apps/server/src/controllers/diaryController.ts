import { Request, Response, NextFunction } from "express";
import { DiaryService } from "../services/diaryService";

export class DiaryController {
  static async getEntries(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;
      const search = req.query.search as string | undefined;

      const result = await DiaryService.getEntries(req.userId!, {
        page,
        limit,
        search,
      });
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEntryByDate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { date } = req.params;
      const entry = await DiaryService.getEntryByDate(req.userId!, date);
      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEntryById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const entry = await DiaryService.getEntryById(req.userId!, id);
      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  static async upsertEntry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const entry = await DiaryService.upsertEntry(req.userId!, req.body);
      res.status(200).json({
        success: true,
        message: "Diary entry saved",
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateEntry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const entry = await DiaryService.updateEntry(req.userId!, id, req.body);
      res.json({
        success: true,
        message: "Diary entry updated",
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteEntry(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      await DiaryService.deleteEntry(req.userId!, id);
      res.json({
        success: true,
        message: "Diary entry deleted",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDatesSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const startKey = req.query.startKey as string | undefined;
      const endKey = req.query.endKey as string | undefined;

      const dates = await DiaryService.getDatesSummary(
        req.userId!,
        startKey,
        endKey,
      );
      res.json({
        success: true,
        data: dates,
      });
    } catch (error) {
      next(error);
    }
  }
}
