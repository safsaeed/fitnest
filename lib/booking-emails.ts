import "server-only";
import { getEmailFromAddress, resend } from "@/lib/email";
import { formatFullDateTime, formatPrice, formatTime } from "@/lib/formatters";

type BookingConfirmationEmailInput = {
  to: string;
  parentName: string;
  bookingReference: string;
  venueName: string;
  venueAddress: string;
  sessionTitle: string;
  startsAt: Date;
  endsAt: Date;
  children: {
    firstName: string;
    lastName: string | null;
  }[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  totalAmountPence: number;
  unitPricePence?: number;
  bookingUrl?: string;
  accountBookingUrl?: string | null;
};

export async function sendBookingConfirmationEmail({
  to,
  parentName,
  bookingReference,
  venueName,
  venueAddress,
  sessionTitle,
  startsAt,
  endsAt,
  children,
  emergencyContactName,
  emergencyContactPhone,
  totalAmountPence,
  unitPricePence,
  bookingUrl,
  accountBookingUrl,
}: BookingConfirmationEmailInput) {
  const childNames = children
    .map((child) => [child.firstName, child.lastName].filter(Boolean).join(" "))
    .join(", ");

  const subject = `Booking confirmed: ${bookingReference}`;
  const bookingLinkHtml = bookingUrl
    ? `<p style="margin: 20px 0;"><a href="${bookingUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">View booking</a></p>`
    : "";

  const accountLinkHtml = accountBookingUrl
    ? `<p style="margin: 12px 0 0; font-size: 14px;">You can also view this booking from your parent account: <a href="${accountBookingUrl}">${accountBookingUrl}</a></p>`
    : "";

  const pricePerChildHtml =
    typeof unitPricePence === "number"
      ? `<p style="margin: 0 0 8px;"><strong>Price per child:</strong> ${formatPrice(unitPricePence)}</p>`
      : "";

  const emergencyContactHtml =
    emergencyContactName && emergencyContactPhone
      ? `<p style="margin: 0 0 8px;"><strong>Emergency contact:</strong> ${emergencyContactName} · ${emergencyContactPhone}</p>`
      : "";

  const emergencyContactText =
    emergencyContactName && emergencyContactPhone
      ? `Emergency contact: ${emergencyContactName} · ${emergencyContactPhone}`
      : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Booking confirmed</h1>

      <p>Hi ${parentName},</p>

      <p>Your booking has been confirmed. Please keep this email for your records.</p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Booking reference:</strong> ${bookingReference}</p>
        <p style="margin: 0 0 8px;"><strong>Session:</strong> ${sessionTitle}</p>
        <p style="margin: 0 0 8px;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 0 0 8px;"><strong>Address:</strong> ${venueAddress || "TBC"}</p>
        <p style="margin: 0 0 8px;"><strong>Date/time:</strong> ${formatFullDateTime(startsAt)} - ${formatTime(endsAt)}</p>
        <p style="margin: 0 0 8px;"><strong>Children:</strong> ${childNames}</p>
        ${emergencyContactHtml}
        ${pricePerChildHtml}
        <p style="margin: 0;"><strong>Total paid:</strong> ${formatPrice(totalAmountPence)}</p>
      </div>

      ${bookingLinkHtml}
      ${accountLinkHtml}

      <p>Bookings and cancellations are available until the session starts. Cancellations made within 24 hours of the session are non-refundable.</p>

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Booking confirmed

Hi ${parentName},

Your booking has been confirmed.

Booking reference: ${bookingReference}
Session: ${sessionTitle}
Venue: ${venueName}
Address: ${venueAddress || "TBC"}
Date/time: ${formatFullDateTime(startsAt)} - ${formatTime(endsAt)}
Children: ${childNames}
${emergencyContactText}
${typeof unitPricePence === "number" ? `Price per child: ${formatPrice(unitPricePence)}` : ""}
Total paid: ${formatPrice(totalAmountPence)}
${bookingUrl ? `\nView booking: ${bookingUrl}` : ""}
${accountBookingUrl ? `\nView in your account: ${accountBookingUrl}` : ""}

Bookings and cancellations are available until the session starts. Cancellations made within 24 hours of the session are non-refundable.

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
      `Failed to send booking confirmation email: ${error.message}`,
    );
  }
}

type BookingCancellationEmailInput = {
  to: string;
  parentName: string;
  bookingReference: string;
  venueName: string;
  sessionTitle: string;
  startsAt: Date;
  children: {
    firstName: string;
    lastName: string | null;
  }[];
  totalAmountPence: number;
  refunded: boolean;
  bookingUrl?: string;
  accountBookingUrl?: string | null;
};

export async function sendBookingCancellationEmail({
  to,
  parentName,
  bookingReference,
  venueName,
  sessionTitle,
  startsAt,
  children,
  totalAmountPence,
  refunded,
  bookingUrl,
  accountBookingUrl,
}: BookingCancellationEmailInput) {
  const childNames = children
    .map((child) => [child.firstName, child.lastName].filter(Boolean).join(" "))
    .join(", ");

  const subject = `Booking cancelled: ${bookingReference}`;

  const bookingLinkHtml = bookingUrl
    ? `<p style="margin: 20px 0;"><a href="${bookingUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;">View booking</a></p>`
    : "";

  const accountLinkHtml = accountBookingUrl
    ? `<p style="margin: 12px 0 0; font-size: 14px;">You can also view this booking from your parent account: <a href="${accountBookingUrl}">${accountBookingUrl}</a></p>`
    : "";

  const outcomeSummary = refunded
    ? "Your booking has been cancelled and a refund has been processed."
    : "Your booking has been cancelled. Because it was cancelled within 24 hours of the session, it is non-refundable.";

  const refundAmountHtml = refunded
    ? `<p style="margin: 0;"><strong>Refund amount:</strong> ${formatPrice(totalAmountPence)}</p>`
    : `<p style="margin: 0;"><strong>Refund:</strong> No refund is due</p>`;

  const refundFollowUpHtml = refunded
    ? "<p>Please allow a few working days for the refund to appear on your original payment method.</p>"
    : "";

  const refundAmountText = refunded
    ? `Refund amount: ${formatPrice(totalAmountPence)}`
    : "Refund: No refund is due";

  const refundFollowUpText = refunded
    ? "\nPlease allow a few working days for the refund to appear on your original payment method."
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Booking cancelled</h1>

      <p>Hi ${parentName},</p>

      <p>${outcomeSummary}</p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Booking reference:</strong> ${bookingReference}</p>
        <p style="margin: 0 0 8px;"><strong>Session:</strong> ${sessionTitle}</p>
        <p style="margin: 0 0 8px;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 0 0 8px;"><strong>Date/time:</strong> ${formatFullDateTime(startsAt)}</p>
        <p style="margin: 0 0 8px;"><strong>Children:</strong> ${childNames}</p>
        ${refundAmountHtml}
      </div>

      ${bookingLinkHtml}
      ${accountLinkHtml}

      ${refundFollowUpHtml}

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Booking cancelled

Hi ${parentName},

${outcomeSummary}

Booking reference: ${bookingReference}
Session: ${sessionTitle}
Venue: ${venueName}
Date/time: ${formatFullDateTime(startsAt)}
Children: ${childNames}
${refundAmountText}
${bookingUrl ? `\nView booking: ${bookingUrl}` : ""}
${accountBookingUrl ? `\nView in your account: ${accountBookingUrl}` : ""}

${refundFollowUpText}

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
    throw new Error(`Failed to send cancellation email: ${error.message}`);
  }
}
