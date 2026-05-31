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
        you won the Conference Finals.
        <br />
        Here is your unique reward.
      </>
    ) : (
      <>
        It's official,{" "}
        <span className="text-primary font-bold">{winner?.name ?? "Someone"}</span> won the
        Conference Finals and unlocked a unique player card.
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
    // Let SealedPackCard play its burn animation first (~1930ms),
    // then flip the state so the revealed card + CTA appear.
    window.setTimeout(() => {
      setJustBurned(true);
      markConfDemoBurned();
    }, 1930);
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
        <div className="relative shrink-0 px-4 pb-4 text-center pt-[18px]">
          <h2 className="mt-2 font-body sm:text-lg text-foreground leading-snug max-w-2xl mx-auto font-medium text-lg pt-[12px]">
            {headline}
          </h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          <div className="relative mx-auto w-full max-w-md flex flex-col items-center justify-center py-6 gap-3 pt-[10px]">
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

        <div className="shrink-0 px-4 pt-[5px] flex flex-col items-center justify-end gap-4 bg-gradient-to-t from-background from-50% to-transparent pb-[10px]">
          {viewerHasBurned && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="font-display sm:text-xs tracking-[0.3em] text-primary bg-transparent px-5 py-2.5 rounded-full border border-primary hover:bg-primary/10 transition-colors animate-fade-in text-sm mt-[20px]"
            >
              NICE, GOT IT
            </button>
          )}

          <p className="text-center font-body text-xs sm:text-sm max-w-md text-[#ededed]">
            {subline}
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AdminConfFinalsAwardDemoDrawer;
