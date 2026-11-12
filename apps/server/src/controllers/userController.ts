import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService";

export class UserController {
  static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await UserService.getProfile(req.userId!);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const profile = await UserService.updateProfile(req.userId!, req.body);
      res.json({
        success: true,
        message: "Profile updated successfully",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await UserService.changePassword(req.userId!, req.body);
      res.json({
        success: true,
        message: "Password changed successfully. Please log in again.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportData(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const backup = await UserService.exportUserData(req.userId!);
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="notes-diary-export-${new Date().toISOString().split("T")[0]}.json"`,
      );
      res.json({
        success: true,
        data: backup,
      });
    } catch (error) {
      next(error);
    }
  }

  static async restoreData(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await UserService.restoreUserData(req.userId!, req.body);
      res.json({
        success: true,
        message: "Data restored successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await UserService.deleteAccount(req.userId!);
      res.json({
        success: true,
        message:
          "Account and all associated personal data permanently deleted.",
      });
    } catch (error) {
      next(error);
    }
  }
}
