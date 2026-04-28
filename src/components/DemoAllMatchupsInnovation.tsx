import { useState } from "react";
import { ChevronDown, Trophy, Check } from "lucide-react";
import { teamMeta } from "@/lib/nbaApi";

/**
 * DEMO: "All Matchups" innovation
 *  A) Round section headers
 *  1) Collapsible completed rounds
 *  3) Mini-bracket header (advancement map)
 *
 * Self-contained — uses faked late-playoffs data so reviewers can see
 * exactly how the view scales when the playoffs reach the Finals.
 */

type Status = "final" | "live" | "upcoming";

interface DemoMatch {
  id: string;
  conf: "EAST" | "WEST" | "FINALS";
  round: "First Round" | "Conf. Semifinals" | "Conf. Finals" | "NBA Finals";
  away: string;
  home: string;
  awaySeed?: number;
  homeSeed?: number;
  series: [number, number]; // [away wins, home wins]
  status: Status;
  winner?: string; // abbreviation
}

const m = (
  id: string,
  conf: DemoMatch["conf"],
  round: DemoMatch["round"],
  away: string,
  home: string,
  awaySeed: number | undefined,
  homeSeed: number | undefined,
  series: [number, number],
  status: Status,
  winner?: string,
): DemoMatch => ({ id, conf, round, away, home, awaySeed, homeSeed, series, status, winner });

// Fake late-playoffs slate: NBA Finals live, conf finals done, semis done, R1 done
const DEMO_MATCHES: DemoMatch[] = [
  // First Round — East
  m("e18", "EAST", "First Round", "MIA", "BOS", 8, 1, [1, 4], "final", "BOS"),
  m("e45", "EAST", "First Round", "ORL", "CLE", 5, 4, [3, 4], "final", "CLE"),
  m("e36", "EAST", "First Round", "PHI", "NYK", 6, 3, [2, 4], "final", "NYK"),
  m("e27", "EAST", "First Round", "IND", "MIL", 7, 2, [4, 2], "final", "IND"),
  // First Round — West
  m("w18", "WEST", "First Round", "NOP", "OKC", 8, 1, [0, 4], "final", "OKC"),
  m("w45", "WEST", "First Round", "LAL", "DEN", 5, 4, [1, 4], "final", "DEN"),
  m("w36", "WEST", "First Round", "PHX", "MIN", 6, 3, [0, 4], "final", "MIN"),
  m("w27", "WEST", "First Round", "DAL", "LAC", 7, 2, [4, 2], "final", "DAL"),
  // Conf. Semis
  m("ecs1", "EAST", "Conf. Semifinals", "CLE", "BOS", 4, 1, [1, 4], "final", "BOS"),
  m("ecs2", "EAST", "Conf. Semifinals", "IND", "NYK", 7, 3, [4, 3], "final", "IND"),
  m("wcs1", "WEST", "Conf. Semifinals", "DEN", "OKC", 4, 1, [3, 4], "final", "OKC"),
  m("wcs2", "WEST", "Conf. Semifinals", "DAL", "MIN", 7, 3, [4, 1], "final", "DAL"),
  // Conf. Finals
  m("ecf", "EAST", "Conf. Finals", "IND", "BOS", 7, 1, [0, 4], "final", "BOS"),
  m("wcf", "WEST", "Conf. Finals", "DAL", "OKC", 7, 1, [4, 2], "final", "DAL"),
  // NBA Finals — live
  m("fin", "FINALS", "NBA Finals", "DAL", "BOS", undefined, undefined, [1, 2], "live"),
];

const ROUND_ORDER: DemoMatch["round"][] = [
  "NBA Finals",
  "Conf. Finals",
  "Conf. Semifinals",
  "First Round",
];

const colorFor = (abbr: string) => teamMeta[abbr]?.color ?? "#444";

