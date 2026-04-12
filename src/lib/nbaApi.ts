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

// Team colors and emojis for display
export const teamMeta: Record<string, { color: string; logo: string }> = {
  ATL: { color: "#E03A3E", logo: "🦅" },
  BOS: { color: "#007A33", logo: "🍀" },
  BKN: { color: "#000000", logo: "🏙️" },
  CHA: { color: "#1D1160", logo: "🐝" },
  CHI: { color: "#CE1141", logo: "🐂" },
  CLE: { color: "#860038", logo: "⚔️" },
  DAL: { color: "#00538C", logo: "🐴" },
  DEN: { color: "#0E2240", logo: "⛏️" },
  DET: { color: "#C8102E", logo: "🏭" },
  GSW: { color: "#1D428A", logo: "🌉" },
  HOU: { color: "#CE1141", logo: "🚀" },
  IND: { color: "#002D62", logo: "🏎️" },
  LAC: { color: "#C8102E", logo: "⛵" },
  LAL: { color: "#552583", logo: "👑" },
  MEM: { color: "#5D76A9", logo: "🐻" },
  MIA: { color: "#98002E", logo: "🔥" },
  MIL: { color: "#00471B", logo: "🦌" },
  MIN: { color: "#0C2340", logo: "🐺" },
  NOP: { color: "#0C2340", logo: "⚜️" },
  NYK: { color: "#006BB6", logo: "🗽" },
  OKC: { color: "#007AC1", logo: "⚡" },
  ORL: { color: "#0077C0", logo: "✨" },
  PHI: { color: "#006BB6", logo: "🔔" },
  PHX: { color: "#1D1160", logo: "☀️" },
  POR: { color: "#E03A3E", logo: "🌹" },
  SAC: { color: "#5A2D81", logo: "👑" },
  SAS: { color: "#C4CED4", logo: "🤠" },
  TOR: { color: "#CE1141", logo: "🦖" },
  UTA: { color: "#002B5C", logo: "🎵" },
  WAS: { color: "#002B5C", logo: "🧙" },
};
