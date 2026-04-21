import { useMemo } from "react";
import { teamMeta, type NbaGame } from "@/lib/nbaApi";
import { type Team, getTeamSeed, type BracketSeries } from "@/data/playoffsData";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";
import { useBracketData } from "./useBracketData";

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
  startsAt?: number;
}

const LIVE_STATUS_RE = /^(1st|2nd|3rd|4th)\s*Qtr$|^Halftime$/i;

function nbaTeamToTeam(t: { full_name: string; abbreviation: string }, bracket: BracketSeries[]): Team {
  const meta = teamMeta[t.abbreviation] || { color: "#666", logo: "🏀" };
  return {
    name: t.full_name,
    abbreviation: t.abbreviation,
    color: meta.color,
    logo: meta.logo,
    seed: getTeamSeed(t.abbreviation, bracket),
  };
}

function classifyStatus(g: NbaGame): "final" | "live" | "upcoming" {
  if (g.status === "Final") return "final";
  if (LIVE_STATUS_RE.test(g.status)) return "live";
  return "upcoming";
}

function gamesToSeriesGames(games: NbaGame[], bracket: BracketSeries[]): SeriesGame[] {
  const sorted = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

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

  const runningWins: Record<string, number> = {};
  const result: SeriesGame[] = [];

  visible.forEach((g, idx) => {
    const homeTeam = nbaTeamToTeam(g.home_team, bracket);
    const awayTeam = nbaTeamToTeam(g.visitor_team, bracket);
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

    let startsAt: number | undefined;
    if (g.datetime) {
      const t = new Date(g.datetime).getTime();
      if (!isNaN(t)) startsAt = t;
    }
    if (startsAt === undefined && /^\d{4}-\d{2}-\d{2}T/.test(g.status)) {
      const t = new Date(g.status).getTime();
      if (!isNaN(t)) startsAt = t;
    }
    if (startsAt === undefined && !isNaN(dateObj.getTime())) {
      startsAt = dateObj.getTime();
    }

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
  const rawQuery = usePlayoffGamesRaw(season);
  const { data: bracket = [] } = useBracketData(season);

  const data = useMemo(() => {
    const allGames = rawQuery.data ?? [];
    if (!matchId || !homeAbbr || !awayAbbr) return [];
    const teamSet = new Set([homeAbbr, awayAbbr]);
    const seriesGames = allGames.filter(
      (g) =>
        teamSet.has(g.home_team.abbreviation) &&
        teamSet.has(g.visitor_team.abbreviation)
    );
    if (seriesGames.length === 0) return [];
    return gamesToSeriesGames(seriesGames, bracket);
  }, [rawQuery.data, matchId, homeAbbr, awayAbbr, bracket]);

  return {
    ...rawQuery,
    data,
  };
}
