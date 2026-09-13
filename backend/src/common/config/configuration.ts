export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  frontendUrl: string;
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  passwordReset: {
    otpTtlMinutes: number;
    otpMaxAttempts: number;
    sessionTtlMinutes: number;
  };
  loginSecurity: {
    maxFailedAttempts: number;
    lockoutMinutes: number;
  };
  encryption: {
    fieldKey: string;
  };
  redis: {
    host: string;
    port: number;
  };
  csrf: {
    secret: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  passwordReset: {
    otpTtlMinutes: parseInt(process.env.PASSWORD_RESET_OTP_TTL_MIN ?? '10', 10),
    otpMaxAttempts: parseInt(
      process.env.PASSWORD_RESET_OTP_MAX_ATTEMPTS ?? '5',
      10,
    ),
    sessionTtlMinutes: parseInt(
      process.env.PASSWORD_RESET_SESSION_TTL_MIN ?? '10',
      10,
    ),
  },
  loginSecurity: {
    maxFailedAttempts: parseInt(
      process.env.LOGIN_MAX_FAILED_ATTEMPTS ?? '5',
      10,
    ),
    lockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES ?? '15', 10),
  },
  encryption: {
    fieldKey: process.env.FIELD_ENCRYPTION_KEY ?? '',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  csrf: {
    secret: process.env.CSRF_SECRET ?? '',
  },
});
