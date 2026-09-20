import "server-only";
import { getEmailFromAddress, resend } from "@/lib/email";
import {
  renderEmailButton,
  renderEmailCard,
  renderEmailDetail,
  renderEmailLink,
  renderEmailParagraph,
  renderEmailSignOff,
  renderEmailTemplate,
} from "@/lib/email-template";

type AccountWelcomeEmailInput = {
  to: string;
  parentName: string;
  accountUrl: string;
  childrenUrl: string;
};

export async function sendAccountWelcomeEmail({
  to,
  parentName,
  accountUrl,
  childrenUrl,
}: AccountWelcomeEmailInput) {
  const subject = "Welcome to your FitNest Studios account";

  const html = renderEmailTemplate({
    preheader: "Your FitNest Studios parent account is ready.",
    eyebrow: "Welcome",
    title: "Welcome to FitNest Studios",
    contentHtml: [
      renderEmailParagraph(`Hi ${parentName},`),
      renderEmailParagraph(
        "Your parent account has been created successfully.",
      ),
      renderEmailParagraph(
        "You can now save child details and manage bookings from your account.",
      ),
      renderEmailButton(accountUrl, "Go to my account"),
      renderEmailCard(
        renderEmailDetail(
          "Save child details",
          renderEmailLink(childrenUrl, "Manage children"),
          true,
        ),
      ),
      renderEmailSignOff(),
    ].join(""),
  });

  const text = `
Welcome to FitNest Studios

Hi ${parentName},

Your parent account has been created successfully.

You can now save child details and manage bookings from your account.

Account: ${accountUrl}
Save child details: ${childrenUrl}

Thanks,
FitNest Studios
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
  const subject = "Reset your FitNest Studios password";

  const html = renderEmailTemplate({
    preheader: "Use this secure link to reset your password.",
    eyebrow: "Account security",
    title: "Reset your password",
    contentHtml: [
      renderEmailParagraph(`Hi ${parentName},`),
      renderEmailParagraph(
        "We received a request to reset the password for your FitNest Studios parent account.",
      ),
      renderEmailButton(resetUrl, "Reset password"),
      renderEmailParagraph(
        "This link will expire in 1 hour. If you did not request this, you can ignore this email.",
        "0",
      ),
      renderEmailSignOff(),
    ].join(""),
  });

  const text = `
Reset your password

Hi ${parentName},

We received a request to reset the password for your FitNest Studios parent account.

Reset password: ${resetUrl}

This link will expire in 1 hour. If you did not request this, you can ignore this email.

Thanks,
FitNest Studios
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
  const subject = "Your FitNest Studios password was changed";

  const html = renderEmailTemplate({
    preheader: "Your FitNest Studios account password has been changed.",
    eyebrow: "Account security",
    title: "Password changed",
    contentHtml: [
      renderEmailParagraph(`Hi ${parentName},`),
      renderEmailParagraph(
        "Your FitNest Studios parent account password has been changed.",
      ),
      renderEmailParagraph("If this was you, no further action is needed."),
      renderEmailParagraph(
        "If you did not make this change, please contact FitNest Studios as soon as possible.",
      ),
      renderEmailButton(loginUrl, "Go to login"),
      renderEmailSignOff(),
    ].join(""),
  });

  const text = `
Password changed

Hi ${parentName},

Your FitNest Studios parent account password has been changed.

If this was you, no further action is needed.

If you did not make this change, please contact FitNest Studios as soon as possible.

Login: ${loginUrl}

Thanks,
FitNest Studios
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
