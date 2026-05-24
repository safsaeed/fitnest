export function generateBookingReference() {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const datePart = new Date()
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "");

  return `FIT-${datePart}-${randomPart}`;
}