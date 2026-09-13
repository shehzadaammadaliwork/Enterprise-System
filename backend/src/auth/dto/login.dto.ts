import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;

  /// Present only once the user's account has 2FA enabled.
  @IsOptional()
  @IsString()
  totpCode?: string;

  /// Controls whether the refresh-token cookie persists across browser
  /// restarts (Section 5 spec doesn't define this; the "Remember me" UX
  /// convention is: unchecked -> session cookie, cleared when the browser
  /// closes). Defaults to true so most API/non-browser callers keep today's
  /// behavior.
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
