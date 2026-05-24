import { z } from "zod";
import { emailSchema, phoneSchema, requiredString, yearsAgo } from "./common";

export const childSchema = z.object({
  firstName: requiredString("Child first name").max(50, "First name is too long"),
  lastName: requiredString("Child last name").max(50, "Last name is too long"),
  dateOfBirth: z.coerce.date().max(yearsAgo(1), {
    message: "Child must be at least 1 year old",
  }),
});

export const bookingSchema = z.object({
  parentFirstName: requiredString("First name").max(50, "First name is too long"),
  parentLastName: requiredString("Last name").max(50, "Last name is too long"),
  email: emailSchema,
  phone: phoneSchema,
  children: z.array(childSchema).min(1, "Add at least one child"),
});