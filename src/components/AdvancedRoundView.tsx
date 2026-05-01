import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronRight, ArrowRight, Check } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { teamMeta } from "@/lib/nbaApi";
import type { Match, BracketSeries } from "@/data/playoffsData";

/**
 * Round-by-round view with auto-advance + "Advanced to this round".
 *
 * - Round selector starts at the earliest round that still has an unfinished
 *   series (or the first round if everything is upcoming).
 * - From Conf. Semifinals onward, shows "Advanced to this round" cards for
 *   teams whose previous-round series is final but whose next opponent is
 *   still TBD because the parallel previous-round series is unfinished.
 */

type RoundKey = "First Round" | "Conference Semifinals" | "Conference Finals" | "Finals";

const ROUND_ORDER: RoundKey[] = [
  "First Round",
  "Conference Semifinals",
  "Conference Finals",
  "Finals",
];

const ROUND_LABEL: Record<RoundKey, string> = {
  "First Round": "Round 1",
  "Conference Semifinals": "Conf. Semis",
  "Conference Finals": "Conf. Finals",
  "Finals": "Finals",
};

const ROUND_FULL_LABEL: Record<RoundKey, string> = {
  "First Round": "Round 1",
  "Conference Semifinals": "Conference Semifinals",
  "Conference Finals": "Conference Finals",
  "Finals": "NBA Finals",
};

const colorFor = (abbr: string) => teamMeta[abbr]?.color ?? "#444";

/* ---------- Helpers ---------- */

function seriesWinnerAbbr(m: Match): string | undefined {
  if (m.homeWins >= 4) return m.homeTeam.abbreviation;
  if (m.awayWins >= 4) return m.awayTeam.abbreviation;
  return undefined;
}

function roundOf(s: BracketSeries): RoundKey | undefined {
  if (ROUND_ORDER.includes(s.round as RoundKey)) return s.round as RoundKey;
  return undefined;
}

/* ---------- Section heading ---------- */
const SectionHead = ({ label, accent }: { label: string; accent?: boolean }) => (
  <div className="flex items-center gap-2 px-1 py-[20px] pb-[10px] pt-[20px]">
    <h3 className="font-display tracking-widest uppercase text-xl text-[#ededed]">
      {label}
    </h3>
    
  </div>
);

