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
declare const _default: () => AppConfig;
export default _default;
