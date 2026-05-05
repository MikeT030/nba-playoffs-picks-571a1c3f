import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { FlyerCardForId } from "@/components/DemoFlyerCardVariants";
import {
  FLYER_CARD_IDS,
  type FlyerCardId,
  claimDemoCard,
  unclaimDemoCard,
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

/** Stack offsets — each card peeks out down/right from the one before it. */
const STACK_OFFSET_X = 36; // px right per index
const STACK_OFFSET_Y = 28; // px down per index

const AdminFlyerAwardDemoDrawer = ({ open, onOpenChange, mode, viewerUserId }: Props) => {
  const { winners, burned, claims } = useDemoFlyerState();
  const [justBurnedId, setJustBurnedId] = useState<FlyerCardId | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<FlyerCardId | null>(null);

  const viewer = winners.find((w) => w.user_id === viewerUserId) ?? winners[0];
  const viewerClaimedCard: FlyerCardId | null = useMemo(
    () => (viewer ? getCardForUser(viewer.user_id) : null),
    [viewer, claims],
  );

  const viewerHasBurned =
    mode === "receiver" &&
    !!viewerClaimedCard &&
    (burned[viewerClaimedCard] ?? isDemoCardBurned(viewerClaimedCard));

  // Auto-claim & select the viewer's pre-assigned card so only their card shows.
  useEffect(() => {
    if (!open) {
      setJustBurnedId(null);
      setSelectedCardId(null);
      return;
    }
    if (mode === "receiver" && viewer) {
      let card = viewerClaimedCard;
      if (!card && viewer.cardId) {
        if (claimDemoCard(viewer.cardId, viewer.user_id)) {
          card = viewer.cardId;
        }
      }
      if (card) setSelectedCardId(card);
    }
  }, [open, mode, viewer, viewerClaimedCard]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Block Escape unless allowed to close
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
        <span className="text-primary font-bold">{viewer?.name ?? "You"}</span>,
        <br />
        you finished the 1st round among the top 3!
        <br />
        This is your new player card.
      </>
    ) : (
      `It's official, ${formatNames(winners.map((w) => w.name))} finished top 3 in the first round. Each won a new player card as a reward.`
    );

  const subline =
    mode === "receiver"
      ? viewerHasBurned
        ? "Your card has been added to your Profile."
        : selectedCardId
          ? "Tap your card again to burn the pack open."
          : "Tap any pack to bring it to the front. First come, first served."
      : "Cards stay sealed until each owner burns their pack.";

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (mode !== "receiver" || !viewer) return;
        if (viewerHasBurned) return;
        if (!selectedCardId) return;
        unclaimDemoCard(viewer.user_id);
        setSelectedCardId(null);
      }}
    >
      {/* Top bar */}
      <div className="relative shrink-0 px-4 pt-6 pb-4 text-center">
        <p className="font-display text-xs sm:text-sm tracking-[0.25em] uppercase text-muted-foreground">
          FLYER – The Shot · {mode === "receiver" ? "You're Worthy" : "It's Official"}
        </p>
        <h2 className="mt-2 font-body sm:text-lg text-foreground leading-snug max-w-2xl mx-auto font-medium text-lg">
          {headline}
        </h2>

        {canClose && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stack stage */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <div className="relative mx-auto w-full max-w-md flex items-center justify-center py-6">
          {mode === "broadcast" ? (
            <BroadcastCarousel winners={winners} burned={burned} />
          ) : (
            <StackedCards
              mode={mode}
              viewerUserId={viewer?.user_id}
              claims={claims}
              burned={burned}
              selectedCardId={selectedCardId}
              justBurnedId={justBurnedId}
              viewerClaimedCard={viewerClaimedCard}
              onSelect={(cardId) => {
                if (mode !== "receiver" || !viewer) return;
                if (viewerHasBurned) return;
                if (viewerClaimedCard && cardId !== viewerClaimedCard) return;
                if (!viewerClaimedCard) {
                  const ok = claimDemoCard(cardId, viewer.user_id);
                  if (!ok) {
                    toast.error("That pack just got claimed.");
                    return;
                  }
                }
                setSelectedCardId(cardId);
              }}
              onBurn={(cardId) => {
                setJustBurnedId(cardId);
                markDemoCardBurned(cardId);
              }}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 pb-8 pt-2 flex flex-col items-center gap-4">
        <p className="text-center font-body text-xs sm:text-sm text-muted-foreground max-w-md">
          {subline}
        </p>

        {viewerHasBurned && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="font-display text-[11px] sm:text-xs tracking-[0.3em] text-white bg-black/70 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/25 hover:bg-black transition-colors animate-fade-in"
          >
            NICE, GOT IT
          </button>
        )}
      </div>
    </div>
  );
};

