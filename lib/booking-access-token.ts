import crypto from "crypto";

export function generateBookingAccessToken() {
  return crypto.randomBytes(32).toString("hex");
}