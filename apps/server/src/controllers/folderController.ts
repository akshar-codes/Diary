import { Request, Response, NextFunction } from "express";
import { FolderService } from "../services/folderService";

export class FolderController {
  static async getFolders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const folders = await FolderService.getFolders(req.userId!);
      res.json({
        success: true,
        data: folders,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createFolder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const folder = await FolderService.createFolder(req.userId!, req.body);
      res.status(201).json({
        success: true,
        message: "Folder created",
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateFolder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const folder = await FolderService.updateFolder(
        req.userId!,
        id,
        req.body,
      );
      res.json({
        success: true,
        message: "Folder updated",
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFolder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      await FolderService.deleteFolder(req.userId!, id);
      res.json({
        success: true,
        message: "Folder deleted",
      });
    } catch (error) {
      next(error);
    }
  }
}
