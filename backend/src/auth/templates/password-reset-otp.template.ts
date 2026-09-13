export function buildPasswordResetOtpEmail(
  code: string,
  ttlMinutes: number,
): { subject: string; text: string } {
  return {
    subject: 'Your password reset code',
    text:
      `Your password reset code is ${code}. It expires in ${ttlMinutes} minutes ` +
      `and can be used once. If you didn't request this, you can safely ignore this email.`,
  };
}
