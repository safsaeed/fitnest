export function groupSessionsByType<
  T extends { title: string; description: string | null; pricePence: number },
>(sessions: T[]) {
  const groups = new Map<string, T[]>();

  for (const session of sessions) {
    const key = [
      session.title,
      session.description ?? "",
      session.pricePence,
    ].join("__");

    const existing = groups.get(key) ?? [];
    existing.push(session);
    groups.set(key, existing);
  }

  return Array.from(groups.values());
}
