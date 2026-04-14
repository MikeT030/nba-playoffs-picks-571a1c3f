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

// Local team logos
import logoATL from "@/assets/logos/ATL.svg";
import logoBOS from "@/assets/logos/BOS.svg";
import logoBKN from "@/assets/logos/BKN.svg";
import logoCHA from "@/assets/logos/CHA.svg";
import logoCHI from "@/assets/logos/CHI.svg";
import logoCLE from "@/assets/logos/CLE.svg";
import logoDAL from "@/assets/logos/DAL.svg";
import logoDEN from "@/assets/logos/DEN.svg";
import logoDET from "@/assets/logos/DET.svg";
import logoGSW from "@/assets/logos/GSW.svg";
import logoHOU from "@/assets/logos/HOU.svg";
import logoIND from "@/assets/logos/IND.svg";
import logoLAC from "@/assets/logos/LAC.svg";
import logoLAL from "@/assets/logos/LAL.svg";
import logoMEM from "@/assets/logos/MEM.svg";
import logoMIA from "@/assets/logos/MIA.svg";
import logoMIL from "@/assets/logos/MIL.svg";
import logoMIN from "@/assets/logos/MIN.svg";
import logoNOP from "@/assets/logos/NOP.svg";
import logoNYK from "@/assets/logos/NYK.svg";
import logoOKC from "@/assets/logos/OKC.svg";
import logoORL from "@/assets/logos/ORL.svg";
import logoPHI from "@/assets/logos/PHI.svg";
import logoPHX from "@/assets/logos/PHX.svg";
import logoPOR from "@/assets/logos/POR.svg";
import logoSAC from "@/assets/logos/SAC.svg";
import logoSAS from "@/assets/logos/SAS.svg";
import logoTOR from "@/assets/logos/TOR.svg";
import logoUTA from "@/assets/logos/UTA.svg";
import logoWAS from "@/assets/logos/WAS.svg";

const localLogos: Record<string, string> = {
  ATL: logoATL, BOS: logoBOS, BKN: logoBKN, CHA: logoCHA,
  CHI: logoCHI, CLE: logoCLE, DAL: logoDAL, DEN: logoDEN,
  DET: logoDET, GSW: logoGSW, HOU: logoHOU, IND: logoIND,
  LAC: logoLAC, LAL: logoLAL, MEM: logoMEM, MIA: logoMIA,
  MIL: logoMIL, MIN: logoMIN, NOP: logoNOP, NYK: logoNYK,
  OKC: logoOKC, ORL: logoORL, PHI: logoPHI, PHX: logoPHX,
  POR: logoPOR, SAC: logoSAC, SAS: logoSAS, TOR: logoTOR,
  UTA: logoUTA, WAS: logoWAS,
};

// Team colors and logo URLs
export const teamMeta: Record<string, { color: string; logo: string }> = {
  ATL: { color: "#E03A3E", logo: localLogos.ATL },
  BOS: { color: "#007A33", logo: localLogos.BOS },
  BKN: { color: "#000000", logo: localLogos.BKN },
  CHA: { color: "#1D1160", logo: localLogos.CHA },
  CHI: { color: "#CE1141", logo: localLogos.CHI },
  CLE: { color: "#860038", logo: localLogos.CLE },
  DAL: { color: "#00538C", logo: localLogos.DAL },
  DEN: { color: "#0E2240", logo: localLogos.DEN },
  DET: { color: "#06438F", logo: localLogos.DET },
  GSW: { color: "#1D428A", logo: localLogos.GSW },
  HOU: { color: "#CE1141", logo: localLogos.HOU },
  IND: { color: "#002D62", logo: localLogos.IND },
  LAC: { color: "#C8102E", logo: localLogos.LAC },
  LAL: { color: "#552583", logo: localLogos.LAL },
  MEM: { color: "#5D76A9", logo: localLogos.MEM },
  MIA: { color: "#98002E", logo: localLogos.MIA },
  MIL: { color: "#00471B", logo: localLogos.MIL },
  MIN: { color: "#0C2340", logo: localLogos.MIN },
  NOP: { color: "#0C2340", logo: localLogos.NOP },
  NYK: { color: "#006BB6", logo: localLogos.NYK },
  OKC: { color: "#007AC1", logo: localLogos.OKC },
  ORL: { color: "#0077C0", logo: localLogos.ORL },
  PHI: { color: "#006BB6", logo: localLogos.PHI },
  PHX: { color: "#1D1160", logo: localLogos.PHX },
  POR: { color: "#E03A3E", logo: localLogos.POR },
  SAC: { color: "#5A2D81", logo: localLogos.SAC },
  SAS: { color: "#C4CED4", logo: localLogos.SAS },
  TOR: { color: "#CE1141", logo: localLogos.TOR },
  UTA: { color: "#002B5C", logo: localLogos.UTA },
  WAS: { color: "#002B5C", logo: localLogos.WAS },
};
