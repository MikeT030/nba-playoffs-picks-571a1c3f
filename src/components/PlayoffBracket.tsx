import TeamLogo from "@/components/TeamLogo";
import {
  bracketSeries as defaultBracketSeries,
  resolveSeriesTeams,
  isPlayInPlaceholder,
  type BracketSeries,
  type Team,
} from "@/data/playoffsData";

// ── Layout constants ──
const CARD_H = 48;
const CARD_W = 132;
const CONN_W = 28;
const COL_STEP = CARD_W + CONN_W; // 160

// Vertical card positions (top of each card)
const R1_Y = [0, 58, 148, 206];
// Centers: 24, 82, 172, 230
// Semi centered between feeder pairs
// Semi[0] = (24+82)/2 - 24 = 29
// Semi[1] = (172+230)/2 - 24 = 177
const SEMI_Y = [29, 177];
// CF centered between semis: ((29+24)+(177+24))/2 - 24 = 127 - 24 = 103
const CF_Y = 103;
const FINALS_Y = 103;
const BRACKET_H = 206 + CARD_H; // 254

// Column x-positions (left edge)
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

// ── Series ID mappings to column positions ──
const westR1Ids = ["west-r1-1v8", "west-r1-4v5", "west-r1-3v6", "west-r1-2v7"];
const westSemiIds = ["west-semi-top", "west-semi-bottom"];
const eastR1Ids = ["east-r1-1v8", "east-r1-4v5", "east-r1-3v6", "east-r1-2v7"];
const eastSemiIds = ["east-semi-top", "east-semi-bottom"];

// ── Round header labels ──
const headerLabels = [
  { x: COLS.r1w, label: "1st Round" },
  { x: COLS.sw, label: "Conf. Semis" },
  { x: COLS.cfw, label: "Conf. Finals" },
  { x: COLS.finals, label: "NBA Finals" },
  { x: COLS.cfe, label: "Conf. Finals" },
  { x: COLS.se, label: "Conf. Semis" },
  { x: COLS.r1e, label: "1st Round" },
];

// ── SVG connector path builder ──
function bracketPath(
  fromX: number, fromCY: number,
  toX: number, toCY: number,
  dir: "right" | "left"
): string {
  if (dir === "right") {
    const sx = fromX + CARD_W;
    const ex = toX;
    const mx = sx + CONN_W / 2;
    return `M${sx},${fromCY} H${mx} V${toCY} H${ex}`;
  } else {
    const sx = fromX;
    const ex = toX + CARD_W;
    const mx = sx - CONN_W / 2;
    return `M${sx},${fromCY} H${mx} V${toCY} H${ex}`;
  }
}

function cy(top: number) { return top + CARD_H / 2; }

function generateConnectors(): string[] {
  const paths: string[] = [];

  // West: R1 → Semi
  paths.push(bracketPath(COLS.r1w, cy(R1_Y[0]), COLS.sw, cy(SEMI_Y[0]), "right"));
  paths.push(bracketPath(COLS.r1w, cy(R1_Y[1]), COLS.sw, cy(SEMI_Y[0]), "right"));
  paths.push(bracketPath(COLS.r1w, cy(R1_Y[2]), COLS.sw, cy(SEMI_Y[1]), "right"));
  paths.push(bracketPath(COLS.r1w, cy(R1_Y[3]), COLS.sw, cy(SEMI_Y[1]), "right"));

  // West: Semi → CF
  paths.push(bracketPath(COLS.sw, cy(SEMI_Y[0]), COLS.cfw, cy(CF_Y), "right"));
  paths.push(bracketPath(COLS.sw, cy(SEMI_Y[1]), COLS.cfw, cy(CF_Y), "right"));

  // West: CF → Finals
  const wcfRight = COLS.cfw + CARD_W;
  const finalsLeft = COLS.finals;
  paths.push(`M${wcfRight},${cy(CF_Y)} H${finalsLeft}`);

  // East: R1 → Semi
  paths.push(bracketPath(COLS.r1e, cy(R1_Y[0]), COLS.se, cy(SEMI_Y[0]), "left"));
  paths.push(bracketPath(COLS.r1e, cy(R1_Y[1]), COLS.se, cy(SEMI_Y[0]), "left"));
  paths.push(bracketPath(COLS.r1e, cy(R1_Y[2]), COLS.se, cy(SEMI_Y[1]), "left"));
  paths.push(bracketPath(COLS.r1e, cy(R1_Y[3]), COLS.se, cy(SEMI_Y[1]), "left"));

  // East: Semi → CF
  paths.push(bracketPath(COLS.se, cy(SEMI_Y[0]), COLS.cfe, cy(CF_Y), "left"));
  paths.push(bracketPath(COLS.se, cy(SEMI_Y[1]), COLS.cfe, cy(CF_Y), "left"));

  // East: CF → Finals
  const ecfLeft = COLS.cfe;
  const finalsRight = COLS.finals + CARD_W;
  paths.push(`M${ecfLeft},${cy(CF_Y)} H${finalsRight}`);

  return paths;
}

const connectorPaths = generateConnectors();

// ── Components ──

const TeamRow = ({
  team,
  isPicked,
  isTop,
}: {
  team?: Team;
  isPicked: boolean;
  isTop: boolean;
}) => (
  <div
    className={`flex items-center gap-1.5 px-2.5 h-[24px] ${
      isTop ? "border-b border-border/40" : ""
    } ${isPicked ? "bg-primary/10" : ""}`}
  >
    {team ? (
      <>
        <TeamLogo src={team.logo} alt={team.name} className="w-4 h-4" />
        <span className="text-[10px] text-muted-foreground font-body font-bold w-3 text-center shrink-0">
          {team.seed ?? ""}
        </span>
        <span className="font-body text-xs font-semibold flex-1 truncate">
          {isPlayInPlaceholder(team.abbreviation) ? "TBD" : team.name}
        </span>
        {isPicked && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
      </>
    ) : (
      <>
        <span className="w-4 h-4 inline-flex items-center justify-center text-[10px] opacity-30">🏀</span>
        <span className="text-[10px] w-3" />
        <span className="font-body text-xs text-muted-foreground/50 flex-1">TBD</span>
      </>
    )}
  </div>
);

const BracketCard = ({
  topTeam,
  bottomTeam,
  pickedWinner,
  x,
  y,
  isChampionship,
}: {
  topTeam?: Team;
  bottomTeam?: Team;
  pickedWinner?: string;
  x: number;
  y: number;
  isChampionship?: boolean;
}) => (
  <div
    className={`absolute bg-card rounded border border-border/60 overflow-hidden ${
      isChampionship ? "shadow-md" : ""
    }`}
    style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
  >
    <TeamRow team={topTeam} isPicked={pickedWinner === topTeam?.abbreviation} isTop />
    <TeamRow team={bottomTeam} isPicked={pickedWinner === bottomTeam?.abbreviation} isTop={false} />
  </div>
);

// ── Main bracket ──

interface PlayoffBracketProps {
  picks?: Record<string, string>;
  seriesList?: BracketSeries[];
}

const PlayoffBracket = ({ picks = {}, seriesList }: PlayoffBracketProps) => {
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
          {headerLabels.map((h, i) => (
            <div
              key={i}
              className="text-center font-body text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
              style={{ width: CARD_W, marginRight: i < 6 ? CONN_W : 0 }}
            >
              {h.label}
            </div>
          ))}
        </div>

        {/* Conference labels */}
        <div className="flex justify-between mb-2" style={{ width: TOTAL_W }}>
          <span className="font-display text-xs tracking-wider text-foreground uppercase">
            Western Conference
          </span>
          <span className="font-display text-xs tracking-wider text-foreground uppercase">
            Eastern Conference
          </span>
        </div>

        {/* Bracket area */}
        <div className="relative" style={{ width: TOTAL_W, height: BRACKET_H }}>
          {/* SVG connector lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={TOTAL_W}
            height={BRACKET_H}
            fill="none"
          >
            {connectorPaths.map((d, i) => (
              <path
                key={i}
                d={d}
                stroke="hsl(var(--border))"
                strokeWidth={1.5}
                strokeOpacity={0.5}
              />
            ))}
          </svg>

          {/* West R1 */}
          {westR1Ids.map((id, i) => renderCard(id, COLS.r1w, R1_Y[i]))}

          {/* West Semi */}
          {westSemiIds.map((id, i) => renderCard(id, COLS.sw, SEMI_Y[i]))}

          {/* West CF */}
          {renderCard("west-conf-finals", COLS.cfw, CF_Y)}

          {/* Finals */}
          {renderCard("nba-finals", COLS.finals, FINALS_Y, true)}

          {/* East CF */}
          {renderCard("east-conf-finals", COLS.cfe, CF_Y)}

          {/* East Semi */}
          {eastSemiIds.map((id, i) => renderCard(id, COLS.se, SEMI_Y[i]))}

          {/* East R1 */}
          {eastR1Ids.map((id, i) => renderCard(id, COLS.r1e, R1_Y[i]))}
        </div>
      </div>
    </div>
  );
};

export default PlayoffBracket;
