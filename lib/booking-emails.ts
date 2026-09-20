import "server-only";
import { getEmailFromAddress, resend } from "@/lib/email";
import {
  renderEmailButton,
  renderEmailCard,
  renderEmailDetail,
  renderEmailLink,
  renderEmailParagraph,
  renderEmailSignOff,
  renderEmailSmallPrint,
  renderEmailTemplate,
} from "@/lib/email-template";
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
    ? renderEmailButton(bookingUrl, "View booking")
    : "";

  const accountLinkHtml = accountBookingUrl
    ? renderEmailSmallPrint(
        `You can also view this booking from your parent account: ${renderEmailLink(accountBookingUrl, "View in my account")}`,
        "12px 0 24px",
      )
    : "";

  const pricePerChildHtml =
    typeof unitPricePence === "number"
      ? renderEmailDetail("Price per child", formatPrice(unitPricePence))
      : "";

  const emergencyContactHtml =
    emergencyContactName && emergencyContactPhone
      ? renderEmailDetail(
          "Emergency contact",
          `${emergencyContactName} · ${emergencyContactPhone}`,
        )
      : "";

  const emergencyContactText =
    emergencyContactName && emergencyContactPhone
      ? `Emergency contact: ${emergencyContactName} · ${emergencyContactPhone}`
      : "";

  const bookingDetailsHtml = renderEmailCard(
    [
      renderEmailDetail("Booking reference", bookingReference),
      renderEmailDetail("Session", sessionTitle),
      renderEmailDetail("Venue", venueName),
      renderEmailDetail("Address", venueAddress || "TBC"),
      renderEmailDetail(
        "Date/time",
        `${formatFullDateTime(startsAt)} - ${formatTime(endsAt)}`,
      ),
      renderEmailDetail("Children", childNames),
      emergencyContactHtml,
      pricePerChildHtml,
      renderEmailDetail("Total paid", formatPrice(totalAmountPence), true),
    ].join(""),
  );

  const html = renderEmailTemplate({
    preheader: `Your ${sessionTitle} booking is confirmed.`,
    eyebrow: "Your booking",
    title: "Booking confirmed",
    contentHtml: [
      renderEmailParagraph("Dear Parent/Guardian,"),
      renderEmailParagraph(
        "Thank you for booking with FitNest Studios! We’re looking forward to welcoming your child and having lots of fun together.",
      ),
      bookingDetailsHtml,
      bookingLinkHtml,
      accountLinkHtml,
      renderEmailParagraph(
        "Before the session, please make sure your child has been to the toilet. If they require nappies, please bring one along for them.",
      ),
      renderEmailParagraph(
        "To help us keep our sessions safe and comfortable for everyone, we don’t allow food, milk, juice or other drinks during sessions.",
      ),
      renderEmailParagraph(
        "If your child needs a drink, you’re welcome to provide a water bottle for your child to use.",
      ),
      renderEmailParagraph(
        "Thank you so much for your understanding and cooperation. We really appreciate it!",
        "0",
      ),
      renderEmailSignOff("Kind regards,"),
    ].join(""),
  });

  const text = `
Booking confirmed

Dear Parent/Guardian,

Thank you for booking with FitNest Studios! We’re looking forward to welcoming your child and having lots of fun together.

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

Before the session, please make sure your child has been to the toilet. If they require nappies, please bring one along for them.

To help us keep our sessions safe and comfortable for everyone, we don’t allow food, milk, juice or other drinks during sessions.

If your child needs a drink, you’re welcome to provide a water bottle for your child to use.

Thank you so much for your understanding and cooperation. We really appreciate it!

Kind regards,
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
    ? renderEmailButton(bookingUrl, "View booking")
    : "";

  const accountLinkHtml = accountBookingUrl
    ? renderEmailSmallPrint(
        `You can also view this booking from your parent account: ${renderEmailLink(accountBookingUrl, "View in my account")}`,
        "12px 0 24px",
      )
    : "";

  const outcomeSummary = refunded
    ? "Your booking has been cancelled and a refund has been processed."
    : "Your booking has been cancelled. Because it was cancelled within 24 hours of the session, it is non-refundable.";

  const refundAmountHtml = refunded
    ? renderEmailDetail(
        "Refund amount",
        formatPrice(totalAmountPence),
        true,
      )
    : renderEmailDetail("Refund", "No refund is due", true);

  const refundFollowUpHtml = refunded
    ? renderEmailParagraph(
        "Please allow a few working days for the refund to appear on your original payment method.",
      )
    : "";

  const refundAmountText = refunded
    ? `Refund amount: ${formatPrice(totalAmountPence)}`
    : "Refund: No refund is due";

  const refundFollowUpText = refunded
    ? "\nPlease allow a few working days for the refund to appear on your original payment method."
    : "";

  const bookingDetailsHtml = renderEmailCard(
    [
      renderEmailDetail("Booking reference", bookingReference),
      renderEmailDetail("Session", sessionTitle),
      renderEmailDetail("Venue", venueName),
      renderEmailDetail("Date/time", formatFullDateTime(startsAt)),
      renderEmailDetail("Children", childNames),
      refundAmountHtml,
    ].join(""),
  );

  const html = renderEmailTemplate({
    preheader: `Your ${sessionTitle} booking has been cancelled.`,
    eyebrow: "Booking update",
    title: "Booking cancelled",
    contentHtml: [
      renderEmailParagraph(`Hi ${parentName},`),
      renderEmailParagraph(outcomeSummary),
      bookingDetailsHtml,
      bookingLinkHtml,
      accountLinkHtml,
      refundFollowUpHtml,
      renderEmailSignOff(),
    ].join(""),
  });

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
    throw new Error(`Failed to send cancellation email: ${error.message}`);
  }
}
