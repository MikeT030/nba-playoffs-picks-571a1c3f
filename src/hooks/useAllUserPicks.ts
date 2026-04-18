import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPick {
  series_id: string;
  winner: string;
  games_in_series: number;
}

/**
 * Single batched query for ALL of the current user's picks.
 * Replaces N per-series picks queries with one round-trip.
 */
export function useAllUserPicks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-picks-all", user?.id],
    queryFn: async (): Promise<UserPick[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("picks")
        .select("series_id, winner, games_in_series")
        .eq("user_id", user.id);
      if (error) {
        console.error("Failed to fetch user picks:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}
