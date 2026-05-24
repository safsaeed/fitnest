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
  totalAmountPence: number;
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
  totalAmountPence,
}: BookingConfirmationEmailInput) {
  const childNames = children
    .map((child) => [child.firstName, child.lastName].filter(Boolean).join(" "))
    .join(", ");

  const subject = `Booking confirmed: ${bookingReference}`;

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
        <p style="margin: 0;"><strong>Total paid:</strong> ${formatPrice(totalAmountPence)}</p>
      </div>

      <p>If you need to cancel, please note cancellations are only available more than 24 hours before the session start time.</p>

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
Total paid: ${formatPrice(totalAmountPence)}

Cancellations are only available more than 24 hours before the session start time.

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
    throw new Error(`Failed to send booking confirmation email: ${error.message}`);
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
}: BookingCancellationEmailInput) {
  const childNames = children
    .map((child) => [child.firstName, child.lastName].filter(Boolean).join(" "))
    .join(", ");

  const subject = `Booking cancelled: ${bookingReference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Booking cancelled</h1>

      <p>Hi ${parentName},</p>

      <p>Your booking has been cancelled and a refund has been processed.</p>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Booking reference:</strong> ${bookingReference}</p>
        <p style="margin: 0 0 8px;"><strong>Session:</strong> ${sessionTitle}</p>
        <p style="margin: 0 0 8px;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 0 0 8px;"><strong>Date/time:</strong> ${formatFullDateTime(startsAt)}</p>
        <p style="margin: 0 0 8px;"><strong>Children:</strong> ${childNames}</p>
        <p style="margin: 0;"><strong>Refund amount:</strong> ${formatPrice(totalAmountPence)}</p>
      </div>

      <p>Please allow a few working days for the refund to appear on your original payment method.</p>

      <p>Thanks,<br />Fitnest Studios</p>
    </div>
  `;

  const text = `
Booking cancelled

Hi ${parentName},

Your booking has been cancelled and a refund has been processed.

Booking reference: ${bookingReference}
Session: ${sessionTitle}
Venue: ${venueName}
Date/time: ${formatFullDateTime(startsAt)}
Children: ${childNames}
Refund amount: ${formatPrice(totalAmountPence)}

Please allow a few working days for the refund to appear on your original payment method.

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
