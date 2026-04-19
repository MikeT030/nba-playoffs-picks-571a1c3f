import { supabase } from "@/integrations/supabase/client";

export interface NbaTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

export interface NbaGame {
  id: number;
  date: string;
  /** ISO timestamp of tip-off (UTC), e.g. "2026-04-19T17:00:00.000Z". */
  datetime?: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: NbaTeam;
  visitor_team: NbaTeam;
}

export interface NbaApiResponse<T> {
  data: T[];
  meta: {
    next_cursor?: number;
    per_page: number;
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callNbaApi<T>(params: Record<string, string>): Promise<NbaApiResponse<T>> {
  const searchParams = new URLSearchParams(params);
  const url = `${SUPABASE_URL}/functions/v1/nba-api?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function getPlayoffGames(season: number = 2024): Promise<NbaGame[]> {
  const result = await callNbaApi<NbaGame>({
    endpoint: "games",
    postseason: "true",
    "seasons[]": String(season),
    per_page: "100",
  });
  return result.data;
}

export async function getTeams(): Promise<NbaTeam[]> {
  const result = await callNbaApi<NbaTeam>({
    endpoint: "teams",
  });
  return result.data;
}

// Official NBA logo URL pattern
const nbaLogoUrl = (abbr: string) =>
  `https://cdn.nba.com/logos/nba/${nbaTeamIds[abbr]}/primary/L/logo.svg`;

// NBA team IDs for logo URLs
const nbaTeamIds: Record<string, number> = {
  ATL: 1610612737, BOS: 1610612738, BKN: 1610612751, CHA: 1610612766,
  CHI: 1610612741, CLE: 1610612739, DAL: 1610612742, DEN: 1610612743,
  DET: 1610612765, GSW: 1610612744, HOU: 1610612745, IND: 1610612754,
  LAC: 1610612746, LAL: 1610612747, MEM: 1610612763, MIA: 1610612748,
  MIL: 1610612749, MIN: 1610612750, NOP: 1610612740, NYK: 1610612752,
  OKC: 1610612760, ORL: 1610612753, PHI: 1610612755, PHX: 1610612756,
  POR: 1610612757, SAC: 1610612758, SAS: 1610612759, TOR: 1610612761,
  UTA: 1610612762, WAS: 1610612764,
};

// Team colors and logo URLs
export const teamMeta: Record<string, { color: string; logo: string }> = {
  ATL: { color: "#E03A3E", logo: nbaLogoUrl("ATL") },
  BOS: { color: "#007A33", logo: nbaLogoUrl("BOS") },
  BKN: { color: "#000000", logo: nbaLogoUrl("BKN") },
  CHA: { color: "#1D1160", logo: nbaLogoUrl("CHA") },
  CHI: { color: "#CE1141", logo: nbaLogoUrl("CHI") },
  CLE: { color: "#860038", logo: nbaLogoUrl("CLE") },
  DAL: { color: "#00538C", logo: nbaLogoUrl("DAL") },
  DEN: { color: "#0E2240", logo: nbaLogoUrl("DEN") },
  DET: { color: "#06438F", logo: nbaLogoUrl("DET") },
  GSW: { color: "#1D428A", logo: nbaLogoUrl("GSW") },
  HOU: { color: "#CE1141", logo: nbaLogoUrl("HOU") },
  IND: { color: "#002D62", logo: nbaLogoUrl("IND") },
  LAC: { color: "#C8102E", logo: nbaLogoUrl("LAC") },
  LAL: { color: "#552583", logo: nbaLogoUrl("LAL") },
  MEM: { color: "#5D76A9", logo: nbaLogoUrl("MEM") },
  MIA: { color: "#98002E", logo: nbaLogoUrl("MIA") },
  MIL: { color: "#00471B", logo: nbaLogoUrl("MIL") },
  MIN: { color: "#0C2340", logo: nbaLogoUrl("MIN") },
  NOP: { color: "#0C2340", logo: nbaLogoUrl("NOP") },
  NYK: { color: "#006BB6", logo: nbaLogoUrl("NYK") },
  OKC: { color: "#007AC1", logo: nbaLogoUrl("OKC") },
  ORL: { color: "#0077C0", logo: nbaLogoUrl("ORL") },
  PHI: { color: "#006BB6", logo: nbaLogoUrl("PHI") },
  PHX: { color: "#1D1160", logo: nbaLogoUrl("PHX") },
  POR: { color: "#E03A3E", logo: nbaLogoUrl("POR") },
  SAC: { color: "#5A2D81", logo: nbaLogoUrl("SAC") },
  SAS: { color: "#C4CED4", logo: nbaLogoUrl("SAS") },
  TOR: { color: "#CE1141", logo: nbaLogoUrl("TOR") },
  UTA: { color: "#002B5C", logo: nbaLogoUrl("UTA") },
  WAS: { color: "#002B5C", logo: nbaLogoUrl("WAS") },
};
