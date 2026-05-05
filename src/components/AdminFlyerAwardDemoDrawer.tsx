import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { FlyerCardForId } from "@/components/DemoFlyerCardVariants";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
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
      <>
        It's official,{" "}
        {winners.map((w, i) => (
          <span key={w.user_id}>
            <span className="text-primary font-bold">{w.name}</span>
            {i < winners.length - 2 ? ", " : i === winners.length - 2 ? ", and " : ""}
          </span>
        ))}{" "}
        finished top 3 in the first round. Each won a new player card as a reward.
      </>
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
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o && !canClose) return;
        onOpenChange(o);
      }}
      dismissible={canClose}
    >
      <DrawerContent
        className="h-[92vh] border-none"
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
          <p className="hidden font-display text-xs sm:text-sm tracking-[0.25em] uppercase text-muted-foreground">
            FLYER – The Shot · {mode === "receiver" ? "You're Worthy" : "It's Official"}
          </p>
          <h2 className="mt-2 font-body sm:text-lg text-foreground leading-snug max-w-2xl mx-auto font-medium text-lg pt-[12px]">
            {headline}
          </h2>
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
  // Find this viewer's allocated card: claimed first, otherwise pre-assigned.
  const claimedId: FlyerCardId | null = (() => {
    if (mode !== "receiver") return null;
    if (viewerClaimedCard) return viewerClaimedCard;
    if (!viewerUserId) return null;
    const found = Object.entries(claims).find(([, uid]) => uid === viewerUserId)?.[0];
    return (found as FlyerCardId | undefined) ?? null;
  })();

  if (!claimedId) return null;

  const cardBurned = burned[claimedId] ?? isDemoCardBurned(claimedId);
  // Keep the sealed wrapper mounted even after burning so the burn animation
  // can play to completion. `defaultOpened` only matters for the initial mount
  // (e.g. reopening the drawer after the card was already burned in a prior session).
  const burnHandler = !cardBurned ? () => onBurn(claimedId) : undefined;

  return (
    <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
      <FlyerCardForId
        cardId={claimedId}
        sealed
        defaultOpened={cardBurned}
        hideHeading
        onBurn={burnHandler}
      />
    </div>
  );
};

interface BroadcastCarouselProps {
  winners: { user_id: string; name: string; cardId: FlyerCardId }[];
  burned: Record<string, boolean>;
}

const BroadcastCarousel = ({ winners, burned }: BroadcastCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSel = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSel);
    return () => {
      api.off("select", onSel);
    };
  }, [api]);

  if (winners.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {winners.map((w) => {
            const cardBurned = burned[w.cardId] ?? isDemoCardBurned(w.cardId);
            return (
              <CarouselItem key={w.user_id} className="flex flex-col items-center gap-3">
                <p className="font-display text-xs tracking-[0.25em] uppercase text-primary font-bold">
                  {w.name}
                </p>
                <div className="w-full" style={{ pointerEvents: "none" }}>
                  <FlyerCardForId
                    cardId={w.cardId}
                    sealed={!cardBurned}
                    defaultOpened={cardBurned}
                    hideHeading
                  />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="-left-10 sm:-left-12">
          <ChevronLeft className="w-4 h-4" />
        </CarouselPrevious>
        <CarouselNext className="-right-10 sm:-right-12">
          <ChevronRight className="w-4 h-4" />
        </CarouselNext>
      </Carousel>
      <div className="flex gap-1.5">
        {winners.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminFlyerAwardDemoDrawer;
