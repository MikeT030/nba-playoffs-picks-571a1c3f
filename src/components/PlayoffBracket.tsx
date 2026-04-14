import TeamLogo from "@/components/TeamLogo";
import {
  bracketSeries as defaultBracketSeries,
  resolveSeriesTeams,
  isPlayInPlaceholder,
  type BracketSeries,
  type Team,
} from "@/data/playoffsData";

// ── Types ──
interface BetSelection {
  seriesId: string;
  winner: string;
  gamesInSeries: number;
}

// ── Layout constants ──
const CARD_H = 88;
const CARD_W = 164;
const CONN_W = 28;
const COL_STEP = CARD_W + CONN_W;

// Vertical positions (top of each card)
const R1_Y = [0, 102, 240, 342];
// Centers: 44, 146, 284, 386
// Semi[0] = (44+146)/2=95 → top=51   Semi[1] = (284+386)/2=335 → top=291
const SEMI_Y = [51, 291];
// CF center = (95+335)/2 = 215 → top=171
const CF_Y = 171;
const FINALS_Y = 171;
const BRACKET_H = 342 + CARD_H; // 430

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
  "NBA Finals",
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
}: {
  team?: Team;
  isPicked: boolean;
  isTop: boolean;
}) => (
  <div
    className={`flex items-center gap-2 px-2.5 ${
      isTop ? "border-b border-border/40" : ""
    } ${isPicked ? "bg-primary/10" : ""}`}
    style={{ height: 32 }}
  >
    {team ? (
      <>
        <TeamLogo src={team.logo} alt={team.name} className="w-6 h-6" />
        <span className="text-[11px] text-muted-foreground font-body font-bold w-3 shrink-0">
          {team.seed ?? ""}
        </span>
        <span className="font-display text-sm tracking-wide flex-1 truncate">
          {isPlayInPlaceholder(team.abbreviation) ? "TBD" : team.abbreviation}
        </span>
        {isPicked && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
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

const BracketCard = ({
  topTeam,
  bottomTeam,
  pickedWinner,
  bet,
  x,
  y,
  isChampionship,
}: {
  topTeam?: Team;
  bottomTeam?: Team;
  pickedWinner?: string;
  bet?: BetSelection;
  x: number;
  y: number;
  isChampionship?: boolean;
}) => {
  const winnerTeam =
    bet?.winner === topTeam?.abbreviation ? topTeam
    : bet?.winner === bottomTeam?.abbreviation ? bottomTeam
    : null;

  return (
    <div
      className={`absolute bg-card rounded-lg border overflow-hidden ${
        isChampionship
          ? "border-primary/40 shadow-md shadow-primary/10"
          : "border-border/60"
      }`}
      style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
    >
      <TeamSlot team={topTeam} isPicked={pickedWinner === topTeam?.abbreviation} isTop />
      <TeamSlot team={bottomTeam} isPicked={pickedWinner === bottomTeam?.abbreviation} isTop={false} />

      {/* Pick summary */}
      {winnerTeam ? (
        <div className="flex items-center justify-center" style={{ height: 24 }}>
          <span className="text-[10px] font-body text-primary font-medium">
            <span className="font-medium">{winnerTeam.name}</span> in{" "}
            <span className="font-medium">{bet!.gamesInSeries}</span> games
          </span>
        </div>
      ) : (
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
}

const PlayoffBracket = ({ picks = {}, bets = [], seriesList }: PlayoffBracketProps) => {
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
      />
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-4 -mx-4 px-4">
      <div style={{ width: TOTAL_W, minWidth: TOTAL_W }}>
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
        <div className="flex justify-between mb-3" style={{ width: TOTAL_W }}>
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
        </div>
      </div>
    </div>
  );
};

export default PlayoffBracket;
