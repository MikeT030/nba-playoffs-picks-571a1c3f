import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SeriesResult {
  series_id: string;
  winner: string;
  games_played: number;
}

/**
 * Single batched query for ALL series results.
 * Replaces N per-series queries with one round-trip.
 * Public data (RLS allows everyone to view), so no auth gate.
 */
export function useAllSeriesResults() {
  return useQuery({
    queryKey: ["series-results-all"],
    queryFn: async (): Promise<SeriesResult[]> => {
      const { data, error } = await supabase
        .from("series_results")
        .select("series_id, winner, games_played");
      if (error) {
        console.error("Failed to fetch series results:", error);
        return [];
      }
      return (data ?? []) as SeriesResult[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
