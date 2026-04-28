import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useDetectedSeriesResults, type DetectedSeriesResult } from "@/hooks/useDetectedSeriesResults";

type RowState = "ready" | "confirmed-match" | "confirmed-mismatch" | "in-progress";

function classify(d: DetectedSeriesResult): RowState {
  if (d.confirmed) {
    return d.matchesConfirmed ? "confirmed-match" : "confirmed-mismatch";
  }
  if (d.detectedWinner) return "ready";
  return "in-progress";
}

const roundLabel = (r: string) =>
  r === "Conference Semifinals"
    ? "Conf. Semis"
    : r === "Conference Finals"
      ? "Conf. Finals"
      : r;

const AdminSeriesConfirmPanel = () => {
  const { data: detected, isLoading } = useDetectedSeriesResults();
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleConfirm = async (d: DetectedSeriesResult) => {
    if (!d.detectedWinner) return;
    setSavingId(d.series_id);
    const { error } = await supabase
      .from("series_results")
      .upsert(
        {
          series_id: d.series_id,
          winner: d.detectedWinner,
          games_played: d.detectedGamesPlayed,
        },
        { onConflict: "series_id" }
      );
    setSavingId(null);
    if (error) {
      toast.error(error.message ?? "Failed to save");
      return;
    }
    toast.success(`Confirmed ${d.detectedWinner} in ${d.detectedGamesPlayed}`);
    queryClient.invalidateQueries({ queryKey: ["series-results-all"] });
    queryClient.invalidateQueries({ queryKey: ["series-result", d.series_id] });
  };

  const ready = (detected ?? []).filter((d) => classify(d) === "ready");
  const mismatch = (detected ?? []).filter((d) => classify(d) === "confirmed-mismatch");
  const confirmed = (detected ?? []).filter((d) => classify(d) === "confirmed-match");
  const inProgress = (detected ?? []).filter((d) => classify(d) === "in-progress");

  const headerCount = ready.length + mismatch.length;

  return (
    <Accordion type="single" collapsible defaultValue="confirm" className="bg-[#181C23] rounded-lg px-5">
      <AccordionItem value="confirm" className="border-b-0">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary" />
            <h2 className="font-display text-lg tracking-wider">SERIES TO CONFIRM</h2>
            {headerCount > 0 && (
              <span className="font-body text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 ml-1">
                {headerCount}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {isLoading ? (
            <p className="font-body text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-4">
              {/* Ready to confirm */}
              {ready.length > 0 && (
                <section className="space-y-2">
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                    Ready ({ready.length})
                  </p>
                  {ready.map((d) => (
                    <SeriesRow
                      key={d.series_id}
                      d={d}
                      state="ready"
                      saving={savingId === d.series_id}
                      onConfirm={() => handleConfirm(d)}
                    />
                  ))}
                </section>
              )}

              {/* Confirmed but data disagrees */}
              {mismatch.length > 0 && (
                <section className="space-y-2">
                  <p className="font-body text-xs uppercase tracking-wider text-yellow-500 flex items-center gap-1">
                    <AlertTriangle size={12} /> Mismatch ({mismatch.length})
                  </p>
                  {mismatch.map((d) => (
                    <SeriesRow
                      key={d.series_id}
                      d={d}
                      state="confirmed-mismatch"
                      saving={savingId === d.series_id}
                      onConfirm={() => handleConfirm(d)}
                    />
                  ))}
                </section>
              )}

              {/* In progress (no winner yet) */}
              {inProgress.length > 0 && (
                <section className="space-y-2">
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                    In progress ({inProgress.length})
                  </p>
                  {inProgress.map((d) => (
                    <SeriesRow key={d.series_id} d={d} state="in-progress" />
                  ))}
                </section>
              )}

              {/* Confirmed & matching */}
              {confirmed.length > 0 && (
                <section className="space-y-2">
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                    Confirmed ({confirmed.length})
                  </p>
                  {confirmed.map((d) => (
                    <SeriesRow key={d.series_id} d={d} state="confirmed-match" />
                  ))}
                </section>
              )}

              {ready.length + mismatch.length + inProgress.length + confirmed.length === 0 && (
                <p className="font-body text-sm text-muted-foreground">No series found.</p>
              )}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

interface RowProps {
  d: DetectedSeriesResult;
  state: RowState;
  saving?: boolean;
  onConfirm?: () => void;
}

const SeriesRow = ({ d, state, saving, onConfirm }: RowProps) => {
  const top = d.topAbbr;
  const bottom = d.bottomAbbr;
  return (
    <div className="bg-background/40 rounded-md px-3 py-2 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">
          {d.conference !== "Finals" ? `${d.conference === "East" ? "EAST" : "WEST"} · ` : ""}
          {roundLabel(d.round)}
        </p>
        <p className="font-body text-sm">
          <span className="font-semibold">{top}</span>{" "}
          <span className="text-muted-foreground">{d.topWins}–{d.bottomWins}</span>{" "}
          <span className="font-semibold">{bottom}</span>
        </p>
        {state === "ready" && (
          <p className="font-body text-xs text-primary mt-0.5">
            Detected: {d.detectedWinner} in {d.detectedGamesPlayed}
          </p>
        )}
        {state === "confirmed-match" && (
          <p className="font-body text-xs text-muted-foreground mt-0.5">
            Confirmed: {d.confirmed!.winner} in {d.confirmed!.games_played}
          </p>
        )}
        {state === "confirmed-mismatch" && (
          <p className="font-body text-xs text-yellow-500 mt-0.5">
            Saved: {d.confirmed!.winner} in {d.confirmed!.games_played} · Detected:{" "}
            {d.detectedWinner ?? "none"} in {d.detectedGamesPlayed}
          </p>
        )}
        {state === "in-progress" && (
          <p className="font-body text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock size={10} /> No winner yet
          </p>
        )}
      </div>
      {(state === "ready" || state === "confirmed-mismatch") && onConfirm && (
        <button
          onClick={onConfirm}
          disabled={saving}
          className="shrink-0 bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-body font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {saving ? "…" : state === "ready" ? "Confirm" : "Overwrite"}
        </button>
      )}
      {state === "confirmed-match" && (
        <CheckCircle2 size={18} className="text-primary shrink-0" />
      )}
    </div>
  );
};

export default AdminSeriesConfirmPanel;