/* ---------- Mini bracket header ---------- */
const MiniBracket = () => {
  // East advancement chain (top→bottom): R1 winners → Semi winners → CF winner
  const eastR1 = ["BOS", "CLE", "NYK", "IND"];
  const westR1 = ["OKC", "DEN", "MIN", "DAL"];
  const eastSemi = ["BOS", "IND"];
  const westSemi = ["OKC", "DAL"];
  const eastCF = "BOS";
  const westCF = "DAL";

  const Dot = ({ abbr, dim }: { abbr: string; dim?: boolean }) => (
    <span
      className="inline-block rounded-sm font-body font-bold text-[8px] tracking-wider px-1 py-[1px]"
      style={{
        backgroundColor: colorFor(abbr),
        color: "white",
        opacity: dim ? 0.45 : 1,
      }}
    >
      {abbr}
    </span>
  );

  const Column = ({ teams, className = "" }: { teams: string[]; className?: string }) => (
    <div className={`flex flex-col gap-[3px] ${className}`}>
      {teams.map((t) => (
        <Dot key={t} abbr={t} />
      ))}
    </div>
  );

  return (
    <div className="bg-background/40 rounded-md p-3">
      <p className="font-body text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        Advancement
      </p>
      <div className="flex items-center justify-between gap-1">
        {/* East */}
        <Column teams={eastR1} />
        <ChevronDown size={10} className="text-muted-foreground -rotate-90" />
        <Column teams={eastSemi} className="justify-around h-full" />
        <ChevronDown size={10} className="text-muted-foreground -rotate-90" />
        <Dot abbr={eastCF} />
        <ChevronDown size={10} className="text-primary -rotate-90" />
        {/* Trophy */}
        <Trophy size={14} className="text-primary shrink-0" />
        <ChevronDown size={10} className="text-primary rotate-90" />
        {/* West */}
        <Dot abbr={westCF} />
        <ChevronDown size={10} className="text-muted-foreground rotate-90" />
        <Column teams={westSemi} className="justify-around h-full" />
        <ChevronDown size={10} className="text-muted-foreground rotate-90" />
        <Column teams={westR1} />
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="font-body text-[9px] uppercase tracking-wider text-muted-foreground">
          East
        </span>
        <span className="font-body text-[9px] uppercase tracking-wider text-primary">
          Finals
        </span>
        <span className="font-body text-[9px] uppercase tracking-wider text-muted-foreground">
          West
        </span>
      </div>
    </div>
  );
};

/* ---------- Compact match card ---------- */
const CompactCard = ({ match }: { match: DemoMatch }) => {
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
      <div className="relative px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {match.awaySeed && (
            <span className="text-[10px] text-muted-foreground font-body font-semibold w-3 text-center">
              {match.awaySeed}
            </span>
          )}
          <span
            className={`font-body font-bold text-sm tracking-wider ${awayWon ? "text-white" : "text-muted-foreground"}`}
          >
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
          <span
            className={`font-body font-bold text-sm tracking-wider ${homeWon ? "text-white" : "text-muted-foreground"}`}
          >
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

/* ---------- Round section ---------- */
const RoundSection = ({
  round,
  matches,
  defaultOpen,
}: {
  round: DemoMatch["round"];
  matches: DemoMatch[];
  defaultOpen: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const allDone = matches.every((m) => m.status === "final");
  const hasLive = matches.some((m) => m.status === "live");

  return (
    <section className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-1"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm tracking-widest uppercase">
            {round}
          </h3>
          <span className="font-body text-[10px] text-muted-foreground">
            ({matches.length})
          </span>
          {hasLive && (
            <span className="inline-flex items-center gap-1 text-[9px] font-body font-semibold uppercase tracking-widest text-[#fe953e]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE943E] animate-pulse" />
              Live
            </span>
          )}
          {allDone && !hasLive && (
            <Check size={11} className="text-muted-foreground" />
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-1.5">
          {matches.map((mt) => (
            <CompactCard key={mt.id} match={mt} />
          ))}
        </div>
      )}
    </section>
  );
};

/* ---------- Main demo ---------- */
const DemoAllMatchupsInnovation = () => {
  const grouped = ROUND_ORDER.map((round) => ({
    round,
    matches: DEMO_MATCHES.filter((m) => m.round === round),
  })).filter((g) => g.matches.length > 0);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-lg tracking-wider text-muted-foreground">
          DEMO — ALL MATCHUPS, LATE PLAYOFFS
        </h2>
        <p className="font-body text-xs text-muted-foreground mt-1">
          Mini-bracket header + round sections. Completed rounds collapse so the
          live round stays in focus.
        </p>
      </div>

      <MiniBracket />

      <div className="space-y-3">
        {grouped.map(({ round, matches }) => {
          const allDone = matches.every((m) => m.status === "final");
          const hasLive = matches.some((m) => m.status === "live");
          // Open: live round + most recent completed round; collapse older rounds
          const defaultOpen = hasLive || (round === "Conf. Finals" && !hasLive)
            ? true
            : !allDone;
          return (
            <RoundSection
              key={round}
              round={round}
              matches={matches}
              defaultOpen={defaultOpen}
            />
          );
        })}
      </div>
    </div>
  );
};

export default DemoAllMatchupsInnovation;
