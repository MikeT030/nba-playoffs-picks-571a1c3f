import { useMemo, useState } from "react";
import { ChevronRight, ArrowRight } from "lucide-react";
import { teamMeta } from "@/lib/nbaApi";

/**
 * DEMO: Round-by-round view with auto-advance + "Advanced to this round"
 *
 * - Round select starts at "Round 1" (no "All matchups").
 * - Auto-jumps to next round once every series in the active round is final.
 * - From Conf. Semifinals onward, an "Advanced to this round" section sits
 *   above "Today" and shows cards like  BOS vs. Winner of CLE / NYK
 *   for any team whose next opponent is still TBD.
 */

type Status = "final" | "live" | "upcoming";
type RoundKey = "R1" | "CSF" | "CF" | "F";

interface Series {
  id: string;
  round: RoundKey;
  conf: "EAST" | "WEST" | "FINALS";
  // Bracket slot identifier so we can wire winners → next round.
  // e.g. R1 east slots 1..4; their winners feed CSF east slots 1..2.
  slot: number;
  away: string;
  home: string;
  awaySeed?: number;
  homeSeed?: number;
  series: [number, number];
  status: Status;
  winner?: string;
  // For "today" / "next days" demo grouping
  dayBucket?: "today" | "next";
}

const s = (
  id: string,
  round: RoundKey,
  conf: Series["conf"],
  slot: number,
  away: string,
  home: string,
  awaySeed: number | undefined,
  homeSeed: number | undefined,
  series: [number, number],
  status: Status,
  winner?: string,
  dayBucket?: Series["dayBucket"],
): Series => ({ id, round, conf, slot, away, home, awaySeed, homeSeed, series, status, winner, dayBucket });

/**
 * Demo state: We're in Conf. Semifinals.
 *  - East semis: BOS vs CLE is FINAL (BOS won). NYK vs IND is LIVE → no winner yet.
 *  - West semis: OKC vs DEN is upcoming today. DAL vs MIN is "next days".
 * That gives us:
 *  - "Advanced to this round" should NOT appear in semis demo (those teams
 *    are already drawn into the bracket — we want to show how it works for CF).
 *  - But to demo the feature, we also include a CF mode toggle so reviewers
 *    can flip the round select to CF and see BOS vs "Winner of NYK / IND".
 */
const ALL_SERIES: Series[] = [
  // ---- Round 1 (all final) ----
  s("e_r1_1", "R1", "EAST", 1, "MIA", "BOS", 8, 1, [1, 4], "final", "BOS"),
  s("e_r1_2", "R1", "EAST", 2, "ORL", "CLE", 5, 4, [3, 4], "final", "CLE"),
  s("e_r1_3", "R1", "EAST", 3, "PHI", "NYK", 6, 3, [2, 4], "final", "NYK"),
  s("e_r1_4", "R1", "EAST", 4, "MIL", "IND", 2, 7, [2, 4], "final", "IND"),
  s("w_r1_1", "R1", "WEST", 1, "NOP", "OKC", 8, 1, [0, 4], "final", "OKC"),
  s("w_r1_2", "R1", "WEST", 2, "LAL", "DEN", 5, 4, [1, 4], "final", "DEN"),
  s("w_r1_3", "R1", "WEST", 3, "PHX", "MIN", 6, 3, [0, 4], "final", "MIN"),
  s("w_r1_4", "R1", "WEST", 4, "LAC", "DAL", 2, 7, [2, 4], "final", "DAL"),

  // ---- Conf. Semifinals ----
  // East 1: BOS (R1 winner of slots 1) vs CLE (winner of slot 2) — FINAL
  s("e_csf_1", "CSF", "EAST", 1, "CLE", "BOS", 4, 1, [1, 4], "final", "BOS", "today"),
  // East 2: NYK vs IND — LIVE today (no winner yet)
  s("e_csf_2", "CSF", "EAST", 2, "IND", "NYK", 6, 2, [2, 2], "live", undefined, "today"),
  // West 1: DEN vs OKC — upcoming today
  s("w_csf_1", "CSF", "WEST", 1, "DEN", "OKC", 4, 1, [0, 0], "upcoming", undefined, "today"),
  // West 2: DAL vs MIN — next days
  s("w_csf_2", "CSF", "WEST", 2, "DAL", "MIN", 5, 3, [0, 0], "upcoming", undefined, "next"),
];

// Map a CF/F slot → which previous-round slots feed into it.
// CF east slot 1 ← CSF east slots 1 + 2. CF west slot 1 ← CSF west slots 1 + 2.
// Finals slot 1 ← CF east slot 1 + CF west slot 1.
const FEEDERS: Record<RoundKey, Record<number, { conf: Series["conf"]; from: RoundKey; slots: [number, number] }>> = {
  R1: {},
  CSF: {
    // CSF slots aren't shown in advanced section in this demo
  },
  CF: {
    1: { conf: "EAST", from: "CSF", slots: [1, 2] },
    2: { conf: "WEST", from: "CSF", slots: [1, 2] },
  },
  F: {
    1: { conf: "FINALS", from: "CF", slots: [1, 1] }, // east CF + west CF
  },
};

