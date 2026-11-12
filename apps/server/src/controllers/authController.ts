import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";

export class AuthController {
  static async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.register(req.body, userAgent, ipAddress);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.login(req.body, userAgent, ipAddress);

      res.json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshToken(
        refreshToken,
        userAgent,
        ipAddress,
      );

      res.json({
        success: true,
        message: "Token refreshed",
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (req.sessionId) {
        await AuthService.logout(req.sessionId);
      }
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await AuthService.getUserById(req.userId!);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSessions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sessions = await AuthService.listSessions(
        req.userId!,
        req.sessionId,
      );
      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async revokeSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await AuthService.revokeSession(req.userId!, req.params.id);
      res.json({
        success: true,
        message: "Session revoked successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
