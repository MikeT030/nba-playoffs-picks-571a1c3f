import { teamMeta } from "@/lib/nbaApi";

export interface Team {
  name: string;
  abbreviation: string;
  color: string;
  logo: string;
  seed?: number;
}

export interface Tip {
  user: string;
  avatar: string;
  pick: string;
  gamesInSeries: number;
}

export interface BracketSeries {
  id: string;
  round: string;
  conference: "East" | "West" | "Finals";
  // For first round: fixed teams. For later rounds: references to parent series
  topTeam?: Team;
  bottomTeam?: Team;
  topParentSeriesId?: string; // winner of this series fills the top slot
  bottomParentSeriesId?: string; // winner of this series fills the bottom slot
}

export interface Match {
  id: string;
  round: string;
  conference: "East" | "West" | "Finals";
  gameNumber: number;
  date: string;
  time: string;
  /** ISO timestamp of the next/active game's tip-off, when known. */
  startsAt?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeWins: number;
  awayWins: number;
  status: "upcoming" | "live" | "final";
  homeScore?: number;
  awayScore?: number;
  tips: Tip[];
}

const buddies = ["Erik", "Alexander", "David", "Fabian", "Hannes", "Jörn", "Larsn", "Michi", "Momentum", "Simon", "Sven"];
const avatars = ["🎣", "😎", "🎬", "🏔️", "🌄", "🎿", "🐕", "🎸", "🚀", "📡", "🐶"];

export function makeTips(team1: string, team2: string): Tip[] {
  return buddies.map((name, i) => {
    const seed = (name.charCodeAt(0) + team1.charCodeAt(0) + team2.charCodeAt(0)) % 2;
    const pick = (i + seed) % 2 === 0 ? team1 : team2;
    return {
      user: name,
      avatar: avatars[i],
      pick,
      gamesInSeries: 4 + ((i + seed) % 3),
    };
  });
}

function makeTeam(abbr: string, fullName: string, seed?: number): Team {
  const meta = teamMeta[abbr] || { color: "#666", logo: "" };
  return { name: fullName, abbreviation: abbr, color: meta.color, logo: meta.logo, seed };
}

// Maps a Round 1 series ID suffix to the [topSeed, bottomSeed] it represents.
// e.g. "west-r1-1v8" → top=1, bottom=8.
const ROUND1_SEED_PAIRS: Record<string, [number, number]> = {
  "1v8": [1, 8],
  "4v5": [4, 5],
  "3v6": [3, 6],
  "2v7": [2, 7],
};

/**
 * Derive a team's seed dynamically from the Round 1 bracket pairings.
 * Works for both static seeds (1–6) and Play-In-resolved seeds (7/8) once
 * `resolveBracketWithApiGames` has filled in the real opponents.
 *
 * Pass the resolved bracket (from `useBracketData`) for live 7/8 seeds;
 * falls back to the static `bracketSeries` otherwise.
 */
export function getTeamSeed(
  abbreviation: string | undefined,
  seriesList: BracketSeries[] = bracketSeries
): number | undefined {
  if (!abbreviation) return undefined;
  for (const s of seriesList) {
    if (s.round !== "First Round") continue;
    const suffix = s.id.split("-r1-")[1];
    const pair = suffix ? ROUND1_SEED_PAIRS[suffix] : undefined;
    if (!pair) continue;
    if (s.topTeam?.abbreviation === abbreviation) return pair[0];
    if (s.bottomTeam?.abbreviation === abbreviation) return pair[1];
  }
  return undefined;
}

const eastTeams = new Set(["BOS", "NYK", "DET", "CLE", "ATL", "TOR", "ORL", "MIA", "MIL", "IND", "CHI", "BKN", "CHA", "WAS", "PHI"]);

export function getConference(team1: string, team2: string): "East" | "West" | "Finals" {
  const t1East = eastTeams.has(team1);
  const t2East = eastTeams.has(team2);
  if (t1East && t2East) return "East";
  if (!t1East && !t2East) return "West";
  return "Finals";
}

