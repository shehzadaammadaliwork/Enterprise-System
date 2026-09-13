import { HttpException, HttpStatus } from '@nestjs/common';

/// Domain-level exception carrying a stable machine-readable `code` for the
/// error envelope (Section 5: `{ success:false, error:{ code, message } }`).
/// Prefer this over throwing bare NestJS exceptions when the frontend needs
/// to branch on the specific failure (e.g. "ACCOUNT_LOCKED" vs "INVALID_CREDENTIALS").
export class AppException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}
