import { forwardRef } from "react";
import { Check, X, Trophy } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import {
  bracketSeries as defaultBracketSeries,
  resolveSeriesTeams,
  isPlayInPlaceholder,
  getAssumedOpponentAbbr,
  type BracketSeries,
  type Team,
} from "@/data/playoffsData";
import type { PickPointInfo } from "@/lib/pickScoring";

export type BracketVariant = "badge" | "ring" | "stripe" | "trophy";

// ── Types ──
interface BetSelection {
  seriesId: string;
  winner: string;
  gamesInSeries: number;
}

// ── Layout constants ──
const CARD_H = 108;
const CARD_W = 189;
const CONN_W = 28;
const COL_STEP = CARD_W + CONN_W;

// Vertical positions (top of each card)
const R1_Y = [0, 120, 276, 396];
// Centers: 54, 174, 330, 450
// Semi[0] = (54+174)/2=114 → top=60   Semi[1] = (330+450)/2=390 → top=336
const SEMI_Y = [60, 336];
// CF center = (114+390)/2 = 252 → top=198
const CF_Y = 198;
const FINALS_Y = 198;
const BRACKET_H = R1_Y[R1_Y.length - 1] + CARD_H; // 442

const COLS = {
  r1w: 0,
  sw: COL_STEP,
  cfw: 2 * COL_STEP,
  finals: 3 * COL_STEP,
  cfe: 4 * COL_STEP,
  se: 5 * COL_STEP,
  r1e: 6 * COL_STEP,
};
const TOTAL_W = 7 * CARD_W + 6 * CONN_W;

const westR1Ids = ["west-r1-1v8", "west-r1-4v5", "west-r1-3v6", "west-r1-2v7"];
const westSemiIds = ["west-semi-top", "west-semi-bottom"];
const eastR1Ids = ["east-r1-1v8", "east-r1-4v5", "east-r1-3v6", "east-r1-2v7"];
const eastSemiIds = ["east-semi-top", "east-semi-bottom"];

const headerLabels = [
  "1st Round", "Conf. Semis", "Conf. Finals",
  "Finals",
  "Conf. Finals", "Conf. Semis", "1st Round",
];

// ── SVG connector helpers ──
function cy(top: number) { return top + CARD_H / 2; }

function bracketPath(
  fromX: number, fromCY: number,
  toX: number, toCY: number,
  dir: "right" | "left"
): string {
  if (dir === "right") {
    const sx = fromX + CARD_W;
    const mx = sx + CONN_W / 2;
    return `M${sx},${fromCY} H${mx} V${toCY} H${toX}`;
  } else {
    const mx = fromX - CONN_W / 2;
    return `M${fromX},${fromCY} H${mx} V${toCY} H${toX + CARD_W}`;
  }
}

function generateConnectors(): string[] {
  const p: string[] = [];
  // West R1→Semi
  p.push(bracketPath(COLS.r1w, cy(R1_Y[0]), COLS.sw, cy(SEMI_Y[0]), "right"));
  p.push(bracketPath(COLS.r1w, cy(R1_Y[1]), COLS.sw, cy(SEMI_Y[0]), "right"));
  p.push(bracketPath(COLS.r1w, cy(R1_Y[2]), COLS.sw, cy(SEMI_Y[1]), "right"));
  p.push(bracketPath(COLS.r1w, cy(R1_Y[3]), COLS.sw, cy(SEMI_Y[1]), "right"));
  // West Semi→CF
  p.push(bracketPath(COLS.sw, cy(SEMI_Y[0]), COLS.cfw, cy(CF_Y), "right"));
  p.push(bracketPath(COLS.sw, cy(SEMI_Y[1]), COLS.cfw, cy(CF_Y), "right"));
  // West CF→Finals
  p.push(`M${COLS.cfw + CARD_W},${cy(CF_Y)} H${COLS.finals}`);
  // East R1→Semi
  p.push(bracketPath(COLS.r1e, cy(R1_Y[0]), COLS.se, cy(SEMI_Y[0]), "left"));
  p.push(bracketPath(COLS.r1e, cy(R1_Y[1]), COLS.se, cy(SEMI_Y[0]), "left"));
  p.push(bracketPath(COLS.r1e, cy(R1_Y[2]), COLS.se, cy(SEMI_Y[1]), "left"));
  p.push(bracketPath(COLS.r1e, cy(R1_Y[3]), COLS.se, cy(SEMI_Y[1]), "left"));
  // East Semi→CF
  p.push(bracketPath(COLS.se, cy(SEMI_Y[0]), COLS.cfe, cy(CF_Y), "left"));
  p.push(bracketPath(COLS.se, cy(SEMI_Y[1]), COLS.cfe, cy(CF_Y), "left"));
  // East CF→Finals
  p.push(`M${COLS.cfe},${cy(CF_Y)} H${COLS.finals + CARD_W}`);
  return p;
}