/**
 * Resolve which bracket-slot ID corresponds to a live Match (e.g. map a
 * "MIN vs SAS" Conf-Semi card back to `west-semi-bottom`), in a strictly
 * round- and conference-scoped way so picks from one round can never bleed
 * into a card from another round even when the same two teams reappear.
 *
 * Resolution order:
 *  0. If `match.id` already equals a known bracket series id, use it.
 *  1. Direct match on already-resolved `topTeam`/`bottomTeam`, restricted to
 *     bracket slots whose round AND conference equal the visible match.
 *  2. Parent-walking via confirmed `seriesResults`: for any same-round /
 *     same-conference series with parent ids, derive its expected pair from
 *     each parent's confirmed winner and check if it equals the match's pair.
 *
 * Falling back to `match.id` (instead of any partial-team match) keeps picks
 * from unrelated series from leaking into the current matchup.
 */
export function getBracketSeriesIdForMatch(
  match: Match,
  seriesList: BracketSeries[] | undefined,
  seriesResults?: { series_id: string; winner: string }[],
): string {
  if (!seriesList) return match.id;

  // Pass 0: card id is already a bracket id.
  if (seriesList.some((s) => s.id === match.id)) return match.id;

  const home = match.homeTeam.abbreviation;
  const away = match.awayTeam.abbreviation;
  const matchPair = [home, away].sort().join("|");

  // Only consider bracket slots that match the visible card's round AND
  // conference. This is the key guard against e.g. a First Round DEN-vs-MIN
  // card resolving to `west-semi-bottom` once those teams also appear in the
  // semis bracket through parent winners.
  const sameContext = seriesList.filter(
    (s) => s.round === match.round && s.conference === match.conference,
  );

  // Pass 1: direct team-pair match within the same round/conference.
  const direct = sameContext.find(
    (s) =>
      (s.topTeam?.abbreviation === home && s.bottomTeam?.abbreviation === away) ||
      (s.topTeam?.abbreviation === away && s.bottomTeam?.abbreviation === home),
  );
  if (direct) return direct.id;

  // Pass 2: parent-walking via confirmed series results, scoped to the same
  // round/conference. This lets a Conf-Semi card resolve to its bracket slot
  // even before `useBracketData` has propagated winners forward.
  if (seriesResults && seriesResults.length > 0) {
    const winnerOf = (seriesId: string | undefined): string | undefined => {
      if (!seriesId) return undefined;
      return seriesResults.find((r) => r.series_id === seriesId)?.winner;
    };

    const parentMatch = sameContext.find((s) => {
      if (!s.topParentSeriesId || !s.bottomParentSeriesId) return false;
      const top = winnerOf(s.topParentSeriesId);
      const bot = winnerOf(s.bottomParentSeriesId);
      if (!top || !bot) return false;
      return [top, bot].sort().join("|") === matchPair;
    });
    if (parentMatch) return parentMatch.id;
  }

  return match.id;
}

/**
 * Given a bracket series id and the user's picked winner abbreviation,
 * return the abbreviation of the opponent the user *assumed* would face that
 * winner — even if reality played out differently.
 *
 * For First Round slots: the opponent is the other fixed team in the slot.
 * For later rounds: the opponent is derived from the user's pick for the
 * other parent series. Returns null if the opponent cannot be determined
 * (missing parent pick or inconsistent data).
 */
export function getAssumedOpponentAbbr(
  bracketSeriesId: string | null | undefined,
  winnerAbbr: string,
  seriesList: BracketSeries[] | undefined,
  allPicks: { series_id: string; winner: string }[] | undefined,
): string | null {
  if (!bracketSeriesId || !seriesList) return null;
  const series = seriesList.find((s) => s.id === bracketSeriesId);
  if (!series) return null;

  // First Round: opponent is the other fixed team in the slot.
  // (For later rounds, slot teams may be the *actual* advancing teams once
  // the bracket is resolved with API data — which is not what we want here.)
  if (series.round === "First Round") {
    const top = series.topTeam?.abbreviation;
    const bot = series.bottomTeam?.abbreviation;
    if (top && bot && (top === winnerAbbr || bot === winnerAbbr)) {
      return top === winnerAbbr ? bot : top;
    }
  }

  // Later rounds: walk parents via user's own picks
  if (series.topParentSeriesId && series.bottomParentSeriesId && allPicks) {
    const topPick = allPicks.find((p) => p.series_id === series.topParentSeriesId)?.winner;
    const botPick = allPicks.find((p) => p.series_id === series.bottomParentSeriesId)?.winner;
    if (!topPick || !botPick) return null;
    if (topPick === winnerAbbr) return botPick;
    if (botPick === winnerAbbr) return topPick;
  }

  return null;
}

