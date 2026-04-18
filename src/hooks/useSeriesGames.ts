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
}

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

function gamesToSeriesGames(games: NbaGame[]): SeriesGame[] {
  const sorted = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const wins: Record<string, number> = {};
  const result: SeriesGame[] = [];

  const playedOrLive = sorted.filter((g) => {
    if (g.status === "Final") return true;
    if (g.status.includes(":") || g.status.startsWith("Q") || g.status.startsWith("Half")) return true;
    return false;
  });

  playedOrLive.forEach((g, idx) => {
    const homeTeam = nbaTeamToTeam(g.home_team);
    const awayTeam = nbaTeamToTeam(g.visitor_team);
    const isFinal = g.status === "Final";
    const isLive =
      g.status.startsWith("Q") ||
      g.status.startsWith("Half") ||
      (g.status.includes(":") && !g.status.includes("T") && g.status.length < 20);

    if (isFinal) {
      const winner =
        g.home_team_score > g.visitor_team_score
          ? g.home_team.abbreviation
          : g.visitor_team.abbreviation;
      wins[winner] = (wins[winner] || 0) + 1;
    }

    const dateObj = new Date(g.date);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const ot = g.period > 4 ? g.period - 4 : undefined;

    result.push({
      gameNumber: idx + 1,
      date: dateStr,
      status: isFinal ? "final" : isLive ? "live" : "upcoming",
      homeTeam,
      awayTeam,
      homeScore: g.home_team_score,
      awayScore: g.visitor_team_score,
      seriesRecord: [
        wins[awayTeam.abbreviation] || 0,
        wins[homeTeam.abbreviation] || 0,
      ],
      ot,
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
