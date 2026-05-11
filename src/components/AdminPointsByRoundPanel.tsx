import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bracketSeries } from "@/data/playoffsData";
import { scorePick, type PickLite, type SeriesResultLite } from "@/lib/pickScoring";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PickRow extends PickLite {
  profile_name: string;
  user_id: string;
}

const ROUNDS = [
  { key: "First Round", label: "R1" },
  { key: "Conference Semifinals", label: "SF" },
  { key: "Conference Finals", label: "CF" },
  { key: "Finals", label: "F" },
] as const;

const seriesRoundMap = new Map(bracketSeries.map((s) => [s.id, s.round]));

interface PlayerRow {
  name: string;
  perRound: Record<string, number>;
  champBonus: number;
  total: number;
}

const AdminPointsByRoundPanel = () => {
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<PickRow[]>([]);
  const [results, setResults] = useState<SeriesResultLite[]>([]);

  useEffect(() => {
    (async () => {
      const [picksRes, resultsRes, profilesRes] = await Promise.all([
        supabase.from("picks").select("profile_name, series_id, winner, games_in_series, user_id"),
        supabase.from("series_results").select("series_id, winner, games_played"),
        supabase.from("profiles").select("user_id"),
      ]);
      const activeIds = new Set((profilesRes.data || []).map((p: any) => p.user_id));
      setPicks(((picksRes.data || []) as PickRow[]).filter((p) => activeIds.has(p.user_id)));
      setResults((resultsRes.data || []) as SeriesResultLite[]);
      setLoading(false);
    })();
  }, []);

  const rows = useMemo<PlayerRow[]>(() => {
    const byUser = new Map<string, PickRow[]>();
    for (const p of picks) {
      const list = byUser.get(p.profile_name) || [];
      list.push(p);
      byUser.set(p.profile_name, list);
    }

    const out: PlayerRow[] = [];
    for (const [name, userPicks] of byUser) {
      const perRound: Record<string, number> = {
        "First Round": 0,
        "Conference Semifinals": 0,
        "Conference Finals": 0,
        Finals: 0,
      };
      for (const p of userPicks) {
        const round = seriesRoundMap.get(p.series_id);
        if (!round) continue;
        const { points } = scorePick(p, userPicks, results, bracketSeries);
        perRound[round] = (perRound[round] || 0) + points;
      }
      const finalsPick = userPicks.find((p) => p.series_id === "nba-finals");
      const finalsResult = results.find((r) => r.series_id === "nba-finals");
      const champBonus =
        finalsPick && finalsResult && finalsPick.winner === finalsResult.winner ? 4 : 0;
      const total =
        Object.values(perRound).reduce((a, b) => a + b, 0) + champBonus;
      out.push({ name, perRound, champBonus, total });
    }
    out.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    return out;
  }, [picks, results]);

  if (loading) {
    return <p className="font-body text-sm text-muted-foreground">Loading…</p>;
  }
  if (rows.length === 0) {
    return <p className="font-body text-sm text-muted-foreground">No picks found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-display text-xs tracking-wider">Player</TableHead>
            {ROUNDS.map((r) => (
              <TableHead key={r.key} className="font-display text-xs tracking-wider text-right">
                {r.label}
              </TableHead>
            ))}
            <TableHead className="font-display text-xs tracking-wider text-right">Champ</TableHead>
            <TableHead className="font-display text-xs tracking-wider text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="font-body text-sm">{row.name}</TableCell>
              {ROUNDS.map((r) => (
                <TableCell key={r.key} className="font-body text-sm text-right tabular-nums">
                  {row.perRound[r.key] ?? 0}
                </TableCell>
              ))}
              <TableCell className="font-body text-sm text-right tabular-nums">
                {row.champBonus}
              </TableCell>
              <TableCell className="font-body text-sm text-right tabular-nums font-semibold">
                {row.total}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="font-body text-[10px] text-muted-foreground mt-3">
        R1 = First Round · SF = Conference Semifinals · CF = Conference Finals · F = Finals · Champ = +4 bonus for correct Finals winner.
      </p>
    </div>
  );
};

export default AdminPointsByRoundPanel;
