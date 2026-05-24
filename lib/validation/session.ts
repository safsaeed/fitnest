import { z } from "zod";
import { positiveInteger, requiredString, startOfToday } from "./common";

export const getSessionSchema = (mode: "create" | "edit") =>
  z.object({
    title: requiredString("Session title").max(100, "Session title is too long"),

    startsAt: z.coerce.date().refine(
      (date) => mode === "edit" || date >= startOfToday(),
      {
        message: "Session cannot be in the past",
      }
    ),

    capacity: positiveInteger("Capacity", 1, 500),

    price: z.coerce
      .number()
      .min(0, "Price cannot be negative")
      .max(100000, "Price is too high"),

    durationMinutes: positiveInteger("Duration", 15, 1440),
  });