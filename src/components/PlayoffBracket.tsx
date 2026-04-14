import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import {
  bracketSeries,
  resolveSeriesTeams,
  isPlayInPlaceholder,
  type BracketSeries,
  type Team,
} from "@/data/playoffsData";

const roundOrder = [
  "First Round",
  "Conference Semifinals",
  "Conference Finals",
  "Finals",
];

const roundLabels: Record<string, string> = {
  "First Round": "1st Round",
  "Conference Semifinals": "Conf. Semis",
  "Conference Finals": "Conf. Finals",
  "Finals": "NBA Finals",
};

interface PlayoffBracketProps {
  picks?: Record<string, string>;
  seriesList?: BracketSeries[];
}

const MatchupCard = ({
  topTeam,
  bottomTeam,
  pickedWinner,
}: {
  topTeam?: Team;
  bottomTeam?: Team;
  pickedWinner?: string;
}) => {
  const renderSlot = (team?: Team, isTop = true) => {
    const isPicked = team && pickedWinner === team.abbreviation;
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 ${
          isTop ? "border-b border-border/50" : ""
        } ${isPicked ? "bg-primary/10" : ""}`}
      >
        {team ? (
          <>
            <span className="text-xs text-muted-foreground font-body font-semibold w-4 text-center">
              {team.seed ?? ""}
            </span>
            <TeamLogo
              src={team.logo}
              alt={team.name}
              className="w-5 h-5"
            />
            <span className="font-body text-sm font-medium flex-1 truncate">
              {isPlayInPlaceholder(team.abbreviation) ? "TBD" : team.abbreviation}
            </span>
            {isPicked && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground font-body w-4" />
            <span className="w-5 h-5 inline-flex items-center justify-center text-sm opacity-30">🏀</span>
            <span className="font-body text-sm text-muted-foreground/50 flex-1">TBD</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border/60 overflow-hidden w-full">
      {renderSlot(topTeam, true)}
      {renderSlot(bottomTeam, false)}
    </div>
  );
};

const PlayoffBracket = ({ picks = {}, seriesList }: PlayoffBracketProps) => {
  const [activeRound, setActiveRound] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bracket = seriesList ?? bracketSeries;
  const round = roundOrder[activeRound];
  const roundSeries = bracket.filter((s) => s.round === round);

  const conferences =
    round === "Finals" ? ["Finals"] : ["West", "East"];

  const goTo = (idx: number) => {
    setActiveRound(Math.max(0, Math.min(roundOrder.length - 1, idx)));
  };

  return (
    <div className="w-full">
      {/* Round navigation tabs – horizontally swipeable like ESPN mobile */}
      <div className="flex items-center gap-1 mb-5">
        <button
          onClick={() => goTo(activeRound - 1)}
          disabled={activeRound === 0}
          className="p-1 rounded-full text-muted-foreground disabled:opacity-20 hover:bg-card transition-colors shrink-0"
          aria-label="Previous round"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide flex-1"
        >
          {roundOrder.map((r, idx) => (
            <button
              key={r}
              onClick={() => goTo(idx)}
              className={`px-3 py-1.5 rounded-full font-body text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                activeRound === idx
                  ? "bg-primary/15 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {roundLabels[r]}
            </button>
          ))}
        </div>

        <button
          onClick={() => goTo(activeRound + 1)}
          disabled={activeRound === roundOrder.length - 1}
          className="p-1 rounded-full text-muted-foreground disabled:opacity-20 hover:bg-card transition-colors shrink-0"
          aria-label="Next round"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Matchups for the active round */}
      {conferences.map((conf) => {
        const confSeries = roundSeries.filter((s) => s.conference === conf);
        if (!confSeries.length) return null;

        return (
          <div key={conf} className="mb-6">
            {conf !== "Finals" && (
              <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3 uppercase">
                {conf === "East" ? "Eastern Conference" : "Western Conference"}
              </h3>
            )}
            <div className="grid gap-3">
              {confSeries.map((series) => {
                const resolved = resolveSeriesTeams(series.id, picks, bracket);
                return (
                  <MatchupCard
                    key={series.id}
                    topTeam={resolved.topTeam ?? series.topTeam}
                    bottomTeam={resolved.bottomTeam ?? series.bottomTeam}
                    pickedWinner={picks[series.id]}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayoffBracket;
