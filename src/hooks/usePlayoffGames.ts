import { useQuery } from "@tanstack/react-query";
import { getPlayoffGames, teamMeta, type NbaGame } from "@/lib/nbaApi";
import { type Match, type Team, makeTips, fallbackMatches, getConference, teamSeeds } from "@/data/playoffsData";


function gameStatusToLocal(status: string): "upcoming" | "live" | "final" {
  if (status === "Final") return "final";
  // Live statuses: "Q1 5:30", "Half", etc. — but NOT ISO datetimes like "2026-04-18T22:00:00Z"
  if (status.startsWith("Q") || status.startsWith("Half")) return "live";
  // A short status with ":" that isn't an ISO datetime (e.g. "Q3 2:15" parsed differently)
  if (status.includes(":") && !status.includes("T") && status.length < 20) return "live";
  return "upcoming";
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

    matches.push({
      id: key.toLowerCase(),
      round: "First Round",
      conference: getConference(homeAbbr, awayAbbr),
      gameNumber,
      date: dateStr,
      time: latestGame.status === "Final" ? "Final" : latestGame.time || "TBD",
      homeTeam,
      awayTeam,
      homeWins: homeAbbr === teamA ? teamAWins : teamBWins,
      awayWins: awayAbbr === teamA ? teamAWins : teamBWins,
      status: gameStatusToLocal(latestGame.status),
      homeScore: latestGame.home_team_score,
      awayScore: latestGame.visitor_team_score,
      tips: makeTips(homeAbbr, awayAbbr),
    });
  }

  return matches;
}

export function usePlayoffGames(season: number = 2025) {
  return useQuery({
    queryKey: ["playoff-games", season],
    queryFn: async () => {
      try {
        const games = await getPlayoffGames(season);
        if (games.length === 0) return [...fallbackMatches, dummyFinalMatch];
        const apiMatches = groupIntoSeries(games);

        // Merge in TBD fallback matchups that aren't covered by API data
        // Collect all real team abbreviations from API data
        const apiTeams = new Set<string>();
        apiMatches.forEach((m) => {
          apiTeams.add(m.homeTeam.abbreviation);
          apiTeams.add(m.awayTeam.abbreviation);
        });
        // Filter out fallback matchups where ANY real (non-placeholder) team already appears in API data
        const tbdMatches = fallbackMatches.filter((fb) => {
          const homeInApi = apiTeams.has(fb.homeTeam.abbreviation);
          const awayInApi = apiTeams.has(fb.awayTeam.abbreviation);
          return !homeInApi && !awayInApi;
        });

        const allMatches = [...apiMatches, ...tbdMatches];
        // Add dummy CHA vs MIA final match
        if (!allMatches.some((m) => m.id === "cha-mia")) {
          allMatches.push(dummyFinalMatch);
        }
        return allMatches;
      } catch (error) {
        console.warn("Failed to fetch NBA data, using fallback:", error);
        return [...fallbackMatches, dummyFinalMatch];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });
}
