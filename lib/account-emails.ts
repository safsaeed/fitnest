import "server-only";
import { getEmailFromAddress, resend } from "@/lib/email";

type AccountWelcomeEmailInput = {
  to: string;
  parentName: string;
  accountUrl: string;
  childrenUrl: string;
  membershipUrl: string;
};

export async function sendAccountWelcomeEmail({
  to,
  parentName,
  accountUrl,
  childrenUrl,
  membershipUrl,
}: AccountWelcomeEmailInput) {
  const subject = "Welcome to your Fitnest Studios account";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Welcome to Fitnest Studios</h1>

      <p>Hi ${parentName},</p>

      <p>Your parent account has been created successfully.</p>

      <p>You can now save child details, view account bookings, and manage membership from your account.</p>

      <p style="margin: 20px 0;">
        <a href="${accountUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">Go to my account</a>
      </p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Save child details:</strong> <a href="${childrenUrl}">${childrenUrl}</a></p>
        <p style="margin: 0;"><strong>Membership:</strong> <a href="${membershipUrl}">${membershipUrl}</a></p>
      </div>

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Welcome to Fitnest Studios

Hi ${parentName},

Your parent account has been created successfully.

You can now save child details, view account bookings, and manage membership from your account.

Account: ${accountUrl}
Save child details: ${childrenUrl}
Membership: ${membershipUrl}

Thanks,
Fitnest Studios
  `.trim();

  const { error } = await resend.emails.send({
    from: getEmailFromAddress(),
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}

type PasswordResetEmailInput = {
  to: string;
  parentName: string;
  resetUrl: string;
};

export async function sendParentPasswordResetEmail({
  to,
  parentName,
  resetUrl,
}: PasswordResetEmailInput) {
  const subject = "Reset your Fitnest Studios password";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Reset your password</h1>

      <p>Hi ${parentName},</p>

      <p>We received a request to reset the password for your Fitnest Studios parent account.</p>

      <p style="margin: 20px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">Reset password</a>
      </p>

      <p>This link will expire in 1 hour. If you did not request this, you can ignore this email.</p>

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Reset your password

Hi ${parentName},

We received a request to reset the password for your Fitnest Studios parent account.

Reset password: ${resetUrl}

This link will expire in 1 hour. If you did not request this, you can ignore this email.

Thanks,
Fitnest Studios
  `.trim();

  const { error } = await resend.emails.send({
    from: getEmailFromAddress(),
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

type PasswordChangedEmailInput = {
  to: string;
  parentName: string;
  loginUrl: string;
};

export async function sendParentPasswordChangedEmail({
  to,
  parentName,
  loginUrl,
}: PasswordChangedEmailInput) {
  const subject = "Your Fitnest Studios password was changed";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Password changed</h1>

      <p>Hi ${parentName},</p>

      <p>Your Fitnest Studios parent account password has been changed.</p>

      <p>If this was you, no further action is needed.</p>

      <p>If you did not make this change, please contact Fitnest Studios as soon as possible.</p>

      <p style="margin: 20px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">Go to login</a>
      </p>

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Password changed

Hi ${parentName},

Your Fitnest Studios parent account password has been changed.

If this was you, no further action is needed.

If you did not make this change, please contact Fitnest Studios as soon as possible.

Login: ${loginUrl}

Thanks,
Fitnest Studios
  `.trim();

  const { error } = await resend.emails.send({
    from: getEmailFromAddress(),
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send password changed email: ${error.message}`);
  }
}