const connectorPaths = generateConnectors();

// ── Card components ──

const TeamSlot = ({
  team,
  isPicked,
  isTop,
  actualWinnerAbbr,
  variant,
  teamWins,
  totalGames,
}: {
  team?: Team;
  isPicked: boolean;
  isTop: boolean;
  actualWinnerAbbr?: string;
  variant?: BracketVariant;
  teamWins?: number;
  totalGames?: number;
}) => {
  const isActualWinner = !!team && !!actualWinnerAbbr && team.abbreviation === actualWinnerAbbr;
  const isActualLoser = !!team && !!actualWinnerAbbr && team.abbreviation !== actualWinnerAbbr;
  const isDecided = !!actualWinnerAbbr;

  const winnerRowClass =
    isActualWinner && variant === "stripe"
      ? "border-l-2 border-l-emerald-400"
      : "";

  return (
    <div
      className={`flex items-center gap-2 px-2.5 ${
        isTop ? "border-b border-border/40" : ""
      } ${isPicked ? "bg-primary/10" : ""} ${
        isActualWinner ? "bg-emerald-500/5" : ""
      } ${winnerRowClass}`}
      style={{ height: 36 }}
    >
      {team ? (
        <>
          <TeamLogo
            src={team.logo}
            alt={team.name}
            className={`w-6 h-6 ${isActualLoser ? "opacity-40 grayscale" : ""}`}
          />
          <span className="text-[11px] text-muted-foreground font-body font-bold w-3 shrink-0">
            {team.seed ?? ""}
          </span>
          <span
            className={`font-display text-sm tracking-wide flex-1 whitespace-nowrap ${
              isActualLoser ? "text-muted-foreground/50 line-through" : ""
            }`}
            style={{ color: isActualWinner ? "#EEEEEE" : undefined }}
          >
            {isPlayInPlaceholder(team.abbreviation)
              ? "TBD"
              : isDecided && isActualWinner && typeof totalGames === "number"
              ? `${team.abbreviation} in ${totalGames}`
              : !isDecided && typeof teamWins === "number"
              ? `${team.abbreviation} ${teamWins}`
              : team.abbreviation}
          </span>
          {isActualWinner && variant === "trophy" && (
            <Trophy size={12} className="text-emerald-400 shrink-0" />
          )}
          {isActualWinner && variant === "badge" && (
            <span className="text-[9px] font-body font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded shrink-0">
              ADV
            </span>
          )}
          {isPicked && !isActualWinner && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
        </>
      ) : (
        <>
          <span className="w-6 h-6 inline-flex items-center justify-center text-sm opacity-30">🏀</span>
          <span className="text-[11px] w-3" />
          <span className="font-display text-sm tracking-wide text-muted-foreground/50 flex-1">TBD</span>
        </>
      )}
    </div>
  );
};

const PointsTag = ({
  point,
  variant,
}: {
  point?: PickPointInfo;
  variant: BracketVariant;
}) => {
  if (!point || point.kind === "none") return null;
  const colorByKind: Record<string, string> = {
    perfect: "text-emerald-300 bg-emerald-500/15 border-emerald-400/40",
    winner: "text-amber-300 bg-amber-500/15 border-amber-400/40",
    loose: "text-sky-300 bg-sky-500/15 border-sky-400/40",
  };
  const cls = colorByKind[point.kind];
  if (variant === "badge" || variant === "trophy") {
    return (
      <span className={`text-[9px] font-body font-bold px-1.5 py-0.5 rounded-full border ${cls}`}>
        +{point.points}
      </span>
    );
  }
  return (
    <span className={`text-[10px] font-body font-bold ${cls.split(" ")[0]}`}>+{point.points}</span>
  );
};

const BracketCard = ({
  topTeam,
  bottomTeam,
  pickedWinner,
  bet,
  x,
  y,
  isChampionship,
  actualWinnerAbbr,
  pickPoint,
  variant = "badge",
  seriesScore,
  seriesId,
  seriesList,
  allPicks,
}: {
  topTeam?: Team;
  bottomTeam?: Team;
  pickedWinner?: string;
  bet?: BetSelection;
  x: number;
  y: number;
  isChampionship?: boolean;
  actualWinnerAbbr?: string;
  pickPoint?: PickPointInfo;
  variant?: BracketVariant;
  seriesScore?: string;
  seriesId: string;
  seriesList: BracketSeries[];
  allPicks: { series_id: string; winner: string }[];
}) => {
  const winnerTeam =
    bet?.winner === topTeam?.abbreviation ? topTeam
    : bet?.winner === bottomTeam?.abbreviation ? bottomTeam
    : null;

  const isCorrect = !!actualWinnerAbbr && !!bet && bet.winner === actualWinnerAbbr;
  const isWrong = !!actualWinnerAbbr && !!bet && bet.winner !== actualWinnerAbbr;

  const variantOutline =
    variant === "ring" && isCorrect
      ? "border-emerald-400/60"
      : variant === "ring" && isWrong
      ? "border-rose-400/40"
      : "border-border/50";

  // Parse "topWins-bottomWins" so we can render each team's score on its row.
  const [topWins, bottomWins] = (() => {
    if (!seriesScore) return [undefined, undefined] as const;
    const m = seriesScore.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!m) return [undefined, undefined] as const;
    return [Number(m[1]), Number(m[2])] as const;
  })();
  const totalGames =
    typeof topWins === "number" && typeof bottomWins === "number"
      ? topWins + bottomWins
      : undefined;

  return (
    <div
      className={`absolute rounded-lg bg-[#181C23]/60 backdrop-blur-md border ${variantOutline} ${
        isChampionship
          ? "shadow-md shadow-primary/10"
          : "hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
      }`}
      style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
    >
      <TeamSlot
        team={topTeam}
        isPicked={pickedWinner === topTeam?.abbreviation}
        isTop
        actualWinnerAbbr={actualWinnerAbbr}
        variant={variant}
        teamWins={topWins}
        totalGames={totalGames}
      />
      <TeamSlot
        team={bottomTeam}
        isPicked={pickedWinner === bottomTeam?.abbreviation}
        isTop={false}
        actualWinnerAbbr={actualWinnerAbbr}
        variant={variant}
        teamWins={bottomWins}
        totalGames={totalGames}
      />

      {bet && (winnerTeam || (topTeam && bottomTeam)) ? (() => {
        const broken = !winnerTeam;
        const assumedOpp = getAssumedOpponentAbbr(seriesId, bet.winner, seriesList, allPicks);
        const actualOpp = topTeam?.abbreviation === bet.winner
          ? bottomTeam?.abbreviation
          : bottomTeam?.abbreviation === bet.winner
            ? topTeam?.abbreviation
            : null;
        const showAssumed = broken
          ? !!assumedOpp
          : !!assumedOpp && !!actualOpp && actualOpp !== assumedOpp;
        const suffixOpp = assumedOpp ?? actualOpp;
        return (
          <div className="flex items-center justify-center gap-1.5 px-1" style={{ height: 24 }}>
            {actualWinnerAbbr && !broken &&
              (isCorrect ? (
                <Check size={11} className="text-emerald-400 shrink-0" />
              ) : (
                <X size={11} className="text-rose-400 shrink-0" />
              ))}
            {broken && <X size={11} className="text-rose-400 shrink-0" />}
            <span
              className={`text-[10px] font-body font-medium whitespace-nowrap ${
                (actualWinnerAbbr && isWrong) || broken ? "text-rose-300/80" : "text-primary"
              }`}
            >
              Your Pick:{" "}
              <span className={broken ? "line-through opacity-70" : ""}>
                {bet.winner} in {bet.gamesInSeries}
                {showAssumed && suffixOpp ? ` (vs. ${suffixOpp})` : ""}
              </span>
            </span>
            {!broken && <PointsTag point={pickPoint} variant={variant} />}
          </div>
        );
      })() : (
        <div className="flex items-center justify-center" style={{ height: 24 }}>
          <span className="text-[10px] font-body text-muted-foreground/40 italic">No pick</span>
        </div>
      )}
    </div>
  );
};

