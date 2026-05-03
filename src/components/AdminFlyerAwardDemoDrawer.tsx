import { useMemo } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { FlyerCardForId } from "@/components/DemoFlyerCardVariants";
import {
  FLYER_CARD_IDS,
  type FlyerCardId,
  claimDemoCard,
  getCardForUser,
  isDemoCardBurned,
  markDemoCardBurned,
  useDemoFlyerState,
} from "@/lib/flyerDemo";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "receiver" | "broadcast";
  /** For receiver mode: which winner is currently viewing. */
  viewerUserId?: string;
}

const formatNames = (names: string[]) => {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
};

/** Fan-style positioning for 4 cards: rotated + horizontally fanned, centered. */
const FAN_TRANSFORMS = [
  { rotate: -12, x: -90 },
  { rotate: -4, x: -30 },
  { rotate: 4, x: 30 },
  { rotate: 12, x: 90 },
];

const AdminFlyerAwardDemoDrawer = ({ open, onOpenChange, mode, viewerUserId }: Props) => {
  const { winners, burned, claims } = useDemoFlyerState();

  const viewer = winners.find((w) => w.user_id === viewerUserId) ?? winners[0];
  const viewerClaimedCard: FlyerCardId | null = useMemo(
    () => (viewer ? getCardForUser(viewer.user_id) : null),
    [viewer, claims],
  );

  const headline =
    mode === "receiver"
      ? `${viewer?.name ?? "You"}, you're worthy of receiving 1 of 4 FLYER – The Shot player cards.`
      : `It's official, ${formatNames(winners.map((w) => w.name))} are worthy of receiving 1 of 4 FLYER – The Shot player cards.`;

  const subline =
    mode === "receiver"
      ? viewerClaimedCard
        ? "Tap your pack to burn it open. Your card lands on your Profile."
        : "Pick any pack — first come, first served. You can only claim one."
      : "Cards stay sealed until each owner burns their pack.";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="font-display text-base tracking-wider uppercase text-muted-foreground">
            FLYER – The Shot · {mode === "receiver" ? "You're Worthy" : "It's Official"}
          </DrawerTitle>
          <DrawerDescription className="font-body text-base text-foreground leading-snug max-w-2xl mx-auto">
            {headline}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-10 overflow-y-auto">
          {/* Fan stack */}
          <div className="relative mx-auto h-[440px] w-full max-w-md flex items-end justify-center">
            {FLYER_CARD_IDS.map((cardId, i) => {
              const claimedBy = claims[cardId];
              const cardBurned = burned[cardId] ?? isDemoCardBurned(cardId);

              // Determine sealed/opened state based on mode
              let sealed: boolean;
              let defaultOpened: boolean;
              let onBurn: (() => void) | undefined;
              let onClickWhenSealed: (() => void) | undefined;

              if (mode === "receiver") {
                const isViewerCard = claimedBy === viewer?.user_id;
                sealed = !isViewerCard || !cardBurned;
                defaultOpened = isViewerCard && cardBurned;
                onBurn = isViewerCard ? () => markDemoCardBurned(cardId) : undefined;

                // Allow viewer to claim an unclaimed pack (first-come, first-served)
                if (!claimedBy && !viewerClaimedCard && viewer) {
                  onClickWhenSealed = () => {
                    const ok = claimDemoCard(cardId, viewer.user_id);
                    if (!ok) toast.error("That pack just got claimed.");
                  };
                }
              } else {
                // broadcast: cards reveal only after their owner burned them
                sealed = !claimedBy || !cardBurned;
                defaultOpened = !!claimedBy && cardBurned;
              }

              const t = FAN_TRANSFORMS[i];
              const ownerName = claimedBy
                ? winners.find((w) => w.user_id === claimedBy)?.name
                : null;
              const isViewerCard = mode === "receiver" && claimedBy === viewer?.user_id;

              return (
                <div
                  key={cardId}
                  className="absolute bottom-0 w-[55%] max-w-[200px] origin-bottom transition-transform duration-300 hover:-translate-y-2"
                  style={{
                    transform: `translateX(${t.x}px) rotate(${t.rotate}deg)`,
                    zIndex: i + 1,
                  }}
                  onClick={onClickWhenSealed}
                  role={onClickWhenSealed ? "button" : undefined}
                >
                  <FlyerCardForId
                    cardId={cardId}
                    sealed={sealed}
                    defaultOpened={defaultOpened}
                    hideHeading
                    onBurn={onBurn}
                  />
                  {ownerName && (
                    <p className="mt-1 text-center font-body text-[10px] text-muted-foreground truncate">
                      {ownerName}
                      {isViewerCard ? " (you)" : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center font-body text-xs text-muted-foreground mt-4 max-w-md mx-auto">
            {subline}
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AdminFlyerAwardDemoDrawer;
