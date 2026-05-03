import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { totalUserPoints, type PickLite, type SeriesResultLite } from "@/lib/pickScoring";
import { toast } from "sonner";
import { Trophy, Save, RotateCcw, Shuffle, Eye, Radio, Trash2 } from "lucide-react";
import AdminFlyerAwardDemoDrawer from "@/components/AdminFlyerAwardDemoDrawer";
import {
  FLYER_CARD_IDS,
  type FlyerCardId,
  setDemoWinners,
  clearDemo,
  useDemoFlyerState,
} from "@/lib/flyerDemo";

const FLYER_CARDS = [
  { id: "chapman", label: "Chapman" },
  { id: "paxson", label: "Paxson" },
  { id: "miller", label: "Miller" },
  { id: "davis", label: "Davis" },
] as const;

type CardId = FlyerCardId;

interface ProfileRow {
  user_id: string;
  display_name: string | null;
}
interface PickRow extends PickLite {
  user_id: string;
  created_at: string;
}
interface Standing {
  user_id: string;
  display_name: string;
  points: number;
  earliestPick: string;
}
interface Assignment {
  card_id: string;
  user_id: string;
}

const AdminFlyerAwardPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [assignments, setAssignments] = useState<Record<CardId, string>>({
    chapman: "",
    paxson: "",
    miller: "",
    davis: "",
  });
  const [initialAssignments, setInitialAssignments] = useState<Record<CardId, string>>({
    chapman: "",
    paxson: "",
    miller: "",
    davis: "",
  });

  const load = async () => {
    setLoading(true);
    const [picksRes, resultsRes, profilesRes, assignsRes] = await Promise.all([
      supabase.from("picks").select("user_id, series_id, winner, games_in_series, created_at"),
      supabase.from("series_results").select("series_id, winner, games_played"),
      supabase.from("profiles").select("user_id, display_name"),
      supabase.from("flyer_card_assignments").select("card_id, user_id"),
    ]);

    if (picksRes.error || resultsRes.error || profilesRes.error || assignsRes.error) {
      toast.error("Failed to load standings");
      setLoading(false);
      return;
    }

    const picks = (picksRes.data ?? []) as PickRow[];
    const results = (resultsRes.data ?? []) as SeriesResultLite[];
    const profs = (profilesRes.data ?? []) as ProfileRow[];
    const profMap = new Map(profs.map((p) => [p.user_id, p.display_name || "(no name)"]));

    const byUser = new Map<string, PickRow[]>();
    for (const p of picks) {
      if (!byUser.has(p.user_id)) byUser.set(p.user_id, []);
      byUser.get(p.user_id)!.push(p);
    }

    const computed: Standing[] = [];
    for (const [uid, ups] of byUser) {
      const pts = totalUserPoints(ups, results);
      const earliest = ups.reduce((m, p) => (p.created_at < m ? p.created_at : m), ups[0].created_at);
      computed.push({
        user_id: uid,
        display_name: profMap.get(uid) ?? "(no name)",
        points: pts,
        earliestPick: earliest,
      });
    }
    computed.sort((a, b) => b.points - a.points || a.earliestPick.localeCompare(b.earliestPick));
    setStandings(computed);
    setProfiles(profs);

    const assigns = (assignsRes.data ?? []) as Assignment[];
    const map: Record<CardId, string> = { chapman: "", paxson: "", miller: "", davis: "" };
    for (const a of assigns) {
      if (a.card_id in map) map[a.card_id as CardId] = a.user_id;
    }
    // Default any unassigned card to current top-N
    const top = computed.slice(0, 4);
    FLYER_CARDS.forEach((c, i) => {
      if (!map[c.id] && top[i]) map[c.id] = top[i].user_id;
    });
    setAssignments(map);
    // initial = whatever is actually persisted (so dirty detection works)
    const persisted: Record<CardId, string> = { chapman: "", paxson: "", miller: "", davis: "" };
    for (const a of assigns) {
      if (a.card_id in persisted) persisted[a.card_id as CardId] = a.user_id;
    }
    setInitialAssignments(persisted);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userOptions = useMemo(() => {
    // Standings users first (with points), then any remaining profiles
    const inStandings = new Set(standings.map((s) => s.user_id));
    const extras = profiles
      .filter((p) => !inStandings.has(p.user_id))
      .map((p) => ({ user_id: p.user_id, display_name: p.display_name || "(no name)", points: 0 }));
    return [...standings.map((s) => ({ user_id: s.user_id, display_name: s.display_name, points: s.points })), ...extras];
  }, [standings, profiles]);

  const dirty = useMemo(
    () => FLYER_CARDS.some((c) => assignments[c.id] !== initialAssignments[c.id]),
    [assignments, initialAssignments]
  );

  const resetToTop4 = () => {
    const top = standings.slice(0, 4);
    const next: Record<CardId, string> = { chapman: "", paxson: "", miller: "", davis: "" };
    FLYER_CARDS.forEach((c, i) => {
      if (top[i]) next[c.id] = top[i].user_id;
    });
    setAssignments(next);
  };

  const save = async () => {
    setSaving(true);
    const rows = FLYER_CARDS.filter((c) => assignments[c.id]).map((c) => ({
      card_id: c.id,
      user_id: assignments[c.id],
      assigned_by: user?.id ?? null,
      assigned_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("flyer_card_assignments")
      .upsert(rows, { onConflict: "card_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Flyer cards assigned");
    setInitialAssignments({ ...assignments });
  };

  if (loading) {
    return <p className="font-body text-sm text-muted-foreground">Loading standings…</p>;
  }

  const top10 = standings.slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Current Standings (Top 10)
        </p>
        <ul className="space-y-1">
          {top10.map((s, i) => (
            <li
              key={s.user_id}
              className="flex items-center justify-between gap-2 bg-background/40 rounded-md px-3 py-1.5"
            >
              <span className="font-body text-xs text-muted-foreground w-5">{i + 1}</span>
              <span className="font-body text-sm flex-1 truncate">{s.display_name}</span>
              <span className="font-display tracking-wider text-sm">{s.points}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">
            Card Assignments
          </p>
          <button
            onClick={resetToTop4}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={12} />
            Reset to top 4
          </button>
        </div>
        <ul className="space-y-2">
          {FLYER_CARDS.map((card) => {
            const persistedUid = initialAssignments[card.id];
            return (
              <li
                key={card.id}
                className="flex items-center gap-3 bg-background/40 rounded-md px-3 py-2"
              >
                <Trophy size={16} className="text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-display tracking-wider text-sm">{card.label}</p>
                  {persistedUid && (
                    <p className="font-body text-[10px] text-muted-foreground truncate">
                      currently:{" "}
                      {standings.find((s) => s.user_id === persistedUid)?.display_name ??
                        profiles.find((p) => p.user_id === persistedUid)?.display_name ??
                        "?"}
                    </p>
                  )}
                </div>
                <select
                  value={assignments[card.id]}
                  onChange={(e) =>
                    setAssignments((prev) => ({ ...prev, [card.id]: e.target.value }))
                  }
                  className="bg-background border border-border rounded-md text-xs font-body px-2 py-1 max-w-[140px]"
                >
                  <option value="">— none —</option>
                  {userOptions.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.display_name} ({u.points} pts)
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        onClick={save}
        disabled={!dirty || saving}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-body text-sm py-2 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Save size={14} />
        {saving ? "Saving…" : "Save assignments"}
      </button>
    </div>
  );
};

export default AdminFlyerAwardPanel;
