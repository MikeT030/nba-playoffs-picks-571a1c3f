import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const FLYER_CARD_IDS = ["chapman", "paxson", "miller", "davis"] as const;
export type FlyerCardId = (typeof FLYER_CARD_IDS)[number];

export const FLYER_ROUND = "first_round";

export interface FlyerAssignment {
  user_id: string;
  card_id: FlyerCardId;
  display_name: string;
  burned_at: string | null;
}

interface RawAssignment {
  user_id: string;
  card_id: string;
  burned_at: string | null;
  round: string;
}

const fetchAll = async (): Promise<FlyerAssignment[]> => {
  const { data: assigns, error } = await supabase
    .from("flyer_card_assignments")
    .select("user_id, card_id, burned_at, round")
    .eq("round", FLYER_ROUND);
  if (error || !assigns) return [];
  const userIds = assigns.map((a) => a.user_id);
  if (userIds.length === 0) return [];
  const { data: profs } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);
  const nameMap = new Map((profs ?? []).map((p) => [p.user_id, p.display_name || "(no name)"]));
  return (assigns as RawAssignment[])
    .filter((a) => (FLYER_CARD_IDS as readonly string[]).includes(a.card_id))
    .map((a) => ({
      user_id: a.user_id,
      card_id: a.card_id as FlyerCardId,
      burned_at: a.burned_at,
      display_name: nameMap.get(a.user_id) ?? "(no name)",
    }));
};

export const burnMyCard = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("flyer_card_assignments")
    .update({ burned_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("round", FLYER_ROUND)
    .is("burned_at", null);
  return !error;
};

export const useFlyerState = () => {
  const [assignments, setAssignments] = useState<FlyerAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await fetchAll();
    setAssignments(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`flyer-card-assignments-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flyer_card_assignments" },
        () => {
          refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { assignments, loading, refresh };
};

export const getCardForUserId = (
  assignments: FlyerAssignment[],
  userId: string | undefined | null
): FlyerCardId | null => {
  if (!userId) return null;
  return assignments.find((a) => a.user_id === userId)?.card_id ?? null;
};
