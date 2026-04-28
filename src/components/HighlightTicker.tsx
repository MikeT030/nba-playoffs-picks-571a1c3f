import { useEffect, useMemo, useState } from "react";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import { isTodaySlateET, isSameLocalDay } from "@/lib/seriesUtils";
import type { Team } from "@/data/playoffsData";

type Kind = "live" | "game7" | "winner" | "tonight" | "info";

type Item = {
  id: string;
  kind: Kind;
  tag: string;        // short label in the LOGO block (e.g. "FINAL", "LIVE", "G7")
  headline: string;   // big bold headline
  sub: string;        // small subline
  team?: Team;        // featured team — drives accent color
};

const SERIES_WIN_TARGET = 4;
const NEWS_FRESHNESS_MS = 12 * 60 * 60 * 1000; // keep "FINAL" news for 12h

function buildItems(matches: ReturnType<typeof usePlayoffGames>["data"]): Item[] {
  const items: Item[] = [];
  if (!matches || matches.length === 0) return items;

  for (const m of matches) {
    const home = m.homeTeam;
    const away = m.awayTeam;

    if (m.status === "live") {
      // Featured team = whoever is currently leading (fallback: home).
      const leader =
        (m.homeScore ?? 0) >= (m.awayScore ?? 0) ? home : away;
      items.push({
        id: `${m.id}-live`,
        kind: "live",
        tag: "LIVE",
        headline: `${away.abbreviation} ${m.awayScore ?? 0} — ${m.homeScore ?? 0} ${home.abbreviation}`,
        sub: `${away.name} at ${home.name} · ${m.time}`,
        team: leader,
      });
      continue;
    }

    if (m.homeWins >= SERIES_WIN_TARGET || m.awayWins >= SERIES_WIN_TARGET) {
      // Only show series-clinch news for 12 hours after the clinching game
      // (anchored on `startsAt`, which for a completed series is the latest
      // played game). If we don't know when, keep showing it.
      const clinchTs = m.startsAt ? new Date(m.startsAt).getTime() : undefined;
      const isFresh =
        clinchTs === undefined || Date.now() - clinchTs <= NEWS_FRESHNESS_MS;
      if (isFresh) {
        const winner = m.homeWins > m.awayWins ? home : away;
        const loser = m.homeWins > m.awayWins ? away : home;
        const wins = Math.max(m.homeWins, m.awayWins);
        const losses = Math.min(m.homeWins, m.awayWins);
        items.push({
          id: `${m.id}-winner`,
          kind: "winner",
          tag: "FINAL",
          headline: `${winner.name.toUpperCase()} ADVANCE`,
          sub: `Eliminate ${loser.name} ${wins}–${losses}`,
          team: winner,
        });
      }
      continue;
    }

    const ts = m.startsAt ? new Date(m.startsAt).getTime() : undefined;
    const tipsToday = ts && (isTodaySlateET(ts) || isSameLocalDay(ts));
    if (tipsToday && m.status === "upcoming") {
      const total = m.homeWins + m.awayWins;
      const isGame7 = total === 6 && m.homeWins === 3 && m.awayWins === 3;
      // Pick the team currently leading the series; if tied, the home team.
      const featured =
        m.homeWins > m.awayWins ? home : m.awayWins > m.homeWins ? away : home;
      if (isGame7) {
        items.push({
          id: `${m.id}-g7`,
          kind: "game7",
          tag: "GAME 7",
          headline: `${away.abbreviation} AT ${home.abbreviation} TONIGHT`,
          sub: `${m.time} · winner takes the series`,
          team: featured,
        });
      } else {
        items.push({
          id: `${m.id}-tonight`,
          kind: "tonight",
          tag: "TONIGHT",
          headline: `${away.abbreviation} AT ${home.abbreviation}`,
          sub: `Game ${total + 1} · ${m.time} · series ${m.awayWins}–${m.homeWins}`,
          team: featured,
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      id: "idle",
      kind: "info",
      tag: "NEWS",
      headline: "NO GAMES ON THE SLATE",
      sub: "Check back at tip-off",
    });
  }

  return items;
}

// Convert a hex color to a darker variant for gradients.
function shade(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// Fallback palette per kind when no team color is available.
const kindFallback: Record<Kind, string> = {
  live: "#dc2626",
  game7: "#d97706",
  winner: "#059669",
  tonight: "#0284c7",
  info: "#475569",
};

type Props = { variant?: "default" | "inset" };

const ROTATE_MS = 5000;

const HighlightTicker = ({ variant = "default" }: Props) => {
  const { data: matches } = usePlayoffGames();
  const items = useMemo(() => buildItems(matches), [matches]);
  const [idx, setIdx] = useState(0);

  // Reset index when item count changes.
  useEffect(() => {
    setIdx(0);
  }, [items.length]);

  // Auto-rotate through items.
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;
  const item = items[idx];
  const accent = item.team?.color ?? kindFallback[item.kind];
  const accentDark = shade(accent, -40);
  const accentLight = shade(accent, 30);

  return (
    <div
      className={
        variant === "inset"
          ? "w-full overflow-hidden"
          : "mb-3 w-full max-w-md mx-auto overflow-hidden"
      }
    >
      <div
        key={item.id}
        className="relative flex h-[42px] w-full items-stretch animate-[tickerFade_400ms_ease-out]"
      >
        {/* Left "logo" tag block */}
        <div
          className="relative flex items-center justify-center px-2.5 text-[10px] font-display tracking-[0.15em] text-white"
          style={{
            background: `linear-gradient(135deg, ${accentDark}, #0a0a0a 140%)`,
            minWidth: 56,
          }}
        >
          {/* live pulse dot */}
          {item.kind === "live" && (
            <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          )}
          <span className="leading-tight text-center">{item.tag}</span>
          {/* slanted divider */}
          <span
            aria-hidden
            className="absolute right-[-6px] top-0 h-full w-3"
            style={{
              background: accentDark,
              clipPath: "polygon(0 0, 100% 0, 0 100%)",
            }}
          />
        </div>

        {/* Headline + subline panel */}
        <div className="relative flex flex-1 flex-col justify-center overflow-hidden pl-4 pr-2">
          {/* Background: team-colored gradient with diagonal sheen */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${accent} 0%, ${accentDark} 100%)`,
            }}
          />
          {/* Diagonal highlight stripes (broadcast sheen) */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              background: `repeating-linear-gradient(110deg, transparent 0 30px, ${accentLight} 30px 32px, transparent 32px 60px)`,
            }}
          />
          {/* Bottom highlight bar */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/70"
          />

          {/* Headline marquee — only animate if it would overflow */}
          <div className="relative z-10 overflow-hidden">
            <div className="font-display text-[15px] leading-none tracking-wider text-white whitespace-nowrap drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]">
              {item.headline}
            </div>
          </div>
          <div className="relative z-10 mt-0.5 truncate font-body text-[10px] uppercase tracking-[0.18em] text-white/85">
            {item.sub}
          </div>

          {/* Right edge slants for broadcast feel */}
          <span
            aria-hidden
            className="absolute right-0 top-0 h-full w-4 bg-white/15"
            style={{ clipPath: "polygon(50% 0, 100% 0, 50% 100%, 0 100%)" }}
          />
          <span
            aria-hidden
            className="absolute right-3 top-0 h-full w-2 bg-white/25"
            style={{ clipPath: "polygon(50% 0, 100% 0, 50% 100%, 0 100%)" }}
          />
        </div>
      </div>

      {/* Pager dots */}
      {items.length > 1 && (
        <div className="mt-1.5 flex justify-center gap-1">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              aria-label={`Show update ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1 rounded-full transition-all ${
                i === idx ? "w-4 bg-white/80" : "w-1 bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HighlightTicker;
