"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPasswordResetOtpEmail = buildPasswordResetOtpEmail;
function buildPasswordResetOtpEmail(code, ttlMinutes) {
    return {
        subject: 'Your password reset code',
        text: `Your password reset code is ${code}. It expires in ${ttlMinutes} minutes ` +
            `and can be used once. If you didn't request this, you can safely ignore this email.`,
    };
}
//# sourceMappingURL=password-reset-otp.template.js.map