export const DEFAULT_SESSION_MIN_AGE = 0;

export function getSessionMinimumAge(minAge: number | null | undefined) {
  return minAge ?? DEFAULT_SESSION_MIN_AGE;
}
