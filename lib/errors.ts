export class AppError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error && error.message.includes("timed out")) {
    return new AppError("External service timeout. Please try again.", "TIMEOUT", 504);
  }
  return new AppError("Something went wrong while processing the report.", "UNKNOWN", 500);
}
