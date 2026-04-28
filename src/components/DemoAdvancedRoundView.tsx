import { useMemo, useState } from "react";
import { ChevronRight, ArrowRight, Check } from "lucide-react";
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

const ROUND_HEADER_LABEL: Record<RoundKey, string> = {
  R1: "Round 1",
  CSF: "Conf. Semifinals",
  CF: "Conf. Finals",
  F: "Finals",
};

const CONF_LABEL: Record<Series["conf"], string> = {
  EAST: "EAST",
  WEST: "WEST",
  FINALS: "",
};

/* ---------- Match card (homepage size) ---------- */
const MatchCard = ({ match }: { match: Series }) => {
  const isLive = match.status === "live";
  const isFinal = match.status === "final";
  const isUpcoming = match.status === "upcoming";
  const alpha = isLive ? "80" : "66";

  const headerBits = [
    CONF_LABEL[match.conf],
    ROUND_HEADER_LABEL[match.round],
    "Game 1",
    isFinal ? "Apr 28" : isLive ? "Tonight" : "Apr 29",
  ].filter(Boolean);

  return (
    <div className="relative block rounded-lg overflow-hidden bg-[#1A1E24]/80 backdrop-blur-md">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${colorFor(match.away)}${alpha} 0%, ${colorFor(match.away)}${alpha} 50%, ${colorFor(match.home)}${alpha} 50%, ${colorFor(match.home)}${alpha} 100%)`,
        }}
      />
      <div className="relative">
        <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
          <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
            {headerBits.join(" · ")}
          </span>
        </div>

        <div className="p-5 flex items-center justify-between gap-2 pt-[20px]">
          {/* Away */}
          <div className="flex-1 flex items-center gap-1.5 -translate-y-2">
            {match.awaySeed && (
              <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                {match.awaySeed}
              </span>
            )}
            <div>
              <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                {match.away}
              </p>
            </div>
          </div>

          {/* Score / Series */}
          <div className="text-center shrink-0">
            <div className="h-0">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-body font-semibold uppercase tracking-widest -translate-y-5 whitespace-nowrap text-[#fe953e]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE943E] animate-pulse" />
                  Q3 4:21
                </span>
              )}
              {isFinal && (
                <span className="text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5 text-xs">
                  Final
                </span>
              )}
              {isUpcoming && (
                <span className="text-[10px] text-muted-foreground font-body font-semibold uppercase tracking-widest block -translate-y-5 whitespace-nowrap">
                  8:30 PM ET
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isUpcoming ? (
                <>
                  <span className="text-2xl text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>—</span>
                  <span className="text-muted-foreground font-body text-sm">—</span>
                  <span className="text-2xl text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>—</span>
                </>
              ) : (
                <>
                  <span className="text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{isLive ? 78 : 112}</span>
                  <span className="text-muted-foreground font-body text-sm">—</span>
                  <span className="text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{isLive ? 82 : 104}</span>
                </>
              )}
            </div>
            <p className="text-xs font-body mt-1 font-medium text-[#dce0e5]">
              Series {match.series[0]} – {match.series[1]}
            </p>
          </div>

          {/* Home */}
          <div className="flex-1 flex items-center gap-1.5 justify-end text-right -translate-y-2">
            <div>
              <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                {match.home}
              </p>
            </div>
            {match.homeSeed && (
              <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                {match.homeSeed}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Advanced-to-this-round card (homepage size, TBD opponent) ---------- */
const AdvancedCard = ({
  round,
  conf,
  team,
  teamSeed,
  feederALabel,
  feederBLabel,
}: {
  round: RoundKey;
  conf: Series["conf"];
  team: string;
  teamSeed?: number;
  feederALabel: string;
  feederBLabel: string;
}) => {
  const headerBits = [CONF_LABEL[conf], ROUND_HEADER_LABEL[round], "Awaiting opponent"].filter(Boolean);

  return (
    <div className="relative block rounded-lg overflow-hidden bg-[#1A1E24]/80 backdrop-blur-md border border-dashed border-border/60">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${colorFor(team)}66 0%, ${colorFor(team)}66 50%, hsl(var(--muted) / 0.18) 50%, hsl(var(--muted) / 0.18) 100%)`,
        }}
      />
      <div className="relative">
        <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
          <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
            {headerBits.join(" · ")}
          </span>
        </div>

        <div className="p-5 flex items-center justify-between gap-2 pt-[20px]">
          {/* Confirmed team */}
          <div className="flex-1 flex items-center gap-1.5 -translate-y-2">
            {teamSeed && (
              <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center shrink-0">
                {teamSeed}
              </span>
            )}
            <div>
              <p className="tracking-wide text-xl" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                {team}
              </p>
              <p className="text-[10px] font-body uppercase tracking-widest text-primary mt-0.5">
                ✓ Advanced
              </p>
            </div>
          </div>

          {/* VS */}
          <div className="text-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>—</span>
              <span className="text-muted-foreground font-body text-sm">vs</span>
              <span className="text-2xl text-muted-foreground" style={{ fontFamily: "'Orbitron', sans-serif" }}>?</span>
            </div>
            <p className="text-xs font-body mt-1 font-medium text-muted-foreground">
              TBD
            </p>
          </div>

          {/* TBD opponent */}
          <div className="flex-1 flex items-center gap-1.5 justify-end text-right -translate-y-2">
            <div>
              <p className="tracking-wide text-xl text-muted-foreground" style={{ fontFamily: "'Saira Stencil One', sans-serif" }}>
                TBD
              </p>
              <p className="text-[10px] font-body uppercase tracking-widest text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                Winner of {feederALabel} <ArrowRight size={9} /> {feederBLabel}
              </p>
            </div>
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
    const entries: { team: string; teamSeed?: number; aLabel: string; bLabel: string; key: string; conf: Series["conf"] }[] = [];

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
          conf: feeder.conf,
        });
      }
    });

    return entries;
  }, [activeRound]);

  const decidedMatches = inRound.filter((m) => m.status === "final");
  const roundComplete = inRound.length > 0 && decidedMatches.length === inRound.length;
  const todayMatches = roundComplete
    ? []
    : inRound.filter((m) => m.dayBucket === "today" && m.status !== "final");
  const nextMatches = roundComplete
    ? []
    : inRound.filter((m) => m.dayBucket === "next" && m.status !== "final");
  const otherMatches = roundComplete
    ? []
    : inRound.filter((m) => !m.dayBucket && m.status !== "final");

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
        {selectableRounds.map((r) => {
          const roundMatches = ALL_SERIES.filter((m) => m.round === r);
          const hasMatches = roundMatches.length > 0;
          const isComplete =
            hasMatches && roundMatches.every((m) => m.status === "final");
          const isActive = activeRound === r;

          let stateClasses: string;
          if (isActive) {
            stateClasses =
              "border-0 bg-[#47b4eb]/0 text-primary-foreground text-xl";
          } else if (isComplete) {
            stateClasses =
              "border-secondary/40 bg-secondary/30 hover:bg-secondary/50 text-secondary-foreground text-lg";
          } else if (hasMatches) {
            stateClasses =
              "border-border bg-transparent hover:bg-accent/40 text-muted-foreground hover:text-foreground text-xl";
          } else {
            stateClasses =
              "border-transparent bg-transparent text-muted-foreground/60 hover:text-foreground text-xl";
          }

          return (
            <button
              key={r}
              onClick={() => setActiveRound(r)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-display tracking-widest uppercase transition-colors ${stateClasses}`}
            >
              {ROUND_LABEL[r]}
              {isComplete && <Check className="w-3 h-3" strokeWidth={3} />}
            </button>
          );
        })}
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
                round={activeRound}
                conf={e.conf}
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

      {/* All other matches in this round (e.g. live/upcoming without bucket) */}
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

      {/* Decisions — every final matchup of this round */}
      {decidedMatches.length > 0 && (
        <section className="space-y-2">
          <SectionHead label="Decisions" />
          <div className="space-y-1.5">
            {decidedMatches.map((m) => (
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