// Dummy play-in placeholder teams with unique abbreviations so picks can be made
const playInPlaceholders: Record<string, Team> = {
  "PIW7": { name: "West Play-In 7th", abbreviation: "PIW7", color: "#888", logo: "🏀", seed: 7 },
  "PIW8": { name: "West Play-In 8th", abbreviation: "PIW8", color: "#888", logo: "🏀", seed: 8 },
  "PIE7": { name: "East Play-In 7th", abbreviation: "PIE7", color: "#888", logo: "🏀", seed: 7 },
  "PIE8": { name: "East Play-In 8th", abbreviation: "PIE8", color: "#888", logo: "🏀", seed: 8 },
};

export function isPlayInPlaceholder(abbr: string): boolean {
  return abbr in playInPlaceholders;
}

// Full bracket following 2025 NBA bracket structure:
// R1: 1v8, 4v5, 3v6, 2v7
// Semis: W(1v8) vs W(4v5), W(3v6) vs W(2v7)
// Conf Finals: W(top semis) vs W(bottom semis)
// Finals: W(West) vs W(East)

export const bracketSeries: BracketSeries[] = [
  // ===== WEST FIRST ROUND =====
  { id: "west-r1-1v8", round: "First Round", conference: "West",
    topTeam: makeTeam("OKC", "Oklahoma City Thunder", 1), bottomTeam: playInPlaceholders["PIW8"] },
  { id: "west-r1-4v5", round: "First Round", conference: "West",
    topTeam: makeTeam("LAL", "Los Angeles Lakers", 4), bottomTeam: makeTeam("HOU", "Houston Rockets", 5) },
  { id: "west-r1-3v6", round: "First Round", conference: "West",
    topTeam: makeTeam("DEN", "Denver Nuggets", 3), bottomTeam: makeTeam("MIN", "Minnesota Timberwolves", 6) },
  { id: "west-r1-2v7", round: "First Round", conference: "West",
    topTeam: makeTeam("SAS", "San Antonio Spurs", 2), bottomTeam: playInPlaceholders["PIW7"] },

  // ===== EAST FIRST ROUND =====
  { id: "east-r1-1v8", round: "First Round", conference: "East",
    topTeam: makeTeam("DET", "Detroit Pistons", 1), bottomTeam: playInPlaceholders["PIE8"] },
  { id: "east-r1-4v5", round: "First Round", conference: "East",
    topTeam: makeTeam("CLE", "Cleveland Cavaliers", 4), bottomTeam: makeTeam("TOR", "Toronto Raptors", 5) },
  { id: "east-r1-3v6", round: "First Round", conference: "East",
    topTeam: makeTeam("NYK", "New York Knicks", 3), bottomTeam: makeTeam("ATL", "Atlanta Hawks", 6) },
  { id: "east-r1-2v7", round: "First Round", conference: "East",
    topTeam: makeTeam("BOS", "Boston Celtics", 2), bottomTeam: playInPlaceholders["PIE7"] },

  // ===== WEST CONFERENCE SEMIFINALS =====
  { id: "west-semi-top", round: "Conference Semifinals", conference: "West",
    topParentSeriesId: "west-r1-1v8", bottomParentSeriesId: "west-r1-4v5" },
  { id: "west-semi-bottom", round: "Conference Semifinals", conference: "West",
    topParentSeriesId: "west-r1-3v6", bottomParentSeriesId: "west-r1-2v7" },

  // ===== EAST CONFERENCE SEMIFINALS =====
  { id: "east-semi-top", round: "Conference Semifinals", conference: "East",
    topParentSeriesId: "east-r1-1v8", bottomParentSeriesId: "east-r1-4v5" },
  { id: "east-semi-bottom", round: "Conference Semifinals", conference: "East",
    topParentSeriesId: "east-r1-3v6", bottomParentSeriesId: "east-r1-2v7" },

  // ===== CONFERENCE FINALS =====
  { id: "west-conf-finals", round: "Conference Finals", conference: "West",
    topParentSeriesId: "west-semi-top", bottomParentSeriesId: "west-semi-bottom" },
  { id: "east-conf-finals", round: "Conference Finals", conference: "East",
    topParentSeriesId: "east-semi-top", bottomParentSeriesId: "east-semi-bottom" },

  // ===== NBA FINALS =====
  { id: "nba-finals", round: "Finals", conference: "Finals",
    topParentSeriesId: "west-conf-finals", bottomParentSeriesId: "east-conf-finals" },
];

