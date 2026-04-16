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

    // Get all taken card IDs
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

    if (error) {
      // Could be race condition - card already taken or user already has one
      console.error("Failed to assign card:", error);
      return null;
    }

    setAssignedCardId(chosen.id);
    return chosen.id;
  };

  return {
    assignedCardId,
    loading,
    assignRandomCard,
    refetch: fetchAssignment,
  };
};
