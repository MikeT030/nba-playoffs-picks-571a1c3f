import type { SeriesGame } from "@/hooks/useSeriesGames";

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export function isWithin24h(startsAt: number | undefined): boolean {
  if (!startsAt) return false;
  const diff = startsAt - Date.now();
  return diff > 0 && diff <= ONE_DAY_MS;
}

export function isWithin12h(startsAt: number | undefined): boolean {
  if (!startsAt) return false;
  const diff = startsAt - Date.now();
  return diff > 0 && diff <= TWELVE_HOURS_MS;
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
 * Returns Y/M/D parts of `ts` as observed in the given IANA timezone.
 */
function getZonedYMD(ts: number, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ts));
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);
  return { y, m, d };
}

/**
 * Returns the UTC ms timestamp for a given wall-clock (Y, M, D, H, Min)
 * interpreted in `timeZone`. Handles DST automatically (so it works for
 * both CET (UTC+1) and CEST (UTC+2) for Europe/Berlin).
 */
function zonedWallTimeToUtcMs(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
  timeZone: string,
): number {
  // First guess: pretend the wall time is UTC.
  const guess = Date.UTC(y, m - 1, d, h, min, 0);
  // Find what wall time `guess` actually represents in the target zone.
  const zoned = getZonedYMD(guess, timeZone);
  const zonedTimeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(guess));
  const zh = Number(zonedTimeParts.find((p) => p.type === "hour")!.value) % 24;
  const zmin = Number(zonedTimeParts.find((p) => p.type === "minute")!.value);
  // Difference between desired wall time and what guess produced (in minutes).
  const desiredMin = ((Date.UTC(y, m - 1, d) - Date.UTC(zoned.y, zoned.m - 1, zoned.d)) / 60_000)
    + (h - zh) * 60 + (min - zmin);
  return guess + desiredMin * 60_000;
}

/**
 * Flip moment for the "US slate" containing `startsAt`:
 *   1. Determine the game's US Eastern calendar date (the NBA "game day").
 *   2. Step back to the previous CET/CEST calendar day.
 *   3. Anchor at 20:00 Europe/Berlin on that day.
 *
 * All games on the same US-Eastern game day share the same flip moment, so
 * a full night's slate flips to "Next Up" together regardless of which game
 * is earliest in CET wall time.
 */
export function flipMomentForSlate(startsAt: number): number {
  // 1) US-Eastern game day for this tip-off.
  const et = getZonedYMD(startsAt, "America/New_York");
  // Anchor noon ET on that game day so we have a stable timestamp inside the day.
  const noonEtUtc = zonedWallTimeToUtcMs(et.y, et.m, et.d, 12, 0, "America/New_York");
  // 2) Convert that anchor to its CET calendar date, then step back one day.
  const cet = getZonedYMD(noonEtUtc, "Europe/Berlin");
  const prev = new Date(Date.UTC(cet.y, cet.m - 1, cet.d));
  prev.setUTCDate(prev.getUTCDate() - 1);
  // 3) 20:00 Europe/Berlin on the previous CET day.
  return zonedWallTimeToUtcMs(
    prev.getUTCFullYear(),
    prev.getUTCMonth() + 1,
    prev.getUTCDate(),
    20,
    0,
    "Europe/Berlin",
  );
}

/**
 * True once we've crossed the "day before at 20:00 CET" flip moment for the
 * US slate this game belongs to (and the game hasn't started yet).
 */
export function isPastSlateFlip(startsAt: number | undefined): boolean {
  if (!startsAt) return false;
  if (startsAt < Date.now()) return false;
  return Date.now() >= flipMomentForSlate(startsAt);
}

/**
 * True if the game's US-Eastern game date matches the current "active" ET slate.
 *
 * The active ET slate is:
 *   - today's ET date when ET local hour >= 12 (afternoon onward — tonight's slate)
 *   - yesterday's ET date when ET local hour < 12 (early AM — last night's slate
 *     that's still wrapping up for late-night CET viewers)
 *
 * This buckets exactly one NBA slate into "Today" at any given moment.
 */
export function isTodaySlateET(startsAt: number | undefined): boolean {
  if (!startsAt) return false;
  const nowMs = Date.now();
  const nowEt = getZonedYMD(nowMs, "America/New_York");
  const nowEtHourParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/New_York",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date(nowMs));
  const nowEtHour = Number(nowEtHourParts.find((p) => p.type === "hour")!.value) % 24;

  let activeY = nowEt.y;
  let activeM = nowEt.m;
  let activeD = nowEt.d;
  if (nowEtHour < 12) {
    const prev = new Date(Date.UTC(nowEt.y, nowEt.m - 1, nowEt.d));
    prev.setUTCDate(prev.getUTCDate() - 1);
    activeY = prev.getUTCFullYear();
    activeM = prev.getUTCMonth() + 1;
    activeD = prev.getUTCDate();
  }

  const gameEt = getZonedYMD(startsAt, "America/New_York");
  return gameEt.y === activeY && gameEt.m === activeM && gameEt.d === activeD;
}

/**
 * True if we should surface a scheduled game as "Next Up":
 * we've crossed the "day before, 20:00 CET" flip moment for this game's
 * US-Eastern slate, and tip-off is still in the future.
 */
export function isNextUp(startsAt: number | undefined): boolean {
  return isPastSlateFlip(startsAt);
}

/**
 * Default slide rule for a series:
 * 1. live game
 * 2. next upcoming once we've crossed the slate flip moment
 *    (day before tip-off, 20:00 Europe/Berlin)
 * 3. most recent played (final)
 * 4. first scheduled game (Game 1)
 */
export function pickDefaultGameIdx(games: SeriesGame[]): number {
  if (!games.length) return 0;

  const liveIdx = games.findIndex((g) => g.status === "live");
  if (liveIdx >= 0) return liveIdx;

  const nextUpcomingIdx = games.findIndex((g) => g.status === "upcoming");
  if (nextUpcomingIdx >= 0 && isPastSlateFlip(games[nextUpcomingIdx].startsAt)) {
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
