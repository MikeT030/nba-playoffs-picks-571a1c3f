import { useMemo } from "react";
import { teamMeta, type NbaGame } from "@/lib/nbaApi";
import { type Match, type Team, makeTips, buildFallbackMatches, getConference, getTeamSeed, type BracketSeries } from "@/data/playoffsData";
import { isPlayoffsStarted } from "@/data/buttonMonologue";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";
import { useBracketData } from "./useBracketData";

const LIVE_STATUS_RE = /^(1st|2nd|3rd|4th)\s*Qtr$|^Halftime$/i;

function gameStatusToLocal(status: string): "upcoming" | "live" | "final" {
  if (status === "Final") return "final";
  if (LIVE_STATUS_RE.test(status)) return "live";
  return "upcoming";
}

function formatLiveIndicator(status: string, period: number, time: string | null): string {
  const trimmed = (time ?? "").trim();
  if (/^Halftime$/i.test(status)) return "Halftime";

  if (period >= 5) {
    const otNum = period - 4;
    const label = otNum === 1 ? "OT" : `OT${otNum}`;
    if (trimmed) {
      if (/^(OT|END|Q\d)/i.test(trimmed)) return trimmed;
      return `${label} ${trimmed}`;
    }
    return `End ${label}`;
  }

  if (period >= 1 && period <= 4) {
    const qLabel = `Q${period}`;
    if (trimmed) {
      if (/^(Q\d|OT|END)/i.test(trimmed)) return trimmed;
      return `${qLabel} ${trimmed}`;
    }
    return `End ${qLabel}`;
  }

  return status || "";
}

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

function groupIntoSeries(games: NbaGame[], bracket: BracketSeries[]): Match[] {
  const seriesMap = new Map<string, NbaGame[]>();

  for (const game of games) {
    const key = [game.home_team.abbreviation, game.visitor_team.abbreviation].sort().join("-");
    if (!seriesMap.has(key)) seriesMap.set(key, []);
    seriesMap.get(key)!.push(game);
  }

  const matches: Match[] = [];

  for (const [key, seriesGames] of seriesMap) {
    seriesGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const [teamA, teamB] = key.split("-");
    let teamAWins = 0;
    let teamBWins = 0;

    for (const g of seriesGames) {
      if (g.status === "Final") {
        const homeWon = g.home_team_score > g.visitor_team_score;
        const winner = homeWon ? g.home_team.abbreviation : g.visitor_team.abbreviation;
        if (winner === teamA) teamAWins++;
        else teamBWins++;
      }
    }

    const playedGames = seriesGames.filter((g) => gameStatusToLocal(g.status) !== "upcoming");
    const latestPlayedGame = playedGames.length > 0 ? playedGames[playedGames.length - 1] : seriesGames[0];
    const gameNumber = playedGames.length > 0 ? playedGames.length : 1;

    const firstGame = seriesGames[0];
    const homeAbbr = firstGame.home_team.abbreviation;
    const awayAbbr = firstGame.visitor_team.abbreviation;

    const homeTeam = nbaTeamToTeam(firstGame.home_team, bracket);
    const awayTeam = nbaTeamToTeam(firstGame.visitor_team, bracket);

    const upcomingGames = seriesGames.filter((g) => gameStatusToLocal(g.status) === "upcoming");
    const liveGame = seriesGames.find((g) => gameStatusToLocal(g.status) === "live");
    const nextUpcomingGame = upcomingGames[0];

    // The "display state" of the card is determined by what's happening RIGHT NOW
    // in the series, prioritizing live > upcoming > final. This way a series with
    // one finished game and one game tonight is shown as upcoming (in Today),
    // not as final (stuck in Next days).
    let localStatus: "upcoming" | "live" | "final";
    let anchorGame: NbaGame;
    if (liveGame) {
      localStatus = "live";
      anchorGame = liveGame;
    } else if (nextUpcomingGame) {
      localStatus = "upcoming";
      anchorGame = nextUpcomingGame;
    } else {
      localStatus = "final";
      anchorGame = latestPlayedGame;
    }

    const dateObj = new Date(anchorGame.date);
    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const extractStartsAt = (g: NbaGame): string | undefined => {
      if (g.datetime) {
        const t = new Date(g.datetime).getTime();
        if (!isNaN(t)) return new Date(t).toISOString();
      }
      if (/^\d{4}-\d{2}-\d{2}T/.test(g.status)) {
        const t = new Date(g.status).getTime();
        if (!isNaN(t)) return new Date(t).toISOString();
      }
      return undefined;
    };
    // Anchor sorting/bucketing on the active or next scheduled game, so a series
    // with a game tonight lands in "Today" even if an earlier game already finished.
    const startsAt = extractStartsAt(anchorGame);

    const formatUpcomingTime = (g: NbaGame): string => {
      let ts: number | undefined;
      if (g.datetime) {
        const t = new Date(g.datetime).getTime();
        if (!isNaN(t)) ts = t;
      }
      if (ts === undefined && /^\d{4}-\d{2}-\d{2}T/.test(g.status)) {
        const t = new Date(g.status).getTime();
        if (!isNaN(t)) ts = t;
      }
      if (ts === undefined) return g.time || "TBD";
      return new Date(ts).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const timeLabel =
      localStatus === "final"
        ? "Final"
        : localStatus === "live"
          ? formatLiveIndicator(liveGame!.status, liveGame!.period, liveGame!.time)
          : formatUpcomingTime(nextUpcomingGame);

    matches.push({
      id: key.toLowerCase(),
      round: "First Round",
      conference: getConference(homeAbbr, awayAbbr),
      gameNumber,
      date: dateStr,
      time: timeLabel,
      startsAt,
      homeTeam,
      awayTeam,
      homeWins: homeAbbr === teamA ? teamAWins : teamBWins,
      awayWins: awayAbbr === teamA ? teamAWins : teamBWins,
      status: localStatus,
      homeScore: latestPlayedGame.home_team_score,
      awayScore: latestPlayedGame.visitor_team_score,
      tips: makeTips(homeAbbr, awayAbbr),
    });
  }

  return matches;
}

function deriveMatches(games: NbaGame[] | undefined, bracket: BracketSeries[]): Match[] {
  // Once playoffs have started, never show pre-playoff fallback cards. If the
  // API hasn't returned yet (or just failed), return an empty list so the UI
  // can render a loading/empty state instead of stale placeholder matchups.
  if (isPlayoffsStarted()) {
    if (!games || games.length === 0) return [];
    return groupIntoSeries(games, bracket);
  }

  const fallbacks = buildFallbackMatches(bracket);
  if (!games || games.length === 0) return fallbacks;
  const apiMatches = groupIntoSeries(games, bracket);

  // Once the API returns any real playoff games, treat it as the source of truth.
  // Drop every fallback, including unresolved play-in placeholders, so stale
  // pre-playoff cards cannot appear alongside live standings.
  return apiMatches;
}

export function usePlayoffGames(season: number = 2025) {
  const rawQuery = usePlayoffGamesRaw(season);
  const { data: bracket = [] } = useBracketData(season);

  const data = useMemo(() => deriveMatches(rawQuery.data, bracket), [rawQuery.data, bracket]);

  return {
    ...rawQuery,
    data,
  };
}
