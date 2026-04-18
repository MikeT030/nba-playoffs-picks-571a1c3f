import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playerCards } from "@/data/playerCards";

export const usePlayerCard = () => {
  const { user } = useAuth();
  const [assignedCardId, setAssignedCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAssignment = async () => {
    if (!user) {
      setAssignedCardId(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("player_card_assignments")
      .select("card_id")
      .eq("user_id", user.id)
      .maybeSingle();
    setAssignedCardId(data?.card_id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignment();
  }, [user]);

  const assignRandomCard = async (): Promise<string | null> => {
    if (!user) return null;

    const MAX_ATTEMPTS = 5;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Re-fetch taken cards each attempt to avoid stale data after race collisions
      const { data: taken } = await supabase
        .from("player_card_assignments")
        .select("card_id");

      const takenIds = new Set((taken || []).map((r: any) => r.card_id));
      const available = playerCards.filter((c) => !takenIds.has(c.id));

      if (available.length === 0) return null;

      const chosen = available[Math.floor(Math.random() * available.length)];

      const { error } = await supabase
        .from("player_card_assignments")
        .insert({ user_id: user.id, card_id: chosen.id });

      if (!error) {
        setAssignedCardId(chosen.id);
        return chosen.id;
      }

      // 23505 = unique_violation (card got taken between fetch and insert) → retry.
      // Any other error → bail.
      if ((error as any).code !== "23505") {
        console.error("Failed to assign card:", error);
        return null;
      }
    }

    console.error("Failed to assign card after retries (race contention)");
    return null;
  };

  return {
    assignedCardId,
    loading,
    assignRandomCard,
    refetch: fetchAssignment,
  };
};
