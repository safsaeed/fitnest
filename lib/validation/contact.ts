import { z } from "zod";

export const PHONE_INPUT_PATTERN = "[+()0-9\\s-]{7,20}";

export function createPhoneSchema(field = "Phone number") {
  return z
    .string()
    .trim()
    .min(1, `${field} is required.`)
    .min(7, `Enter a valid ${field.toLowerCase()}.`)
    .max(20, `${field} is too long.`)
    .regex(/^\+?[0-9() -]+$/, {
      message: `Enter a valid ${field.toLowerCase()} using numbers, spaces, +, -, or brackets.`,
    })
    .refine((value) => value.replace(/\D/g, "").length >= 10, {
      message: `Enter a valid ${field.toLowerCase()} with at least 10 digits.`,
    })
    .refine((value) => value.replace(/\D/g, "").length <= 15, {
      message: `${field} must not have more than 15 digits.`,
    });
}

export const phoneSchema = createPhoneSchema();

export const emergencyContactNameSchema = z
  .string()
  .trim()
  .min(2, "Emergency contact name is required.")
  .max(100, "Emergency contact name is too long.");

export const emergencyContactPhoneSchema = createPhoneSchema(
  "Emergency contact phone number",
);
