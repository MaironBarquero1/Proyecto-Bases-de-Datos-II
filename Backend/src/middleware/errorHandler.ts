import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";


export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void {
  const body: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(body);
}

/**
 * Sends a typed JSON error response.
 * Extracts the MySQL / SIGNAL message when available so the stored-procedure
 * business-rule messages (SQLSTATE 45000) reach the client as readable text.
 */
export function sendError(
  res: Response,
  error: unknown,
  statusCode = 500
): void {
  let message = "Error interno del servidor";

  if (error instanceof Error) {
    // mysql2 surfaces stored-procedure SIGNAL messages in .message
    message = error.message;

    // Strip the MySQL prefix for cleaner client messages
    const signalMatch = message.match(/SIGNAL.*?:\s*(.+)/);
    if (signalMatch) {
      message = signalMatch[1];
    }
  }

  const body: ApiResponse = { success: false, error: message };
  res.status(statusCode).json(body);
}

/**
 * Global 404 handler – must be registered after all routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiResponse = {
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  };
  res.status(404).json(body);
}

/**
 * Global error handler – must be the last middleware registered.
 */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[GlobalErrorHandler]", err);
  sendError(res, err, 500);
}
