import nodemailer from "nodemailer";
import { envConfig } from "../config/env";

interface PasswordResetEmailInput {
  email: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
const SMTP_GREETING_TIMEOUT_MS = 10_000;
const SMTP_SOCKET_TIMEOUT_MS = 20_000;

const hasCompleteMailConfig = () => {
  const mailConfig = envConfig.mail;

  return Boolean(
    mailConfig.host &&
      typeof mailConfig.port === "number" &&
      typeof mailConfig.secure === "boolean" &&
      mailConfig.user &&
      mailConfig.pass &&
      mailConfig.from
  );
};

const buildPasswordResetEmailHtml = ({
  name,
  resetUrl,
  expiresInMinutes
}: PasswordResetEmailInput) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your Bookora password</title>
  </head>
  <body style="margin:0;padding:0;background:#f5efe5;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5efe5;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(49,46,43,0.12);">
            <tr>
              <td style="padding:40px 32px;background:linear-gradient(135deg,#2c1f44 0%,#6b4e9b 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;opacity:0.85;">Bookora</div>
                <h1 style="margin:16px 0 0;font-size:30px;line-height:1.2;">Reset your password</h1>
                <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.86);">
                  We received a request to reset the password for your Bookora account.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.8;">Hi ${escapeHtml(name)},</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#4b5563;">
                  Use the button below to choose a new password. This link expires in ${expiresInMinutes} minutes.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                  <tr>
                    <td align="center" bgcolor="#d97706" style="border-radius:999px;">
                      <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                        Reset password
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#6b7280;">
                  If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;word-break:break-word;font-size:14px;line-height:1.8;">
                  <a href="${escapeHtml(resetUrl)}" style="color:#7c3aed;text-decoration:none;">${escapeHtml(resetUrl)}</a>
                </p>
                <p style="margin:0;font-size:14px;line-height:1.8;color:#6b7280;">
                  If you did not request a password reset, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const buildPasswordResetEmailText = ({
  name,
  resetUrl,
  expiresInMinutes
}: PasswordResetEmailInput) => {
  return [
    `Hi ${name},`,
    "",
    "We received a request to reset your Bookora password.",
    `Use this link to choose a new password. It expires in ${expiresInMinutes} minutes:`,
    resetUrl,
    "",
    "If you did not request a password reset, you can safely ignore this email."
  ].join("\n");
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  if (!hasCompleteMailConfig()) {
    if (envConfig.nodeEnv === "development") {
      console.info("[mail:development] Password reset link", {
        email: input.email,
        resetUrl: input.resetUrl,
        expiresInMinutes: input.expiresInMinutes
      });
      return;
    }

    throw new Error("Mail configuration is incomplete.");
  }

  const transporter = nodemailer.createTransport({
    host: envConfig.mail.host,
    port: envConfig.mail.port,
    secure: envConfig.mail.secure,
    requireTLS: envConfig.mail.port === 587,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
    auth: {
      user: envConfig.mail.user,
      pass: envConfig.mail.pass
    }
  });

  await transporter.sendMail({
    from: envConfig.mail.from,
    to: input.email,
    subject: "Reset your Bookora password",
    html: buildPasswordResetEmailHtml(input),
    text: buildPasswordResetEmailText(input)
  });
}
