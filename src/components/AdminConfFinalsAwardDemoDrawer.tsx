import { useEffect, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { FlyerCardForId } from "@/components/DemoFlyerCardVariants";
import {
  useConfDemoState,
  markConfDemoBurned,
} from "@/lib/flyerConfDemo";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "receiver" | "broadcast";
}

/**
 * Conference Finals "last unique card" reveal — Rex Chapman card goes to the
 * single top-scoring user of the conference finals round.
 *
 * Reuses the FlyerAwardDrawer visual pattern but is single-card / single-user.
 * Demo only: state is browser-local and does not touch the database.
 */
const AdminConfFinalsAwardDemoDrawer = ({ open, onOpenChange, mode }: Props) => {
  const { winner, burned } = useConfDemoState();
  const [justBurned, setJustBurned] = useState(false);

  useEffect(() => {
    if (!open) setJustBurned(false);
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const viewerHasBurned = mode === "receiver" && (burned || justBurned);
  const canClose = mode === "broadcast" || viewerHasBurned;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (canClose) onOpenChange(false);
        else e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canClose, onOpenChange]);

  if (!open) return null;

  const headline =
    mode === "receiver" ? (
      <>
        <span className="text-primary font-bold">{winner?.name ?? "You"}</span>,
        <br />
        you scored the most points in the.
        <br />
        Conference Finals
        <br />
        Here is your one-of-a-kind reward.
      </>
    ) : (
      <>
        It's official,{" "}
        <span className="text-primary font-bold">{winner?.name ?? "Someone"}</span> topped the
        Conference Finals and unlocked the last unique player card.
      </>
    );

  const subline =
    mode === "receiver"
      ? viewerHasBurned
        ? "Your card has been added to your Profile."
        : "Tap your pack to burn it open."
      : "The card stays sealed until its owner burns the pack.";

  const handleBurn = () => {
    if (viewerHasBurned) return;
    setJustBurned(true);
    markConfDemoBurned();
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o && !canClose) return;
        onOpenChange(o);
      }}
      dismissible={canClose}
    >
      <DrawerContent className="h-screen border-none">
        <div className="relative shrink-0 px-4 pt-6 pb-4 text-center">
          <h2 className="mt-2 font-body sm:text-lg text-foreground leading-snug max-w-2xl mx-auto font-medium text-lg pt-[12px]">
            {headline}
          </h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          <div className="relative mx-auto w-full max-w-md flex flex-col items-center justify-center py-6 gap-3">
            {mode === "broadcast" && winner && (
              <p className="font-display tracking-[0.25em] uppercase text-primary font-bold text-lg">
                {winner.name}
              </p>
            )}
            <div
              className="relative w-full"
              style={mode === "broadcast" ? { pointerEvents: "none" } : undefined}
            >
              <FlyerCardForId
                cardId="chapman"
                sealed={mode === "broadcast" ? !burned : !viewerHasBurned}
                defaultOpened={mode === "broadcast" ? burned : viewerHasBurned}
                hideHeading
                onBurn={mode === "receiver" && !viewerHasBurned ? handleBurn : undefined}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 px-4 pb-8 pt-2 flex flex-col items-center gap-4">
          <p className="text-center font-body text-xs sm:text-sm max-w-md text-[#ededed]">
            {subline}
          </p>

          {viewerHasBurned && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="font-display sm:text-xs tracking-[0.3em] text-primary bg-transparent px-5 py-2.5 rounded-full border border-primary hover:bg-primary/10 transition-colors animate-fade-in text-sm"
            >
              NICE, GOT IT
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AdminConfFinalsAwardDemoDrawer;
