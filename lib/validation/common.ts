import { z } from "zod";
import { startOfToday, yearsAgo } from "@/lib/date-time";

export const requiredString = (field = "This field") =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`);

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address");

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number is too long")
  .regex(/^[+()\d\s-]+$/, "Enter a valid phone number");

export const positiveInteger = (field: string, min = 1, max = 999) =>
  z.coerce
    .number()
    .int(`${field} must be a whole number`)
    .min(min, `${field} must be at least ${min}`)
    .max(max, `${field} must be no more than ${max}`);

export { startOfToday, yearsAgo };
