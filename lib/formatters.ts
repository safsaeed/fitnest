export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(date);
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatFullDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPrice(pricePence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pricePence / 100);
}

export function pluraliseYear(years: number) {
  return years === 1 ? "year" : "years";
}

export function formatAgeRange(
  minAgeYears: number,
  maxAgeYears: number | null,
) {
  if (maxAgeYears === null) {
    return `${minAgeYears}+`;
  }

  if (minAgeYears === maxAgeYears) {
    return `${minAgeYears}`;
  }

  return `${minAgeYears}-${maxAgeYears}`;
}

export function formatAgeRequirement(
  minAgeYears: number,
  maxAgeYears: number | null,
) {
  if (maxAgeYears === null) {
    return `Children must be at least ${minAgeYears} ${pluraliseYear(
      minAgeYears,
    )} old.`;
  }

  if (minAgeYears === maxAgeYears) {
    return `Children must be ${minAgeYears} ${pluraliseYear(minAgeYears)} old.`;
  }

  return `Children between ${minAgeYears} and ${maxAgeYears} years old.`;
}