export interface ResolveCtx {
  /** Map of bracket series id → real-life winning team abbreviation. */
  actualWinners?: Record<string, string>;
  /** Set of "ABBR1|ABBR2" (sorted) keys for matchups currently in progress
   *  (started but not yet decided). Used to freeze user-pick propagation
   *  one round ahead so e.g. PHI doesn't auto-fill the Finals while losing
   *  its first-round series. */
  inProgressPairs?: Set<string>;
}

function pairKey(a?: string, b?: string): string | null {
  if (!a || !b) return null;
  return [a, b].sort().join("|");
}

/**
 * Single forward pass through the bracket, computing for every series:
 *   - `slotTeams[id]` : the (top, bottom) Team objects that fill the card.
 *   - `winnerTeam[id]`: the team that *effectively* advances out of this
 *     series — real winner if known, else the user's pick, else undefined.
 *
 * Rules applied uniformly at every round:
 *   1. Static slot team (R1) wins over parent lookup unless it's a play-in
 *      placeholder.
 *   2. Otherwise the slot is filled by the parent's `winnerTeam`.
 *   3. `actualWinners[id]` always wins.
 *   4. If the resolved (top, bottom) pair is in `inProgressPairs`, freeze:
 *      `winnerTeam[id] = undefined`. This cascades naturally to every
 *      downstream round (their slot can't fill, so they're TBD too).
 *   5. Otherwise, if `picks[id]` matches one of the slot teams, use it.
 *   6. Else undefined (TBD).
 */
export function computeBracketState(
  picks: Record<string, string>,
  seriesList: BracketSeries[] = bracketSeries,
  ctx: ResolveCtx = {},
): {
  slotTeams: Map<string, { top?: Team; bottom?: Team }>;
  winnerTeam: Map<string, Team | undefined>;
} {
  const slotTeams = new Map<string, { top?: Team; bottom?: Team }>();
  const winnerTeam = new Map<string, Team | undefined>();
  const needsFill = (t?: Team) => !t || isPlayInPlaceholder(t.abbreviation);

  // `bracketSeries` is declared in topological order (R1 → Semis → CF → Finals),
  // and `seriesList` is derived from it (resolveBracketWithApiGames preserves
  // order). Iterating once is enough.
  for (const s of seriesList) {
    let top = s.topTeam;
    let bottom = s.bottomTeam;

    if (needsFill(top) && s.topParentSeriesId) {
      const parentWinner = winnerTeam.get(s.topParentSeriesId);
      if (parentWinner) top = parentWinner;
      else if (needsFill(top)) top = undefined;
    }
    if (needsFill(bottom) && s.bottomParentSeriesId) {
      const parentWinner = winnerTeam.get(s.bottomParentSeriesId);
      if (parentWinner) bottom = parentWinner;
      else if (needsFill(bottom)) bottom = undefined;
    }

    slotTeams.set(s.id, { top, bottom });

    // Effective winner.
    const realWinner = ctx.actualWinners?.[s.id];
    if (realWinner) {
      const wt =
        top?.abbreviation === realWinner ? top
        : bottom?.abbreviation === realWinner ? bottom
        : undefined;
      winnerTeam.set(s.id, wt);
      continue;
    }

    if (top && bottom && ctx.inProgressPairs) {
      const k = pairKey(top.abbreviation, bottom.abbreviation);
      if (k && ctx.inProgressPairs.has(k)) {
        // Frozen — series in progress, don't predict over it.
        winnerTeam.set(s.id, undefined);
        continue;
      }
    }

    const pick = picks[s.id];
    if (pick && top && bottom) {
      if (pick === top.abbreviation) winnerTeam.set(s.id, top);
      else if (pick === bottom.abbreviation) winnerTeam.set(s.id, bottom);
      else winnerTeam.set(s.id, undefined);
    } else {
      winnerTeam.set(s.id, undefined);
    }
  }

  return { slotTeams, winnerTeam };
}

