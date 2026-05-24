function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function yearsAgo(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function getNowWithoutSeconds() {
  const now = new Date();
  now.setSeconds(0, 0);

  return now;
}

export function formatDateInputValue(date?: Date | null) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${year}-${month}-${day}`;
}

export function formatTimeInputValue(date?: Date | null) {
  if (!date) {
    return "";
  }

  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());

  return `${hours}:${minutes}`;
}

export function yearsAgoInputValue(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);

  return formatDateInputValue(date);
}

export function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    typeof hours !== "number" ||
    typeof minutes !== "number" ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);

  return combined;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}
