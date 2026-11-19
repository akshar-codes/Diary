import { BrevoClient } from "@getbrevo/brevo";
import { env } from "../config/env";

export class EmailService {
  private static client: BrevoClient | null = null;

  private static getClient(): BrevoClient | null {
    if (!env.BREVO_API_KEY) {
      return null;
    }
    if (!this.client) {
      this.client = new BrevoClient({ apiKey: env.BREVO_API_KEY });
    }
    return this.client;
  }

  static buildVerificationEmailHtml(
    name: string,
    verifyUrl: string,
    token: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Journal & Notes account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background-color: #ffffff;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background-color: #18181b; color: #ffffff; border-radius: 12px; font-weight: 700; font-size: 20px;">
                J
              </div>
              <h1 style="margin: 16px 0 4px 0; font-size: 22px; font-weight: 700; color: #18181b; letter-spacing: -0.02em;">
                Verify your account
              </h1>
              <p style="margin: 0; font-size: 14px; color: #71717a;">
                Journal & Notes
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 20px 32px 32px 32px; font-size: 15px; line-height: 1.6; color: #3f3f46;">
              <p style="margin: 0 0 16px 0;">
                Hello <strong>${escapeHtml(name)}</strong>,
              </p>
              <p style="margin: 0 0 24px 0;">
                Thank you for signing up! To get started with your private journal, notes, and topics, please verify your email address.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Registration Token Box -->
              <div style="background-color: #f4f4f5; border: 1px dashed #d4d4d8; border-radius: 8px; padding: 14px 16px; margin: 24px 0; text-align: center;">
                <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">
                  Registration Token
                </span>
                <code style="font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; color: #09090b; word-break: break-all;">
                  ${token}
                </code>
              </div>

              <p style="margin: 0 0 12px 0; font-size: 13px; color: #71717a;">
                This link and registration token will expire in <strong>24 hours</strong>. If you did not create this account, you can safely ignore this email.
              </p>

              <!-- Fallback URL -->
              <p style="margin: 20px 0 0 0; font-size: 12px; color: #a1a1aa; word-break: break-all;">
                Or copy and paste this URL into your browser:<br>
                <a href="${verifyUrl}" style="color: #3b82f6; text-decoration: underline;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #fafafa; border-top: 1px solid #f4f4f5; text-align: center; font-size: 12px; color: #a1a1aa;">
              &copy; ${new Date().getFullYear()} Journal & Notes. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  static async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
    const htmlContent = this.buildVerificationEmailHtml(name, verifyUrl, token);
    const textContent = `Hello ${name},\n\nPlease verify your email by clicking the link below or entering the token:\n\nVerify Link: ${verifyUrl}\nRegistration Token: ${token}\n\nThis link will expire in 24 hours.\nIf you did not create this account, please ignore this email.`;

    const client = this.getClient();

    if (!client) {
      console.log(
        "----------------------------------------------------------------",
      );
      console.log("[Brevo EmailService: Local Development Mode]");
      console.log(`To: ${name} <${to}>`);
      console.log(`Verify URL: ${verifyUrl}`);
      console.log(`Registration Token: ${token}`);
      console.log(
        "----------------------------------------------------------------",
      );
      return;
    }

    try {
      await client.transactionalEmails.sendTransacEmail({
        sender: {
          name: env.EMAIL_SENDER_NAME,
          email: env.EMAIL_SENDER_ADDRESS,
        },
        to: [
          {
            email: to,
            name,
          },
        ],
        subject: "Verify your Journal & Notes account",
        htmlContent,
        textContent,
      });
    } catch (error: any) {
      console.error(
        "[Brevo EmailService Error]:",
        error?.response?.body || error.message || error,
      );
      // Log verify link as fallback in case email delivery fails so registration isn't permanently locked out
      console.log(`Fallback Verify URL: ${verifyUrl}`);
      throw new Error("Failed to send verification email. Please try again.");
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
