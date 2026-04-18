import { useMemo } from "react";
import { teamMeta, type NbaGame } from "@/lib/nbaApi";
import { type Match, type Team, makeTips, fallbackMatches, getConference, teamSeeds } from "@/data/playoffsData";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";


// BallDontLie status values for live games:
//   "1st Qtr", "2nd Qtr", "Halftime", "3rd Qtr", "4th Qtr", "Final", or a start-time like "7:00 pm ET"
// `time` is "" / " " when the period is between plays (end of quarter), and "M:SS" during play.
// `period` is 0 (not started), 1-4 (regulation), 5+ (overtime).
const LIVE_STATUS_RE = /^(1st|2nd|3rd|4th)\s*Qtr$|^Halftime$/i;

function gameStatusToLocal(status: string): "upcoming" | "live" | "final" {
  if (status === "Final") return "final";
  if (LIVE_STATUS_RE.test(status)) return "live";
  return "upcoming";
}

/**
 * Map BallDontLie period/status/time to a compact live indicator string.
 * Examples: "Q1 5:30", "End Q1", "Halftime", "End Q3", "End Q4", "OT 2:14", "OT2 1:05", "End OT"
 */
function formatLiveIndicator(status: string, period: number, time: string | null): string {
  const trimmed = (time ?? "").trim();
  // Halftime
  if (/^Halftime$/i.test(status)) return "Halftime";

  // Overtime (period >= 5)
  if (period >= 5) {
    const otNum = period - 4;
    const label = otNum === 1 ? "OT" : `OT${otNum}`;
    if (trimmed) return /^OT/i.test(trimmed) ? trimmed : `${label} ${trimmed}`;
    return `End ${label}`;
  }

  // Regulation quarters 1-4
  if (period >= 1 && period <= 4) {
    const qLabel = `Q${period}`;
    // The API's `time` field is already prefixed (e.g. "Q1 4:28"); use as-is when present.
    if (trimmed) return /^(Q\d|OT)/i.test(trimmed) ? trimmed : `${qLabel} ${trimmed}`;
    return `End ${qLabel}`;
  }

  // Fallback: pass through whatever the API gave us
  return status || "";
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

// Group games into series (by team matchup) and compute series records
function groupIntoSeries(games: NbaGame[]): Match[] {
  const seriesMap = new Map<string, NbaGame[]>();

  for (const game of games) {
    const key = [game.home_team.abbreviation, game.visitor_team.abbreviation].sort().join("-");
    if (!seriesMap.has(key)) seriesMap.set(key, []);
    seriesMap.get(key)!.push(game);
  }

  const matches: Match[] = [];

  for (const [key, seriesGames] of seriesMap) {
    // Sort by date
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

    // Use the latest played game for display, fall back to first upcoming
    const playedGames = seriesGames.filter((g) => gameStatusToLocal(g.status) !== "upcoming");
    const latestGame = playedGames.length > 0 ? playedGames[playedGames.length - 1] : seriesGames[0];
    const gameNumber = playedGames.length > 0 ? playedGames.length : 1;
    const dateObj = new Date(latestGame.date);
    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Determine home team (team with home court - first game's home team)
    const firstGame = seriesGames[0];
    const homeAbbr = firstGame.home_team.abbreviation;
    const awayAbbr = firstGame.visitor_team.abbreviation;

    const homeTeam = nbaTeamToTeam(firstGame.home_team);
    const awayTeam = nbaTeamToTeam(firstGame.visitor_team);

    const localStatus = gameStatusToLocal(latestGame.status);
    const timeLabel =
      localStatus === "final"
        ? "Final"
        : localStatus === "live"
          ? formatLiveIndicator(latestGame.status, latestGame.period, latestGame.time)
          : latestGame.time || "TBD";

    matches.push({
      id: key.toLowerCase(),
      round: "First Round",
      conference: getConference(homeAbbr, awayAbbr),
      gameNumber,
      date: dateStr,
      time: timeLabel,
      homeTeam,
      awayTeam,
      homeWins: homeAbbr === teamA ? teamAWins : teamBWins,
      awayWins: awayAbbr === teamA ? teamAWins : teamBWins,
      status: localStatus,
      homeScore: latestGame.home_team_score,
      awayScore: latestGame.visitor_team_score,
      tips: makeTips(homeAbbr, awayAbbr),
    });
  }

  return matches;
}

export function usePlayoffGames(season: number = 2025) {
  const rawQuery = usePlayoffGamesRaw(season);
  const games = rawQuery.data;

  const matches = useMemo<Match[] | undefined>(() => {
    if (!games) return undefined;
    if (games.length === 0) return fallbackMatches;

    const apiMatches = groupIntoSeries(games);

    // Merge in TBD fallback matchups that aren't covered by API data
    const apiTeams = new Set<string>();
    apiMatches.forEach((m) => {
      apiTeams.add(m.homeTeam.abbreviation);
      apiTeams.add(m.awayTeam.abbreviation);
    });
    const tbdMatches = fallbackMatches.filter((fb) => {
      const homeInApi = apiTeams.has(fb.homeTeam.abbreviation);
      const awayInApi = apiTeams.has(fb.awayTeam.abbreviation);
      return !homeInApi && !awayInApi;
    });

    return [...apiMatches, ...tbdMatches];
  }, [games]);

  // Auto-refresh every 30s while at least one game is live; otherwise no polling.
  // Handled at the raw query level via refetchInterval would re-fetch the API,
  // so we keep polling cadence on the raw layer instead. We just expose derived data here.
  return {
    ...rawQuery,
    data: matches,
  };
}
