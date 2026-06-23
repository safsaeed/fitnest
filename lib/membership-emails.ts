import "server-only";
import { getEmailFromAddress, resend } from "@/lib/email";

type MembershipEmailInput = {
  to: string;
  parentName: string;
  membershipUrl: string;
  portalUrl?: string;
  currentPeriodEnd?: Date | null;
};

function formatDate(date?: Date | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(date);
}

export async function sendMembershipActiveEmail({
  to,
  parentName,
  membershipUrl,
  currentPeriodEnd,
}: MembershipEmailInput) {
  const subject = "Your Fitnest Studios membership is active";
  const formattedPeriodEnd = formatDate(currentPeriodEnd);

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Membership active</h1>

      <p>Hi ${parentName},</p>

      <p>Your Fitnest Studios membership is now active.</p>

      <p>You can now receive member pricing on eligible sessions for all children saved on your parent account.</p>

      ${
        formattedPeriodEnd
          ? `<p>Your current paid period runs until <strong>${formattedPeriodEnd}</strong>.</p>`
          : ""
      }

      <p style="margin: 20px 0;">
        <a href="${membershipUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">View membership</a>
      </p>

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Membership active

Hi ${parentName},

Your Fitnest Studios membership is now active.

You can now receive member pricing on eligible sessions for all children saved on your parent account.
${formattedPeriodEnd ? `\nYour current paid period runs until ${formattedPeriodEnd}.` : ""}

View membership: ${membershipUrl}

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
    throw new Error(`Failed to send membership active email: ${error.message}`);
  }
}

export async function sendMembershipPaymentFailedEmail({
  to,
  parentName,
  membershipUrl,
}: MembershipEmailInput) {
  const subject = "Action needed: Fitnest Studios membership payment failed";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Membership payment failed</h1>

      <p>Hi ${parentName},</p>

      <p>We could not collect payment for your Fitnest Studios membership.</p>

      <p>Member pricing is unavailable while your membership payment is unresolved. Please update your billing details to continue receiving member prices.</p>

      <p style="margin: 20px 0;">
        <a href="${membershipUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">Manage membership</a>
      </p>

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Membership payment failed

Hi ${parentName},

We could not collect payment for your Fitnest Studios membership.

Member pricing is unavailable while your membership payment is unresolved. Please update your billing details to continue receiving member prices.

Manage membership: ${membershipUrl}

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
    throw new Error(
      `Failed to send membership payment failed email: ${error.message}`,
    );
  }
}

export async function sendMembershipCancelledEmail({
  to,
  parentName,
  membershipUrl,
  currentPeriodEnd,
}: MembershipEmailInput) {
  const subject = "Your Fitnest Studios membership has been cancelled";
  const formattedPeriodEnd = formatDate(currentPeriodEnd);

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Membership cancelled</h1>

      <p>Hi ${parentName},</p>

      <p>Your Fitnest Studios membership has been cancelled.</p>

      ${
        formattedPeriodEnd
          ? `<p>If your cancellation was scheduled for the end of your paid period, your member benefits continue until <strong>${formattedPeriodEnd}</strong>.</p>`
          : `<p>Member pricing is no longer available on your account.</p>`
      }

      <p style="margin: 20px 0;">
        <a href="${membershipUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">View membership</a>
      </p>

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Membership cancelled

Hi ${parentName},

Your Fitnest Studios membership has been cancelled.
${
  formattedPeriodEnd
    ? `If your cancellation was scheduled for the end of your paid period, your member benefits continue until ${formattedPeriodEnd}.`
    : "Member pricing is no longer available on your account."
}

View membership: ${membershipUrl}

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
    throw new Error(
      `Failed to send membership cancelled email: ${error.message}`,
    );
  }
}
