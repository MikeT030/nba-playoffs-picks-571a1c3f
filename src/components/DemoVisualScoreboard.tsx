import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playerCards } from "@/data/playerCards";
import { playerImages } from "@/lib/playerImages";

interface PickRow {
  profile_name: string;
  series_id: string;
  winner: string;
  games_in_series: number;
  user_id: string;
}
interface SeriesResult {
  series_id: string;
  winner: string;
  games_played: number;
}
interface Row {
  name: string;
  totalPoints: number;
  cardId?: string;
}

// Lightweight scoring (mirrors Scoreboard logic)
function compute(picks: PickRow[], results: SeriesResult[]) {
  const byPlayer = new Map<string, PickRow[]>();
  picks.forEach((p) => {
    const arr = byPlayer.get(p.profile_name) || [];
    arr.push(p);
    byPlayer.set(p.profile_name, arr);
  });
  const resMap = new Map(results.map((r) => [r.series_id, r]));
  const winners = new Set(results.map((r) => r.winner));
  const out: { name: string; totalPoints: number }[] = [];
  byPlayer.forEach((list, name) => {
    let pts = 0;
    const scored = new Set<number>();
    list.forEach((p, i) => {
      const r = resMap.get(p.series_id);
      if (!r) return;
      if (r.winner === p.winner) {
        pts += r.games_played === p.games_in_series ? 3 : 2;
        scored.add(i);
      }
    });
    list.forEach((p, i) => {
      if (scored.has(i)) return;
      const r = resMap.get(p.series_id);
      if (r && r.winner !== p.winner && winners.has(p.winner)) pts += 1;
    });
    const fr = resMap.get("nba-finals");
    const fp = list.find((p) => p.series_id === "nba-finals");
    if (fr && fp && fr.winner === fp.winner) pts += 4;
    out.push({ name, totalPoints: pts });
  });
  return out.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
}

// Star rating: 5 stars for #1, descending. Min 1 star.
function starsForRank(rank: number, total: number): number {
  if (total <= 1) return 5;
  // Map rank (0..total-1) to 5..1
  const ratio = 1 - rank / Math.max(1, total - 1);
  return Math.max(1, Math.round(ratio * 4) + 1);
}

const ScoreRibbon = ({ row, rank, totalPlayers }: { row: Row; rank: number; totalPlayers: number }) => {
  const card = row.cardId ? playerCards.find((c) => c.id === row.cardId) : null;
  const avatarSrc = card ? playerImages[card.image] : null;
  const stars = starsForRank(rank, totalPlayers);

  return (
    <div className="relative w-full h-[72px] select-none">
      {/* Background ribbon shape using clip-path */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1f3a8a 0%, #2952c4 50%, #1f3a8a 100%)",
          clipPath: "polygon(0 0, 96% 0, 92% 100%, 0 100%)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
      />
      {/* Diagonal accent stripes (left, behind avatar tab) */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: "82px",
          width: "70px",
          background:
            "repeating-linear-gradient(110deg, transparent 0 8px, rgba(255,255,255,0.18) 8px 14px, transparent 14px 22px)",
          clipPath: "polygon(20% 0, 100% 0, 80% 100%, 0 100%)",
        }}
      />
      {/* Avatar tab (raised box on the left) */}
      <div
        className="absolute -left-1 -top-1 -bottom-1 w-[92px]"
        style={{
          background: "linear-gradient(180deg, #2a5fdb 0%, #1d3fa3 100%)",
          clipPath: "polygon(0 0, 100% 0, 88% 100%, 0 100%)",
          boxShadow: "2px 0 6px rgba(0,0,0,0.35)",
        }}
      />
      {/* Avatar circle */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full bg-white border-[3px] border-white shadow-lg overflow-hidden flex items-center justify-center">
        {avatarSrc ? (
          <img src={avatarSrc} alt={row.name} className="w-full h-full object-cover object-top" />
        ) : (
          <span className="font-display text-2xl text-[#1f3a8a]">
            {row.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="absolute inset-0 pl-[110px] pr-12 flex items-center justify-between gap-3">
        <span className="font-display text-white text-lg tracking-wide truncate drop-shadow">
          {row.name}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-display text-white text-xl tracking-wider tabular-nums drop-shadow">
            {row.totalPoints.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
};

const DemoVisualScoreboard = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [picksRes, resRes, profilesRes, cardsRes] = await Promise.all([
        supabase.from("picks").select("profile_name, series_id, winner, games_in_series, user_id"),
        supabase.from("series_results").select("series_id, winner, games_played"),
        supabase.from("profiles").select("user_id, display_name"),
        supabase.from("player_card_assignments").select("user_id, card_id"),
      ]);
      const activeIds = new Set((profilesRes.data || []).map((p: any) => p.user_id));
      const picks = ((picksRes.data || []) as PickRow[]).filter((p) => activeIds.has(p.user_id));
      const results = (resRes.data || []) as SeriesResult[];
      const scores = compute(picks, results);

      const userToName = new Map<string, string>();
      picks.forEach((p) => userToName.set(p.user_id, p.profile_name));
      const nameToCard: Record<string, string> = {};
      (cardsRes.data || []).forEach((c: any) => {
        const n = userToName.get(c.user_id);
        if (n) nameToCard[n] = c.card_id;
      });

      setRows(scores.map((s) => ({ ...s, cardId: nameToCard[s.name] })));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-2">
      <h2 className="font-display text-lg tracking-wider text-muted-foreground">
        DEMO VISUAL SCOREBOARD
      </h2>
      <div className="rounded-lg bg-[#181C23] p-4 space-y-3">
        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">No scores yet.</p>
        ) : (
          rows.map((row, i) => (
            <ScoreRibbon key={row.name} row={row} rank={i} totalPlayers={rows.length} />
          ))
        )}
      </div>
    </div>
  );
};

export default DemoVisualScoreboard;