/**
 * Resolve the (topTeam, bottomTeam) slot teams for a series.
 * Backward-compatible wrapper around `computeBracketState` so existing call
 * sites don't have to change.
 */
export function resolveSeriesTeams(
  seriesId: string,
  picks: Record<string, string>,
  seriesList: BracketSeries[] = bracketSeries,
  ctx: ResolveCtx = {},
): { topTeam?: Team; bottomTeam?: Team } {
  const { slotTeams } = computeBracketState(picks, seriesList, ctx);
  const t = slotTeams.get(seriesId);
  return { topTeam: t?.top, bottomTeam: t?.bottom };
}

/**
 * Given real playoff games from the API, detect which teams fill the TBD (7/8 seed)
 * slots by looking at who the known 1-seed and 2-seed teams are playing against.
 */
type ApiGameLike = {
  home_team: { abbreviation: string; full_name: string };
  visitor_team: { abbreviation: string; full_name: string };
  home_team_score?: number;
  visitor_team_score?: number;
  status?: string;
};

/**
 * Resolve only the Round 1 play-in TBD slots from live API data, WITHOUT
 * propagating real-life series winners forward into later-round slots.
 *
 * Used by views (e.g. /my-picks) that need the bracket structure to reflect
 * the user's predicted path through rounds 2+, while still showing the
 * correct real-life 7/8 seeds in Round 1.
 */
export function resolvePlayInSlotsOnly(games: ApiGameLike[]): BracketSeries[] {
  if (!games.length) return bracketSeries;

  const knownSeeds: Record<string, { seriesId: string }> = {
    OKC: { seriesId: "west-r1-1v8" },
    SAS: { seriesId: "west-r1-2v7" },
    DET: { seriesId: "east-r1-1v8" },
    BOS: { seriesId: "east-r1-2v7" },
  };

  const resolved: Record<string, Team> = {};
  for (const game of games) {
    for (const knownAbbr of Object.keys(knownSeeds)) {
      const info = knownSeeds[knownAbbr];
      let opponentAbbr: string | null = null;
      let opponentName: string | null = null;
      if (game.home_team.abbreviation === knownAbbr) {
        opponentAbbr = game.visitor_team.abbreviation;
        opponentName = game.visitor_team.full_name;
      } else if (game.visitor_team.abbreviation === knownAbbr) {
        opponentAbbr = game.home_team.abbreviation;
        opponentName = game.home_team.full_name;
      }
      if (opponentAbbr && opponentName && !resolved[info.seriesId]) {
        const seed = info.seriesId.includes("1v8") ? 8 : 7;
        resolved[info.seriesId] = makeTeam(opponentAbbr, opponentName, seed);
      }
    }
  }

  return bracketSeries.map((s) => {
    if (resolved[s.id]) return { ...s, bottomTeam: resolved[s.id] };
    return s;
  });
}

