import type { SeriesGame } from "@/hooks/useSeriesGames";

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function isWithin24h(startsAt: number | undefined): boolean {
  if (!startsAt) return false;
  const diff = startsAt - Date.now();
  return diff > 0 && diff <= ONE_DAY_MS;
}

/**
 * True if the tip-off falls on the same local calendar day as "now",
 * regardless of how many hours away it is.
 */
export function isSameLocalDay(startsAt: number | undefined): boolean {
  if (!startsAt) return false;
  const d = new Date(startsAt);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

/**
 * True if we should surface a scheduled game as "Next Up":
 * - it's later today (game day), OR
 * - tip-off is within the next 24h
 */
export function isNextUp(startsAt: number | undefined): boolean {
  if (!startsAt) return false;
  if (startsAt < Date.now()) return false;
  return isSameLocalDay(startsAt) || isWithin24h(startsAt);
}

/**
 * Default slide rule for a series:
 * 1. live game
 * 2. next upcoming on game day or within 24h of tip-off
 * 3. most recent played (final)
 * 4. first scheduled game (Game 1)
 */
export function pickDefaultGameIdx(games: SeriesGame[]): number {
  if (!games.length) return 0;

  const liveIdx = games.findIndex((g) => g.status === "live");
  if (liveIdx >= 0) return liveIdx;

  // Only surface the next upcoming game by default once it's the same local
  // calendar day as tip-off. Before game day we keep showing the last final
  // so users see the most recent result, not a future scheduled game.
  const nextUpcomingIdx = games.findIndex((g) => g.status === "upcoming");
  if (
    nextUpcomingIdx >= 0 &&
    isSameLocalDay(games[nextUpcomingIdx].startsAt)
  ) {
    return nextUpcomingIdx;
  }

  // Most recent final
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i].status === "final") return i;
  }

  // No games played yet — Game 1
  return 0;
}

/**
 * Format a tip-off timestamp to a friendly local string,
 * e.g. "Tonight 9:00 PM", "Tomorrow 8:30 PM", "Sat 7:00 PM".
 */
export function formatTipOff(startsAt: number | undefined): string {
  if (!startsAt) return "TBD";
  const d = new Date(startsAt);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (sameDay) return `Tonight ${time}`;
  return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${time}`;
}
