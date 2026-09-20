import "server-only";

import { getEmailFromAddress, resend } from "@/lib/email";
import {
  renderEmailButton,
  renderEmailCard,
  renderEmailDetail,
  renderEmailParagraph,
  renderEmailSignOff,
  renderEmailTemplate,
} from "@/lib/email-template";

type AccountDeactivatedEmailInput = {
  to: string;
  parentName: string;
};

export async function sendAccountDeactivatedEmail({
  to,
  parentName,
}: AccountDeactivatedEmailInput) {
  const subject = "Your FitNest Studios account has been deactivated";
  const html = renderEmailTemplate({
    preheader: "Your parent account is no longer available for login.",
    eyebrow: "Account update",
    title: "Account deactivated",
    contentHtml: [
      renderEmailParagraph(`Hi ${parentName},`),
      renderEmailParagraph(
        "Your FitNest Studios parent account has been deactivated and you have been signed out.",
      ),
      renderEmailCard(
        [
          renderEmailDetail("Existing bookings", "Remain valid"),
          renderEmailDetail("Automatic cancellations", "None", true),
        ].join(""),
      ),
      renderEmailParagraph(
        "Your saved details have not been deleted. Contact FitNest Studios if you would like to reactivate your account or request permanent deletion.",
      ),
      renderEmailParagraph(
        "If you did not make this change, please contact us as soon as possible.",
        "0",
      ),
      renderEmailSignOff(),
    ].join(""),
  });

  const text = `
Account deactivated

Hi ${parentName},

Your FitNest Studios parent account has been deactivated and you have been signed out.

Existing bookings remain valid and no bookings have been cancelled automatically.

Your saved details have not been deleted. Contact FitNest Studios if you would like to reactivate your account or request permanent deletion.

If you did not make this change, please contact us as soon as possible.

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
    throw new Error(`Failed to send account deactivation email: ${error.message}`);
  }
}

type AccountDeletionRequestedEmailInput = {
  to: string;
  parentName: string;
  requestedAt: Date;
  responseDueAt: Date;
};

export async function sendAccountDeletionRequestedEmail({
  to,
  parentName,
  requestedAt,
  responseDueAt,
}: AccountDeletionRequestedEmailInput) {
  const subject = "We received your FitNest Studios deletion request";
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  });
  const html = renderEmailTemplate({
    preheader: "Your account has been deactivated while we review your request.",
    eyebrow: "Privacy request",
    title: "Deletion request received",
    contentHtml: [
      renderEmailParagraph(`Hi ${parentName},`),
      renderEmailParagraph(
        "We received your request to permanently delete your FitNest Studios parent account. Your account has been deactivated and you have been signed out.",
      ),
      renderEmailCard(
        [
          renderEmailDetail(
            "Requested",
            dateFormatter.format(requestedAt),
          ),
          renderEmailDetail(
            "Response due by",
            dateFormatter.format(responseDueAt),
          ),
          renderEmailDetail("Existing bookings", "Remain valid", true),
        ].join(""),
      ),
      renderEmailParagraph(
        "We will delete or anonymise information that is no longer required. Some booking, payment, safeguarding, or legal records may need to be retained for an appropriate period.",
      ),
      renderEmailParagraph(
        "If you did not submit this request, or you would like to withdraw it, please contact us as soon as possible.",
        "0",
      ),
      renderEmailSignOff(),
    ].join(""),
  });

  const text = `
Deletion request received

Hi ${parentName},

We received your request to permanently delete your FitNest Studios parent account. Your account has been deactivated and you have been signed out.

Requested: ${dateFormatter.format(requestedAt)}
Response due by: ${dateFormatter.format(responseDueAt)}

Existing bookings remain valid and no bookings have been cancelled automatically.

We will delete or anonymise information that is no longer required. Some booking, payment, safeguarding, or legal records may need to be retained for an appropriate period.

If you did not submit this request, or you would like to withdraw it, please contact us as soon as possible.

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
    throw new Error(
      `Failed to send account deletion request email: ${error.message}`,
    );
  }
}

type AdminAccountDeletionRequestedEmailInput = {
  to: string[];
  parentName: string;
  parentEmail: string;
  requestedAt: Date;
  responseDueAt: Date;
  adminUrl?: string;
};

export async function sendAdminAccountDeletionRequestedEmail({
  to,
  parentName,
  parentEmail,
  requestedAt,
  responseDueAt,
  adminUrl,
}: AdminAccountDeletionRequestedEmailInput) {
  if (to.length === 0) {
    return;
  }

  const subject = `Account deletion request: ${parentName}`;
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  });
  const html = renderEmailTemplate({
    preheader: `${parentName} has requested permanent account deletion.`,
    eyebrow: "Admin action required",
    title: "New account deletion request",
    contentHtml: [
      renderEmailParagraph(
        "A parent has requested permanent account deletion. Their login has already been disabled, but their bookings remain unchanged.",
      ),
      renderEmailCard(
        [
          renderEmailDetail("Parent", parentName),
          renderEmailDetail("Email", parentEmail),
          renderEmailDetail("Requested", dateFormatter.format(requestedAt)),
          renderEmailDetail(
            "Response due by",
            dateFormatter.format(responseDueAt),
            true,
          ),
        ].join(""),
      ),
      adminUrl
        ? renderEmailButton(adminUrl, "Review deletion request")
        : renderEmailParagraph(
            "Log in to the admin dashboard to review this request.",
          ),
      renderEmailSignOff(),
    ].join(""),
  });

  const text = `
New account deletion request

${parentName} (${parentEmail}) has requested permanent account deletion.

Requested: ${dateFormatter.format(requestedAt)}
Response due by: ${dateFormatter.format(responseDueAt)}

Their login has already been disabled, but their bookings remain unchanged.

${adminUrl ? `Review request: ${adminUrl}` : "Log in to the admin dashboard to review this request."}

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
    throw new Error(
      `Failed to send admin account deletion notification: ${error.message}`,
    );
  }
}
