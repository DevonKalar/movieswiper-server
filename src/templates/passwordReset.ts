import type { PasswordResetData, TemplateResult } from './index.js';

export function passwordResetTemplate(data: PasswordResetData): TemplateResult {
    return {
        subject: `Reset your MovieSwiper password`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1>Password reset request</h1>
  <p>Hi ${data.firstName}, we received a request to reset your MovieSwiper password.</p>
  <p>
    <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 4px;">
      Reset password
    </a>
  </p>
  <p>This link expires in <strong>${data.expiresInMinutes} minutes</strong>. If you didn't request a reset, you can ignore this email.</p>
  <p>The MovieSwiper Team</p>
</body>
</html>`.trim(),
        text: `Hi ${data.firstName},\n\nWe received a request to reset your MovieSwiper password.\n\nReset your password here: ${data.resetUrl}\n\nThis link expires in ${data.expiresInMinutes} minutes. If you didn't request a reset, you can ignore this email.\n\nThe MovieSwiper Team`,
    };
}