// ── Main bracket ──

interface PlayoffBracketProps {
  picks?: Record<string, string>;
  bets?: BetSelection[];
  seriesList?: BracketSeries[];
  /** Map of seriesId → actual winning team abbreviation (from results). */
  actualWinners?: Record<string, string>;
  /** Map of seriesId → scored points info for the user's pick on that series. */
  pickPoints?: Record<string, PickPointInfo>;
  /** Visual style for showing actual results & per-pick points. */
  variant?: BracketVariant;
  /** Map of seriesId → series score string (e.g. "4-2") shown as the actual matchup standing. */
  seriesScores?: Record<string, string>;
  /** Optional champion team name shown above the Finals card, aligned to the Finals column. */
  championName?: string;
  /** Optional champion team logo URL shown next to the champion name. */
  championLogoSrc?: string;
}

const PlayoffBracket = forwardRef<HTMLDivElement, PlayoffBracketProps>(({
  picks = {},
  bets = [],
  seriesList,
  actualWinners = {},
  pickPoints = {},
  variant = "badge",
  seriesScores = {},
  championName,
  championLogoSrc,
}, ref) => {
  const bracket = seriesList ?? defaultBracketSeries;

  const resolve = (id: string) => {
    const series = bracket.find((s) => s.id === id);
    if (!series) return { topTeam: undefined, bottomTeam: undefined };
    const resolved = resolveSeriesTeams(id, picks, bracket);
    return {
      topTeam: resolved.topTeam ?? series.topTeam,
      bottomTeam: resolved.bottomTeam ?? series.bottomTeam,
    };
  };

  const renderCard = (id: string, x: number, y: number, isChamp = false) => {
    const { topTeam, bottomTeam } = resolve(id);
    return (
      <BracketCard
        key={id}
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        pickedWinner={picks[id]}
        bet={bets.find((b) => b.seriesId === id)}
        x={x}
        y={y}
        isChampionship={isChamp}
        actualWinnerAbbr={actualWinners[id]}
        pickPoint={pickPoints[id]}
        variant={variant}
        seriesScore={seriesScores[id]}
        seriesId={id}
        seriesList={bracket}
        allPicks={bets.map((b) => ({ series_id: b.seriesId, winner: b.winner }))}
      />
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-4 mx-0 px-0 pt-[8px]">
      <div ref={ref} style={{ width: TOTAL_W, minWidth: TOTAL_W }}>
        {/* Round headers */}
        <div className="flex mb-1" style={{ width: TOTAL_W }}>
          {headerLabels.map((label, i) => (
            <div
              key={i}
              className="text-center font-body text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
              style={{ width: CARD_W, marginRight: i < 6 ? CONN_W : 0 }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Conference labels */}
        <div className="flex justify-between mb-3 pt-[4px]" style={{ width: TOTAL_W }}>
          <span className="font-display text-xs tracking-wider text-foreground uppercase">
            Western Conference
          </span>
          <span className="font-display text-xs tracking-wider text-foreground uppercase">
            Eastern Conference
          </span>
        </div>

        {/* Bracket area */}
        <div className="relative" style={{ width: TOTAL_W, height: BRACKET_H }}>
          <svg
            className="absolute inset-0 pointer-events-none"
            width={TOTAL_W}
            height={BRACKET_H}
            fill="none"
          >
            {connectorPaths.map((d, i) => (
              <path key={i} d={d} stroke="hsl(var(--border))" strokeWidth={1.5} strokeOpacity={0.5} />
            ))}
          </svg>

          {westR1Ids.map((id, i) => renderCard(id, COLS.r1w, R1_Y[i]))}
          {westSemiIds.map((id, i) => renderCard(id, COLS.sw, SEMI_Y[i]))}
          {renderCard("west-conf-finals", COLS.cfw, CF_Y)}
          {renderCard("nba-finals", COLS.finals, FINALS_Y, true)}
          {renderCard("east-conf-finals", COLS.cfe, CF_Y)}
          {eastSemiIds.map((id, i) => renderCard(id, COLS.se, SEMI_Y[i]))}
          {eastR1Ids.map((id, i) => renderCard(id, COLS.r1e, R1_Y[i]))}

          {championName && (
            <div
              className="absolute pointer-events-none text-center"
              style={{
                left: COLS.finals,
                width: CARD_W,
                top: 40,
              }}
            >
              <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">
                Champion
              </p>
              <div className="flex flex-col items-center justify-center gap-1 mt-1">
                {championLogoSrc && (
                  <TeamLogo
                    src={championLogoSrc}
                    alt={`${championName} logo`}
                    className="w-12 h-12"
                  />
                )}
                <p className="font-display text-base tracking-wider" style={{ color: "#EEEEEE" }}>
                  {championName}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PlayoffBracket.displayName = "PlayoffBracket";

export default PlayoffBracket;