const ROUND_LABEL: Record<RoundKey, string> = {
  R1: "Round 1",
  CSF: "Conference Semifinals",
  CF: "Conference Finals",
  F: "NBA Finals",
};

const ROUND_ORDER: RoundKey[] = ["R1", "CSF", "CF", "F"];

const colorFor = (abbr: string) => teamMeta[abbr]?.color ?? "#444";

/* ---------- Match card (compact) ---------- */
const MatchCard = ({ match }: { match: Series }) => {
  const awayWon = match.winner === match.away;
  const homeWon = match.winner === match.home;
  const isLive = match.status === "live";

  return (
    <div className="relative rounded-md overflow-hidden bg-[#1A1E24]/80">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${colorFor(match.away)}55 0%, ${colorFor(match.away)}55 50%, ${colorFor(match.home)}55 50%, ${colorFor(match.home)}55 100%)`,
        }}
      />
      <div className="relative px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {match.awaySeed && (
            <span className="text-[10px] text-muted-foreground font-body font-semibold w-3 text-center">
              {match.awaySeed}
            </span>
          )}
          <span className={`font-body font-bold text-sm tracking-wider ${awayWon ? "text-white" : homeWon ? "text-muted-foreground" : "text-white"}`}>
            {match.away}
          </span>
        </div>

        <div className="text-center shrink-0">
          {isLive && (
            <div className="flex items-center gap-1 justify-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE943E] animate-pulse" />
              <span className="text-[9px] font-body font-semibold uppercase tracking-widest text-[#fe953e]">
                LIVE
              </span>
            </div>
          )}
          <p className="font-body text-sm font-semibold tabular-nums">
            {match.series[0]}–{match.series[1]}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className={`font-body font-bold text-sm tracking-wider ${homeWon ? "text-white" : awayWon ? "text-muted-foreground" : "text-white"}`}>
            {match.home}
          </span>
          {match.homeSeed && (
            <span className="text-[10px] text-muted-foreground font-body font-semibold w-3 text-center">
              {match.homeSeed}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Advanced-to-this-round card (one team confirmed, opponent TBD) ---------- */
const AdvancedCard = ({
  team,
  teamSeed,
  feederALabel,
  feederBLabel,
}: {
  team: string;
  teamSeed?: number;
  feederALabel: string; // e.g. "NYK"
  feederBLabel: string; // e.g. "IND"
}) => {
  return (
    <div className="relative rounded-md overflow-hidden bg-[#1A1E24]/80 border border-dashed border-border/60">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${colorFor(team)}55 0%, ${colorFor(team)}55 50%, hsl(var(--muted) / 0.15) 50%, hsl(var(--muted) / 0.15) 100%)`,
        }}
      />
      <div className="relative px-3 py-2.5 flex items-center justify-between gap-2">
        {/* Confirmed team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {teamSeed && (
            <span className="text-[10px] text-muted-foreground font-body font-semibold w-3 text-center">
              {teamSeed}
            </span>
          )}
          <span className="font-body font-bold text-sm tracking-wider text-white">
            {team}
          </span>
          <span className="text-[8px] font-body font-semibold uppercase tracking-widest text-primary/90 ml-1">
            ✓ Advanced
          </span>
        </div>

        <ArrowRight size={12} className="text-muted-foreground shrink-0" />

        {/* TBD opponent */}
        <div className="flex items-center gap-1 flex-1 min-w-0 justify-end text-right">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-[8px] font-body uppercase tracking-widest text-muted-foreground">
              Winner of
            </span>
            <span className="font-body font-bold text-xs tracking-wider text-muted-foreground">
              {feederALabel} / {feederBLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Section heading ---------- */
const SectionHead = ({ label, accent }: { label: string; accent?: boolean }) => (
  <div className="flex items-center gap-2 px-1">
    <h3
      className={`font-display text-xs tracking-widest uppercase ${
        accent ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {label}
    </h3>
    <div className="flex-1 h-px bg-border/40" />
  </div>
);

/* ---------- Main demo ---------- */
const DemoAdvancedRoundView = () => {
  // Auto-advance: pick the earliest round that still has an unfinished series.
  const autoActiveRound = useMemo<RoundKey>(() => {
    for (const r of ROUND_ORDER) {
      const inRound = ALL_SERIES.filter((m) => m.round === r);
      if (inRound.length === 0) continue;
      const allDone = inRound.every((m) => m.status === "final");
      if (!allDone) return r;
    }
    return "F";
  }, []);

  const [activeRound, setActiveRound] = useState<RoundKey>(autoActiveRound);

  const inRound = ALL_SERIES.filter((m) => m.round === activeRound);

  // Build "advanced to this round" entries.
  // Only from CF onward (per spec: from Conf. Semifinals — but in practice
  // the moment teams advance from R1 they get drawn into CSF immediately
  // because the bracket is fixed). The interesting case is CF/F where a
  // team can clinch its CSF before the parallel CSF is decided.
  const advancedEntries = useMemo(() => {
    if (activeRound === "R1" || activeRound === "CSF") return [];
    const feedersForRound = FEEDERS[activeRound];
    const entries: { team: string; teamSeed?: number; aLabel: string; bLabel: string; key: string }[] = [];

    Object.entries(feedersForRound).forEach(([slotStr, feeder]) => {
      const slot = Number(slotStr);
      // Has a series already been created for this round/slot? If yes, skip
      // (the matchup is fully determined — it'll show up in Today/Next days).
      const existingForSlot = ALL_SERIES.find(
        (m) => m.round === activeRound && m.slot === slot,
      );
      if (existingForSlot) return;

      // Find feeder series (previous round, same conf, given slots).
      const prevRound = feeder.from;
      const feederA = ALL_SERIES.find(
        (m) => m.round === prevRound && m.conf === feeder.conf && m.slot === feeder.slots[0],
      );
      // For Finals, second feeder is in west conf, slot 1.
      const feederB =
        activeRound === "F"
          ? ALL_SERIES.find((m) => m.round === "CF" && m.conf === "WEST" && m.slot === 1)
          : ALL_SERIES.find(
              (m) => m.round === prevRound && m.conf === feeder.conf && m.slot === feeder.slots[1],
            );

      // Pair them up: one decided, the other not → that's our card.
      const decided = [feederA, feederB].filter((f) => f?.winner);
      const undecided = [feederA, feederB].filter((f) => f && !f.winner);

      if (decided.length === 1 && undecided.length === 1) {
        const winnerSeries = decided[0]!;
        const pendingSeries = undecided[0]!;
        const winnerAbbr = winnerSeries.winner!;
        const winnerSeed =
          winnerAbbr === winnerSeries.away ? winnerSeries.awaySeed : winnerSeries.homeSeed;
        entries.push({
          team: winnerAbbr,
          teamSeed: winnerSeed,
          aLabel: pendingSeries.away,
          bLabel: pendingSeries.home,
          key: `${activeRound}-${slot}`,
        });
      }
    });

    return entries;
  }, [activeRound]);

  const todayMatches = inRound.filter((m) => m.dayBucket === "today");
  const nextMatches = inRound.filter((m) => m.dayBucket === "next");
  const otherMatches = inRound.filter((m) => !m.dayBucket);

  const availableRounds = ROUND_ORDER.filter((r) =>
    ALL_SERIES.some((m) => m.round === r),
  );
  // Also include CF & F so we can demo the "Advanced" section even though
  // no series exists yet for those rounds.
  const selectableRounds: RoundKey[] = Array.from(new Set([...availableRounds, "CF", "F"]));

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-lg tracking-wider text-muted-foreground">
          DEMO — AUTO-ADVANCE ROUNDS + "ADVANCED TO THIS ROUND"
        </h2>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Round select starts at Round 1, jumps forward when all series in the
          active round are final. From Conf. Finals on, teams that have clinched
          their previous series but whose opponent is still TBD appear above
          "Today".
        </p>
      </div>

      {/* Round select */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {selectableRounds.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRound(r)}
            className={`shrink-0 px-3 py-1.5 rounded-md font-body text-xs tracking-wider uppercase transition-colors ${
              activeRound === r
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {ROUND_LABEL[r]}
          </button>
        ))}
      </div>

      <p className="font-body text-[10px] text-muted-foreground italic px-1">
        Auto-selected: <span className="text-foreground">{ROUND_LABEL[autoActiveRound]}</span>
        {" "}(earliest round with an unfinished series)
      </p>

      {/* Advanced to this round */}
      {advancedEntries.length > 0 && (
        <section className="space-y-2">
          <SectionHead label="Advanced to this round" accent />
          <div className="space-y-1.5">
            {advancedEntries.map((e) => (
              <AdvancedCard
                key={e.key}
                team={e.team}
                teamSeed={e.teamSeed}
                feederALabel={e.aLabel}
                feederBLabel={e.bLabel}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      {todayMatches.length > 0 && (
        <section className="space-y-2">
          <SectionHead label="Today" />
          <div className="space-y-1.5">
            {todayMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Next days */}
      {nextMatches.length > 0 && (
        <section className="space-y-2">
          <SectionHead label="Next days" />
          <div className="space-y-1.5">
            {nextMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* All other matches in this round (e.g. completed) */}
      {otherMatches.length > 0 && (
        <section className="space-y-2">
          <SectionHead label={`All ${ROUND_LABEL[activeRound]} matchups`} />
          <div className="space-y-1.5">
            {otherMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state for CF/F when nothing exists yet */}
      {inRound.length === 0 && advancedEntries.length === 0 && (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center">
          <p className="font-body text-xs text-muted-foreground">
            No matchups yet for {ROUND_LABEL[activeRound]}.
          </p>
        </div>
      )}

      {inRound.length === 0 && advancedEntries.length > 0 && (
        <p className="font-body text-[10px] text-muted-foreground italic px-1 flex items-center gap-1">
          <ChevronRight size={10} /> No confirmed matchups yet — opponents still TBD.
        </p>
      )}
    </div>
  );
};

export default DemoAdvancedRoundView;