export function resolveBracketWithApiGames(games: ApiGameLike[]): BracketSeries[] {
  if (!games.length) return bracketSeries;

  // Known seeds whose opponents reveal the play-in winners
  const knownSeeds: Record<string, { seriesId: string; slot: "bottom" }> = {
    OKC: { seriesId: "west-r1-1v8", slot: "bottom" },  // 1-seed West → opponent is 8-seed
    SAS: { seriesId: "west-r1-2v7", slot: "bottom" },  // 2-seed West → opponent is 7-seed
    DET: { seriesId: "east-r1-1v8", slot: "bottom" },  // 1-seed East → opponent is 8-seed
    BOS: { seriesId: "east-r1-2v7", slot: "bottom" },  // 2-seed East → opponent is 7-seed
  };

  const resolved: Record<string, Team> = {};

  for (const game of games) {
    for (const knownAbbr of Object.keys(knownSeeds)) {
      const info = knownSeeds[knownAbbr];
      let opponentAbbr: string | null = null;
      let opponentName: string | null = null;

      if (game.home_team.abbreviation === knownAbbr) {
        opponentAbbr = game.visitor_team.abbreviation;
        opponentName = game.visitor_team.full_name;
      } else if (game.visitor_team.abbreviation === knownAbbr) {
        opponentAbbr = game.home_team.abbreviation;
        opponentName = game.home_team.full_name;
      }

      if (opponentAbbr && opponentName && !resolved[info.seriesId]) {
        const seed = info.seriesId.includes("1v8") ? 8 : 7;
        resolved[info.seriesId] = makeTeam(opponentAbbr, opponentName, seed);
      }
    }
  }

  // Tally finals wins per team-pair to derive series winners, so we can
  // propagate winners forward into later-round bracket slots (semis, conf
  // finals, finals) — without this, a Conf-Semi card like MIN vs SAS would
  // still show the original DEN/SAS slots and pick lookups by team would
  // misroute to a Round 1 series.
  const winsByPair = new Map<string, Map<string, number>>();
  const namesByAbbr = new Map<string, string>();
  for (const g of games) {
    namesByAbbr.set(g.home_team.abbreviation, g.home_team.full_name);
    namesByAbbr.set(g.visitor_team.abbreviation, g.visitor_team.full_name);
    if (g.status !== "Final") continue;
    const a = g.home_team.abbreviation;
    const b = g.visitor_team.abbreviation;
    const key = [a, b].sort().join("-");
    const winnerAbbr =
      (g.home_team_score ?? 0) > (g.visitor_team_score ?? 0) ? a : b;
    const m = winsByPair.get(key) ?? new Map<string, number>();
    m.set(winnerAbbr, (m.get(winnerAbbr) ?? 0) + 1);
    winsByPair.set(key, m);
  }
  const winnerOfPair = (abbrA: string, abbrB: string): string | undefined => {
    const m = winsByPair.get([abbrA, abbrB].sort().join("-"));
    if (!m) return undefined;
    if ((m.get(abbrA) ?? 0) >= 4) return abbrA;
    if ((m.get(abbrB) ?? 0) >= 4) return abbrB;
    return undefined;
  };

  // Build a working map of resolved (top, bottom) per series, seeded with the
  // static bracket and the play-in resolution above.
  const slots = new Map<string, { top?: Team; bottom?: Team }>();
  for (const s of bracketSeries) {
    slots.set(s.id, {
      top: s.topTeam,
      bottom: resolved[s.id] ?? s.bottomTeam,
    });
  }

  // Multiple passes so deeper rounds resolve once their parents do.
  for (let pass = 0; pass < 4; pass++) {
    for (const s of bracketSeries) {
      const cur = slots.get(s.id)!;
      const fillFromParent = (parentId: string | undefined): Team | undefined => {
        if (!parentId) return undefined;
        const p = slots.get(parentId);
        if (!p?.top?.abbreviation || !p?.bottom?.abbreviation) return undefined;
        const w = winnerOfPair(p.top.abbreviation, p.bottom.abbreviation);
        if (!w) return undefined;
        const fullName = namesByAbbr.get(w) ?? w;
        return makeTeam(w, fullName);
      };
      if (!cur.top) cur.top = fillFromParent(s.topParentSeriesId);
      if (!cur.bottom) cur.bottom = fillFromParent(s.bottomParentSeriesId);
    }
  }

  return bracketSeries.map((s) => {
    const cur = slots.get(s.id)!;
    return { ...s, topTeam: cur.top, bottomTeam: cur.bottom };
  });
}

// Convert bracket series to Match format for the home page (first round only).
// Builds from any bracket — pass the resolved bracket (with play-in winners
// filled in) to avoid showing PIW7/PIW8 placeholders once the API knows who
// the real 7/8 seeds are.
export function buildFallbackMatches(seriesList: BracketSeries[] = bracketSeries): Match[] {
  const firstRound = seriesList.filter((s) => s.round === "First Round" && s.topTeam && s.bottomTeam);
  return firstRound.map((s, i) => ({
    id: s.id,
    round: "First Round",
    conference: s.conference,
    gameNumber: 1,
    date: isPlayInPlaceholder(s.bottomTeam!.abbreviation) ? "TBD" : (i < 3 ? "Apr 19" : "Apr 20"),
    time: isPlayInPlaceholder(s.bottomTeam!.abbreviation) ? "TBD" : (["7:00 PM", "8:00 PM", "9:30 PM", "3:30 PM"][i] + " ET"),
    homeTeam: s.topTeam!,
    awayTeam: s.bottomTeam!,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming" as const,
    tips: makeTips(s.topTeam!.abbreviation, s.bottomTeam!.abbreviation),
  }));
}

export const fallbackMatches: Match[] = buildFallbackMatches();