interface StackedCardsProps {
  mode: "receiver" | "broadcast";
  viewerUserId?: string;
  claims: Partial<Record<FlyerCardId, string>>;
  burned: Record<string, boolean>;
  selectedCardId: FlyerCardId | null;
  justBurnedId: FlyerCardId | null;
  viewerClaimedCard: FlyerCardId | null;
  onSelect: (cardId: FlyerCardId) => void;
  onBurn: (cardId: FlyerCardId) => void;
}

const StackedCards = ({
  mode,
  viewerUserId,
  claims,
  burned,
  selectedCardId,
  justBurnedId,
  viewerClaimedCard,
  onSelect,
  onBurn,
}: StackedCardsProps) => {
  // Card width — sized so 4 stacked cards (with offsets) fit comfortably on mobile
  const cardWidthClass = "w-[70vw] max-w-[260px]";

  return (
    <div
      className="relative"
      style={{
        width: `calc(min(70vw, 260px) + ${STACK_OFFSET_X * (FLYER_CARD_IDS.length - 1)}px)`,
        height: `calc(min(70vw, 260px) * (4 / 3) + ${STACK_OFFSET_Y * (FLYER_CARD_IDS.length - 1)}px)`,
      }}
    >
      {((): FlyerCardId[] => {
        if (mode !== "receiver") return [...FLYER_CARD_IDS];
        // Find this viewer's allocated card: claimed first, otherwise pre-assigned.
        const viewerName = viewerUserId;
        const claimed =
          viewerClaimedCard ??
          (viewerName
            ? (Object.entries(claims).find(([, uid]) => uid === viewerName)?.[0] as
                | FlyerCardId
                | undefined)
            : undefined);
        return claimed ? [claimed] : [];
      })().map((cardId, i) => {
        const claimedBy = claims[cardId];
        const cardBurned = burned[cardId] ?? isDemoCardBurned(cardId);
        const isViewerCard = mode === "receiver" && claimedBy === viewerUserId;
        const isSelected = selectedCardId === cardId;

        // Sealed/opened state
        let sealed: boolean;
        let defaultOpened: boolean;
        let burnHandler: (() => void) | undefined;

        if (mode === "receiver") {
          sealed = !isViewerCard || !cardBurned;
          defaultOpened = isViewerCard && cardBurned;
          // Only the selected viewer-card can be burned
          burnHandler = isViewerCard && isSelected ? () => onBurn(cardId) : undefined;
        } else {
          sealed = !claimedBy || !cardBurned;
          defaultOpened = !!claimedBy && cardBurned;
        }

        // Position
        const baseX = i * STACK_OFFSET_X;
        const baseY = i * STACK_OFFSET_Y;
        let translateX = baseX;
        let translateY = baseY;
        let zIndex = i + 1;
        let opacity = 1;
        let scale = 1;

        if (selectedCardId) {
          if (isSelected) {
            // Center it within the stack container
            const totalW = STACK_OFFSET_X * (FLYER_CARD_IDS.length - 1);
            const totalH = STACK_OFFSET_Y * (FLYER_CARD_IDS.length - 1);
            translateX = totalW / 2;
            translateY = totalH / 2;
            zIndex = 100;
            scale = 1.04;
          } else {
            // Push back & dim
            opacity = 0.45;
          }
        }

        // After burn the selected card stays front; others stay dim
        const ownerName = claimedBy
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            undefined
          : null;
        void ownerName;

        // Click logic
        const handleClick = (e: React.MouseEvent) => {
          if (mode !== "receiver") return;
          // Tapping the selected card shouldn't bubble to the layer (which would
          // deselect it). The inner sealed-pack handles the burn itself.
          if (isSelected) {
            e.stopPropagation();
            return;
          }
          // Otherwise: try to select
          if (viewerClaimedCard && cardId !== viewerClaimedCard) return;
          e.stopPropagation();
          onSelect(cardId);
        };

        // Disable pointer events on the underlying pack wrapper unless this card
        // is selected & burnable (so taps on stacked-but-not-front cards reach
        // our wrapper div and call handleClick instead of triggering burn).
        const innerInteractive = isSelected && isViewerCard && !cardBurned;

        return (
          <div
            key={cardId}
            onClick={handleClick}
            role={mode === "receiver" ? "button" : undefined}
            className={`absolute top-0 left-0 ${cardWidthClass} cursor-pointer transition-all duration-500 ease-out`}
            style={{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              zIndex,
              opacity,
              pointerEvents: mode === "broadcast" || (selectedCardId && !isSelected) ? "none" : "auto",
            }}
          >
            <div
              style={{
                pointerEvents: innerInteractive ? "auto" : "none",
              }}
              // Wrapper to gate inner sealed-pack click. We put pointer-events:none on
              // the inner wrapper so taps go to the outer div (handleClick) UNLESS
              // the card is selected and ready to burn.
            >
              <FlyerCardForId
                cardId={cardId}
                sealed={sealed}
                defaultOpened={defaultOpened}
                hideHeading
                onBurn={burnHandler}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminFlyerAwardDemoDrawer;
