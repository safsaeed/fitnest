import { z } from "zod";
import { yearsAgo } from "@/lib/date-time";
import { getFormString, getOptionalFormString } from "@/lib/form-data";

const MAX_CHILDREN_PER_BOOKING = 20;

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number.")
  .max(20, "Phone number is too long.")
  .regex(/^\+?[0-9() -]+$/, {
    message:
      "Enter a valid phone number using numbers, spaces, +, -, or brackets.",
  })
  .refine((value) => value.replace(/\D/g, "").length >= 10, {
    message: "Enter a valid phone number with at least 10 digits.",
  })
  .refine((value) => value.replace(/\D/g, "").length <= 15, {
    message: "Phone number must not have more than 15 digits.",
  });

const requiredText = ({
  field,
  min = 1,
  max,
}: {
  field: string;
  min?: number;
  max: number;
}) =>
  z
    .string()
    .trim()
    .min(min, `${field} is required.`)
    .max(max, `${field} is too long.`);

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

const childSchema = z.object({
  firstName: requiredText({
    field: "Child first name",
    max: 50,
  }),

  lastName: requiredText({
    field: "Child last name",
    max: 50,
  }),

  dateOfBirth: z
    .string()
    .trim()
    .min(1, "Child date of birth is required.")
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Enter a valid child date of birth.",
    })
    .refine((value) => parseDateOnly(value) !== null, {
      message: "Enter a valid child date of birth.",
    })
    .refine(
      (value) => {
        const date = parseDateOnly(value);

        if (!date) {
          return false;
        }

        return date <= yearsAgo(1);
      },
      {
        message: "Children must be at least 1 year old.",
      },
    ),

  allergies: requiredText({
    field: "Allergies",
    min: 2,
    max: 250,
  }),

  medicalNotes: requiredText({
    field: "Medical notes",
    min: 2,
    max: 1000,
  }),
});

const bookingFormSchema = z.object({
  venueId: requiredText({
    field: "Venue",
    max: 100,
  }),

  sessionId: requiredText({
    field: "Session",
    max: 100,
  }),

  parentName: requiredText({
    field: "Parent / guardian name",
    min: 2,
    max: 100,
  }),

  parentEmail: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(254, "Email is too long.")
    .email("Enter a valid email address."),

  parentPhone: phoneSchema,

  consentAccepted: z.string().refine((value) => value === "on", {
    message: "You must confirm parent / guardian consent before continuing.",
  }),

  marketingOptIn: z.string().optional(),

  children: z
    .array(childSchema)
    .min(1, "Add at least one child.")
    .max(
      MAX_CHILDREN_PER_BOOKING,
      `You can add up to ${MAX_CHILDREN_PER_BOOKING} children.`,
    ),
});

export type BookingFormInput = z.infer<typeof bookingFormSchema>;

function readChildCount(formData: FormData) {
  const rawChildCount = formData.get("childCount");

  if (typeof rawChildCount !== "string") {
    return 0;
  }

  const childCount = Number.parseInt(rawChildCount, 10);

  if (!Number.isInteger(childCount) || childCount < 1) {
    return 0;
  }

  return Math.min(childCount, MAX_CHILDREN_PER_BOOKING);
}

export function parseBookingFormData(formData: FormData): BookingFormInput {
  const childCount = readChildCount(formData);

  const children = Array.from({ length: childCount }, (_, index) => ({
    firstName: getFormString(formData, `children[${index}][firstName]`),
    lastName: getFormString(formData, `children[${index}][lastName]`),
    dateOfBirth: getFormString(
      formData,
      `children[${index}][dateOfBirth]`,
    ),
    allergies: getFormString(formData, `children[${index}][allergies]`),
    medicalNotes: getFormString(
      formData,
      `children[${index}][medicalNotes]`,
    ),
  }));

  return bookingFormSchema.parse({
    venueId: getFormString(formData, "venueId"),
    sessionId: getFormString(formData, "sessionId"),

    parentName: getFormString(formData, "parentName"),
    parentEmail: getFormString(formData, "parentEmail"),
    parentPhone: getFormString(formData, "parentPhone"),

    consentAccepted: getOptionalFormString(formData, "consentAccepted") ?? "",
    marketingOptIn: getOptionalFormString(formData, "marketingOptIn"),

    children,
  });
}
