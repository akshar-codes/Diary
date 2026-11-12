import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.details,
    });
    return;
  }

  // Handle Mongoose CastError / ValidationError / MongoServerError
  const errorObj = err as { name?: string; code?: number; message?: string };

  if (errorObj?.code === 11000) {
    res.status(409).json({
      success: false,
      error: "Duplicate record already exists.",
    });
    return;
  }

  if (errorObj?.name === "CastError") {
    res.status(400).json({
      success: false,
      error: "Invalid resource ID format.",
    });
    return;
  }

  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error occurred.",
  });
}
