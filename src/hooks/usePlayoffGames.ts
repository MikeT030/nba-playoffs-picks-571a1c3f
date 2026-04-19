import { useQuery } from "@tanstack/react-query";
import { teamMeta, type NbaGame } from "@/lib/nbaApi";
import { type Match, type Team, makeTips, fallbackMatches, getConference, getTeamSeed, type BracketSeries } from "@/data/playoffsData";
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
    const latestGame = playedGames.length > 0 ? playedGames[playedGames.length - 1] : seriesGames[0];
    const gameNumber = playedGames.length > 0 ? playedGames.length : 1;
    const dateObj = new Date(latestGame.date);
    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const firstGame = seriesGames[0];
    const homeAbbr = firstGame.home_team.abbreviation;
    const awayAbbr = firstGame.visitor_team.abbreviation;

    const homeTeam = nbaTeamToTeam(firstGame.home_team, bracket);
    const awayTeam = nbaTeamToTeam(firstGame.visitor_team, bracket);

    const localStatus = gameStatusToLocal(latestGame.status);

    // Pick the game whose tip-off should drive sorting:
    // - live: the live game itself
    // - upcoming: the next upcoming game (latestGame is the first upcoming)
    // - final (series ongoing): the next scheduled game after the latest final
    const upcomingGames = seriesGames.filter((g) => gameStatusToLocal(g.status) === "upcoming");
    const sortGame =
      localStatus === "live"
        ? latestGame
        : localStatus === "upcoming"
          ? latestGame
          : (upcomingGames[0] ?? latestGame);

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
    const startsAt = extractStartsAt(sortGame);

    // For upcoming games, the API's `time` field is null. Derive a local
    // tip-off label from `datetime` (or an ISO timestamp stored in `status`)
    // so cards display + sort by their actual scheduled time, not "TBD".
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
          ? formatLiveIndicator(latestGame.status, latestGame.period, latestGame.time)
          : formatUpcomingTime(latestGame);

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
      homeScore: latestGame.home_team_score,
      awayScore: latestGame.visitor_team_score,
      tips: makeTips(homeAbbr, awayAbbr),
    });
  }

  return matches;
}

function deriveMatches(games: NbaGame[] | undefined, bracket: BracketSeries[]): Match[] {
  if (!games || games.length === 0) return fallbackMatches;
  const apiMatches = groupIntoSeries(games, bracket);

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
}

export function usePlayoffGames(season: number = 2025) {
  usePlayoffGamesRaw(season);
  const { data: bracket = [] } = useBracketData(season);

  return useQuery<NbaGame[], Error, Match[]>({
    queryKey: ["playoff-games-raw", season],
    enabled: false,
    initialData: [],
    select: (games) => deriveMatches(games, bracket),
  });
}
