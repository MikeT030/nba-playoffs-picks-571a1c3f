import { useMemo } from "react";
import { usePlayoffGames } from "@/hooks/usePlayoffGames";
import { isTodaySlateET, isSameLocalDay } from "@/lib/seriesUtils";

type Item = { id: string; kind: "live" | "game7" | "winner" | "tonight" | "info"; text: string };

const SERIES_WIN_TARGET = 4;

function buildItems(matches: ReturnType<typeof usePlayoffGames>["data"]): Item[] {
  const items: Item[] = [];
  if (!matches || matches.length === 0) return items;

  for (const m of matches) {
    const home = m.homeTeam.name;
    const away = m.awayTeam.name;

    // 1) Live right now
    if (m.status === "live") {
      items.push({
        id: `${m.id}-live`,
        kind: "live",
        text: `LIVE — ${away} ${m.awayScore ?? 0} @ ${home} ${m.homeScore ?? 0} · ${m.time}`,
      });
      continue;
    }

    // 2) Series winner (someone reached 4 wins)
    if (m.homeWins >= SERIES_WIN_TARGET || m.awayWins >= SERIES_WIN_TARGET) {
      const winner = m.homeWins > m.awayWins ? m.homeTeam : m.awayTeam;
      const loser = m.homeWins > m.awayWins ? m.awayTeam : m.homeTeam;
      const wins = Math.max(m.homeWins, m.awayWins);
      const losses = Math.min(m.homeWins, m.awayWins);
      items.push({
        id: `${m.id}-winner`,
        kind: "winner",
        text: `SERIES WIN — ${winner.name} eliminate ${loser.name} ${wins}-${losses}`,
      });
      continue;
    }

    // 3) Upcoming game tonight (today's ET slate or same local day)
    const ts = m.startsAt ? new Date(m.startsAt).getTime() : undefined;
    const tipsToday = ts && (isTodaySlateET(ts) || isSameLocalDay(ts));
    if (tipsToday && m.status === "upcoming") {
      const total = m.homeWins + m.awayWins;
      const isGame7 = total === 6 && m.homeWins === 3 && m.awayWins === 3;
      if (isGame7) {
        items.push({
          id: `${m.id}-g7`,
          kind: "game7",
          text: `GAME 7 TONIGHT — ${away} at ${home} · ${m.time} · winner takes the series`,
        });
      } else {
        items.push({
          id: `${m.id}-tonight`,
          kind: "tonight",
          text: `TONIGHT — ${away} at ${home} · Game ${total + 1} · ${m.time} (series ${m.awayWins}-${m.homeWins})`,
        });
      }
    }
  }

  if (items.length === 0) {
    items.push({
      id: "idle",
      kind: "info",
      text: "No games on the slate right now — check back at tip-off.",
    });
  }

  return items;
}

const kindColor: Record<Item["kind"], string> = {
  live: "text-red-300",
  game7: "text-amber-200",
  winner: "text-emerald-200",
  tonight: "text-sky-200",
  info: "text-[#bbb]",
};

type Props = { variant?: "default" | "inset" };

const HighlightTicker = ({ variant = "default" }: Props) => {
  const { data: matches } = usePlayoffGames();
  const items = useMemo(() => buildItems(matches), [matches]);

  // Duplicate the strip so the marquee loops seamlessly.
  const strip = (
    <div className="flex shrink-0 items-center gap-8 px-6">
      {items.map((it) => (
        <span key={it.id} className="flex items-center gap-2 whitespace-nowrap font-led text-[10px] tracking-[0.2em] uppercase">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
            it.kind === "live" ? "bg-red-400 animate-pulse"
              : it.kind === "game7" ? "bg-amber-300"
              : it.kind === "winner" ? "bg-emerald-300"
              : it.kind === "tonight" ? "bg-sky-200"
              : "bg-[#bbb]"
          }`} />
          <span className={kindColor[it.kind]}>{it.text}</span>
        </span>
      ))}
    </div>
  );

  const wrapperClass =
    variant === "inset"
      ? "w-full overflow-hidden py-1"
      : "mb-3 w-full max-w-md mx-auto overflow-hidden rounded-md border border-[#3a3a3a] bg-[#0a0a0a] py-2 shadow-[inset_0_0_15px_rgba(0,0,0,0.7)]";

  return (
    <div className={wrapperClass}>
      <div className="flex w-max animate-[ticker_40s_linear_infinite]">
        {strip}
        {strip}
      </div>
    </div>
  );
};

export default HighlightTicker;