/* ---------- Advanced card ---------- */
const AdvancedCard = ({
  team,
  teamSeed,
  feederALabel,
  feederBLabel,
  conferenceLabel,
  roundLabel,
}: {
  team: string;
  teamSeed?: number;
  feederALabel: string;
  feederBLabel: string;
  conferenceLabel: string;
  roundLabel: string;
}) => {
  const opponentKnown = feederALabel === feederBLabel;
  const headerSuffix = opponentKnown ? "Awaiting tip-off" : "Awaiting opponent";
  const headerBits = [conferenceLabel, roundLabel, headerSuffix].filter(Boolean);

  return (
    <div className="relative block rounded-lg overflow-hidden bg-[#1A1E24]/80 backdrop-blur-md border border-dashed border-border/60">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${colorFor(team)}66 0%, ${colorFor(team)}66 50%, ${
            opponentKnown ? `${colorFor(feederALabel)}66` : "hsl(var(--muted) / 0.18)"
          } 50%, ${
            opponentKnown ? `${colorFor(feederALabel)}66` : "hsl(var(--muted) / 0.18)"
          } 100%)`,
        }}
      />
      <div className="relative">
        <div className="px-4 py-2 flex items-center justify-center border-b border-transparent">
          <span className="text-xs text-white font-body uppercase tracking-wider text-center font-normal">
            {headerBits.join(" · ")}
          </span>
        </div>

        <div className="p-5 flex items-center justify-between gap-2 pt-[20px]">
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

          <div className="text-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>—</span>
              <span className="text-muted-foreground font-body text-sm">vs</span>
              <span
                className={`text-2xl ${opponentKnown ? "" : "text-muted-foreground"}`}
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {opponentKnown ? "—" : "?"}
              </span>
            </div>
            <p className="text-xs font-body mt-1 font-medium text-muted-foreground">
              {opponentKnown ? "Set" : "TBD"}
            </p>
          </div>

          <div className="flex-1 flex items-center gap-1.5 justify-end text-right -translate-y-2">
            <div>
              <p
                className={`tracking-wide text-xl ${opponentKnown ? "" : "text-muted-foreground"}`}
                style={{ fontFamily: "'Saira Stencil One', sans-serif" }}
              >
                {opponentKnown ? feederALabel : "TBD"}
              </p>
              <p className="text-[10px] font-body uppercase tracking-widest text-primary mt-0.5">
                {opponentKnown ? "✓ Advanced" : `${feederALabel} or ${feederBLabel}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Main ---------- */
export interface AdvancedRoundViewProps {
  matches: Match[];
  bracket: BracketSeries[];
  todayMatches: Match[];
  nextMatches: Match[];
}

const CONF_LABEL_FOR: Record<BracketSeries["conference"], string> = {
  East: "EAST",
  West: "WEST",
  Finals: "",
};

const AdvancedRoundView = ({
  matches,
  bracket,
  todayMatches,
  nextMatches,
}: AdvancedRoundViewProps) => {
  // Group matches by round.
  const byRound = useMemo(() => {
    const m: Record<RoundKey, Match[]> = {
      "First Round": [],
      "Conference Semifinals": [],
      "Conference Finals": [],
      "Finals": [],
    };
    for (const match of matches) {
      const r = match.round as RoundKey;
      if (m[r]) m[r].push(match);
    }
    return m;
  }, [matches]);

  // Auto-advance: pick the earliest round with at least one match that still
  // has an unfinished series. If a round has no matches at all, skip it.
  const autoActiveRound = useMemo<RoundKey>(() => {
    for (const r of ROUND_ORDER) {
      const inRound = byRound[r];
      if (inRound.length === 0) continue;
      const allDone = inRound.every((mm) => seriesWinnerAbbr(mm));
      if (!allDone) return r;
    }
    // All known rounds complete → fall through to the latest with matches.
    for (let i = ROUND_ORDER.length - 1; i >= 0; i--) {
      if (byRound[ROUND_ORDER[i]].length > 0) return ROUND_ORDER[i];
    }
    return "First Round";
  }, [byRound]);

  const [activeRound, setActiveRound] = useState<RoundKey>(autoActiveRound);
  const [userSelected, setUserSelected] = useState(false);

  // Keep activeRound in sync with auto until the user manually picks.
  useEffect(() => {
    if (!userSelected) setActiveRound(autoActiveRound);
  }, [autoActiveRound, userSelected]);

  // Map bracket series → winner abbreviation (from real games).
  const winnerByBracketId = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const s of bracket) {
      if (!s.topTeam || !s.bottomTeam) continue;
      const m = matches.find(
        (mm) =>
          (mm.homeTeam.abbreviation === s.topTeam!.abbreviation &&
            mm.awayTeam.abbreviation === s.bottomTeam!.abbreviation) ||
          (mm.homeTeam.abbreviation === s.bottomTeam!.abbreviation &&
            mm.awayTeam.abbreviation === s.topTeam!.abbreviation),
      );
      map[s.id] = m ? seriesWinnerAbbr(m) : undefined;
    }
    return map;
  }, [bracket, matches]);

  // Build "advanced to this round" entries: for each bracket series in the
  // active round whose parents are both known, if exactly one parent has a
  // winner and the other doesn't, the winning team is "waiting" for opponent.
  const advancedEntries = useMemo(() => {
    if (activeRound === "First Round") return [];
    const entries: {
      key: string;
      team: string;
      teamSeed?: number;
      aLabel: string;
      bLabel: string;
      conferenceLabel: string;
    }[] = [];

    const targets = bracket.filter((s) => roundOf(s) === activeRound);

    for (const s of targets) {
      // Skip if this matchup is already a real Match (both teams known and a
      // game exists / will exist in this round).
      const realMatch = matches.find(
        (m) =>
          m.round === activeRound &&
          s.topTeam &&
          s.bottomTeam &&
          ((m.homeTeam.abbreviation === s.topTeam.abbreviation &&
            m.awayTeam.abbreviation === s.bottomTeam.abbreviation) ||
            (m.homeTeam.abbreviation === s.bottomTeam.abbreviation &&
              m.awayTeam.abbreviation === s.topTeam.abbreviation)),
      );
      if (realMatch) continue;

      // Check parents.
      const topParent = s.topParentSeriesId
        ? bracket.find((b) => b.id === s.topParentSeriesId)
        : undefined;
      const bottomParent = s.bottomParentSeriesId
        ? bracket.find((b) => b.id === s.bottomParentSeriesId)
        : undefined;

      const topWinner = s.topParentSeriesId ? winnerByBracketId[s.topParentSeriesId] : undefined;
      const bottomWinner = s.bottomParentSeriesId ? winnerByBracketId[s.bottomParentSeriesId] : undefined;

      // Neither decided → nothing to show.
      if (!topWinner && !bottomWinner) continue;

      // Helper: look up a team's seed from its parent bracket series.
      const seedFor = (parent: BracketSeries | undefined, abbr: string) => {
        if (!parent) return undefined;
        if (parent.topTeam?.abbreviation === abbr) return parent.topTeam.seed;
        if (parent.bottomTeam?.abbreviation === abbr) return parent.bottomTeam.seed;
        return undefined;
      };

      if (topWinner && bottomWinner) {
        // Both teams have advanced but no Match exists yet (API hasn't
        // scheduled the next-round series). Show one card per advanced team,
        // with the now-known opponent as the "feeder" label.
        entries.push({
          key: `${s.id}-top`,
          team: topWinner,
          teamSeed: seedFor(topParent, topWinner),
          aLabel: bottomWinner,
          bLabel: bottomWinner,
          conferenceLabel: CONF_LABEL_FOR[s.conference],
        });
        entries.push({
          key: `${s.id}-bottom`,
          team: bottomWinner,
          teamSeed: seedFor(bottomParent, bottomWinner),
          aLabel: topWinner,
          bLabel: topWinner,
          conferenceLabel: CONF_LABEL_FOR[s.conference],
        });
        continue;
      }

      const winnerAbbr = (topWinner ?? bottomWinner)!;
      const pendingParent = topWinner ? bottomParent : topParent;
      if (!pendingParent || !pendingParent.topTeam || !pendingParent.bottomTeam) continue;

      const decidedParent = topWinner ? topParent : bottomParent;
      const teamSeed = seedFor(decidedParent, winnerAbbr);

      entries.push({
        key: s.id,
        team: winnerAbbr,
        teamSeed,
        aLabel: pendingParent.topTeam.abbreviation,
        bLabel: pendingParent.bottomTeam.abbreviation,
        conferenceLabel: CONF_LABEL_FOR[s.conference],
      });
    }
    return entries;
  }, [activeRound, bracket, matches, winnerByBracketId]);

  const inRound = byRound[activeRound] ?? [];
  const decidedMatches = inRound.filter((m) => seriesWinnerAbbr(m));
  const undecidedInRound = inRound.filter((m) => !seriesWinnerAbbr(m));

  // Today / Next-days come pre-filtered; restrict to the active round.
  const todayInRound = todayMatches.filter((m) => m.round === activeRound && !seriesWinnerAbbr(m));
  const nextInRound = nextMatches.filter((m) => m.round === activeRound && !seriesWinnerAbbr(m));
  const todayIds = new Set(todayInRound.map((m) => m.id));
  const nextIds = new Set(nextInRound.map((m) => m.id));
  const otherMatches = undecidedInRound.filter(
    (m) => !todayIds.has(m.id) && !nextIds.has(m.id),
  );

  // Round selector should always include all four rounds so users can flip
  // forward to see "Advanced to this round" previews even before the API
  // schedules the next round.
  const selectableRounds: RoundKey[] = ROUND_ORDER;

  const roundButtonRefs = useRef<Partial<Record<RoundKey, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const btn = roundButtonRefs.current[activeRound];
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeRound]);

  return (
    <div className="space-y-3">
      {/* Round select */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 -mx-4 px-4 pb-[12px]">
        {selectableRounds.map((r) => {
          const roundMatches = byRound[r];
          const hasMatches = roundMatches.length > 0;
          const isComplete =
            hasMatches && roundMatches.every((m) => seriesWinnerAbbr(m));
          const isActive = activeRound === r;

          let stateClasses: string;
          if (isActive) {
            stateClasses =
              "border-white bg-[#47b4eb]/0 text-primary text-2xl";
          } else if (isComplete) {
            stateClasses =
              "border-secondary/40 bg-secondary/30 hover:bg-secondary/50 text-[#D9D9D9] text-lg";
          } else if (hasMatches) {
            stateClasses =
              "border-border bg-transparent hover:bg-accent/40 text-[#D9D9D9] hover:text-foreground text-2xl";
          } else {
            stateClasses =
              "border-transparent bg-transparent text-[#D9D9D9] hover:text-foreground text-2xl";
          }

          return (
            <button
              key={r}
              ref={(el) => {
                roundButtonRefs.current[r] = el;
              }}
              onClick={() => {
                setUserSelected(true);
                setActiveRound(r);
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border font-display tracking-widest uppercase transition-all duration-700 ease-out ${stateClasses}`}
            >
              {ROUND_LABEL[r]}
              {isComplete && <Check className="w-3 h-3" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {/* Advanced to this round */}
      {advancedEntries.length > 0 && (
        <section className="space-y-2">
          <SectionHead label="Advanced to this round" accent />
          <div className="grid gap-4 md:grid-cols-2">
            {advancedEntries.map((e) => (
              <AdvancedCard
                key={e.key}
                team={e.team}
                teamSeed={e.teamSeed}
                feederALabel={e.aLabel}
                feederBLabel={e.bLabel}
                conferenceLabel={e.conferenceLabel}
                roundLabel={ROUND_LABEL[activeRound]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      {todayInRound.length > 0 && (
        <section className="space-y-2">
          <SectionHead label="Today" />
          <div className="grid gap-4 md:grid-cols-2">
            {todayInRound.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Next days */}
      {nextInRound.length > 0 && (
        <section className="space-y-2">
          <SectionHead label="Next days" />
          <div className="grid gap-4 md:grid-cols-2">
            {nextInRound.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Other undecided matchups in this round */}
      {otherMatches.length > 0 && (
        <section className="space-y-2">
          <SectionHead label={`All ${ROUND_FULL_LABEL[activeRound]} matchups`} />
          <div className="grid gap-4 md:grid-cols-2">
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
          <div className="grid gap-4 md:grid-cols-2">
            {decidedMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Empty states */}
      {inRound.length === 0 && advancedEntries.length === 0 && (
        <div className="rounded-md border border-dashed border-border/60 p-6 text-center">
          <p className="font-body text-xs text-muted-foreground">
            No matchups yet for {ROUND_FULL_LABEL[activeRound]}.
          </p>
        </div>
      )}

    </div>
  );
};

export default AdvancedRoundView;
