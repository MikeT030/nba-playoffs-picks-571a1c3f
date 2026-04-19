import { useQuery } from "@tanstack/react-query";
import { teamMeta, type NbaGame } from "@/lib/nbaApi";
import { type Team, teamSeeds } from "@/data/playoffsData";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";

export interface SeriesGame {
  gameNumber: number;
  date: string;
  status: "final" | "live" | "upcoming";
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  seriesRecord: [number, number];
  ot?: number;
  /** Tip-off timestamp in ms (UTC). Undefined if API has no precise time. */
  startsAt?: number;
}

const LIVE_STATUS_RE = /^(1st|2nd|3rd|4th)\s*Qtr$|^Halftime$/i;

function nbaTeamToTeam(t: { full_name: string; abbreviation: string }): Team {
  const meta = teamMeta[t.abbreviation] || { color: "#666", logo: "🏀" };
  return {
    name: t.full_name,
    abbreviation: t.abbreviation,
    color: meta.color,
    logo: meta.logo,
    seed: teamSeeds[t.abbreviation],
  };
}

function classifyStatus(g: NbaGame): "final" | "live" | "upcoming" {
  if (g.status === "Final") return "final";
  if (LIVE_STATUS_RE.test(g.status)) return "live";
  // Anything else (date, "7:00 PM ET", scheduled) treat as upcoming
  return "upcoming";
}

function gamesToSeriesGames(games: NbaGame[]): SeriesGame[] {
  const sorted = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find clinching final (if any). Filter out scheduled games AFTER the clinch.
  const wins: Record<string, number> = {};
  let clinchDate: number | null = null;
  for (const g of sorted) {
    if (g.status === "Final") {
      const winner =
        g.home_team_score > g.visitor_team_score
          ? g.home_team.abbreviation
          : g.visitor_team.abbreviation;
      wins[winner] = (wins[winner] || 0) + 1;
      if (wins[winner] === 4 && clinchDate === null) {
        clinchDate = new Date(g.date).getTime();
      }
    }
  }

  const visible = clinchDate === null
    ? sorted
    : sorted.filter((g) => {
        if (g.status === "Final") return true;
        return new Date(g.date).getTime() <= clinchDate!;
      });

  // Re-walk to compute running record per visible game
  const runningWins: Record<string, number> = {};
  const result: SeriesGame[] = [];

  visible.forEach((g, idx) => {
    const homeTeam = nbaTeamToTeam(g.home_team);
    const awayTeam = nbaTeamToTeam(g.visitor_team);
    const status = classifyStatus(g);

    if (status === "final") {
      const winner =
        g.home_team_score > g.visitor_team_score
          ? g.home_team.abbreviation
          : g.visitor_team.abbreviation;
      runningWins[winner] = (runningWins[winner] || 0) + 1;
    }

    const dateObj = new Date(g.date);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const ot = g.period > 4 ? g.period - 4 : undefined;

    // startsAt: prefer the game's date timestamp (often ISO with tip-off time).
    const startsAt = isNaN(dateObj.getTime()) ? undefined : dateObj.getTime();

    result.push({
      gameNumber: idx + 1,
      date: dateStr,
      status,
      homeTeam,
      awayTeam,
      homeScore: g.home_team_score,
      awayScore: g.visitor_team_score,
      seriesRecord: [
        runningWins[awayTeam.abbreviation] || 0,
        runningWins[homeTeam.abbreviation] || 0,
      ],
      ot,
      startsAt,
    });
  });

  return result;
}

export function useSeriesGames(
  matchId: string | undefined,
  homeAbbr: string | undefined,
  awayAbbr: string | undefined,
  season: number = 2025
) {
  usePlayoffGamesRaw(season);

  return useQuery<NbaGame[], Error, SeriesGame[]>({
    queryKey: ["playoff-games-raw", season],
    enabled: false,
    initialData: [],
    select: (allGames) => {
      if (!matchId || !homeAbbr || !awayAbbr) return [];
      const teamSet = new Set([homeAbbr, awayAbbr]);
      const seriesGames = allGames.filter(
        (g) =>
          teamSet.has(g.home_team.abbreviation) &&
          teamSet.has(g.visitor_team.abbreviation)
      );
      if (seriesGames.length === 0) return [];
      return gamesToSeriesGames(seriesGames);
    },
  });
}
