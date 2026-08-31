export function getRepeatPatternLabel(repeatPattern: string) {
  if (repeatPattern === "daily") {
    return "Every day";
  }

  if (repeatPattern === "every-other-day") {
    return "Every other day";
  }

  if (repeatPattern === "every-other-week") {
    return "Every other week";
  }

  return "Weekly";
}
