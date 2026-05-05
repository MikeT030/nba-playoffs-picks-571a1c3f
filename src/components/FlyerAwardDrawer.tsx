import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FlyerCardForId } from "@/components/DemoFlyerCardVariants";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { burnMyCard, type FlyerAssignment, type FlyerCardId } from "@/lib/flyerState";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "receiver" | "broadcast";
  viewerUserId: string;
  assignments: FlyerAssignment[];
}

const formatNames = (names: string[]) => {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
};

const FlyerAwardDrawer = ({ open, onOpenChange, mode, viewerUserId, assignments }: Props) => {
  const viewer = assignments.find((a) => a.user_id === viewerUserId);
  const viewerCard: FlyerCardId | null = viewer?.card_id ?? null;
  const viewerHasBurned = mode === "receiver" && !!viewer?.burned_at;
  const [burning, setBurning] = useState(false);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
        <span className="text-primary font-bold">{viewer?.display_name ?? "You"}</span>,
        <br />
        you finished the 1st round among the top 3!
        <br />
        This is your new player card.
      </>
    ) : (
      `It's official, ${formatNames(assignments.map((a) => a.display_name))} finished top 3 in the first round. Each one got a new player card as a reward.`
    );

  const subline =
    mode === "receiver"
      ? viewerHasBurned
        ? "Your card has been added to your Profile."
        : "Tap your pack to burn it open."
      : "Cards stay sealed until each owner burns their pack.";

  const handleBurn = async () => {
    if (!viewer || viewerHasBurned || burning) return;
    setBurning(true);
    await burnMyCard(viewer.user_id);
    setBurning(false);
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
      <DrawerContent className="h-[calc(92vh+40px)] border-none">
        <div className="relative shrink-0 px-4 pt-6 pb-4 text-center">
          <h2 className="font-body sm:text-lg text-foreground leading-snug max-w-2xl mx-auto font-medium text-lg">
            {headline}
          </h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          <div className="relative mx-auto w-full max-w-md flex items-center justify-center py-6">
            {mode === "broadcast" ? (
              <BroadcastCarousel assignments={assignments} />
            ) : viewerCard ? (
              <div className="relative w-full">
                <FlyerCardForId
                  cardId={viewerCard}
                  sealed={!viewerHasBurned}
                  defaultOpened={viewerHasBurned}
                  hideHeading
                  onBurn={!viewerHasBurned ? handleBurn : undefined}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 px-4 pb-8 pt-2 flex flex-col items-center gap-4">
          <p className="text-center font-body text-xs sm:text-sm text-muted-foreground max-w-md">
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

const BroadcastCarousel = ({ assignments }: { assignments: FlyerAssignment[] }) => {
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

  const sorted = useMemo(
    () => [...assignments].sort((a, b) => a.card_id.localeCompare(b.card_id)),
    [assignments]
  );

  if (sorted.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {sorted.map((a) => (
            <CarouselItem key={a.user_id} className="flex flex-col items-center gap-3">
              <p className="font-display tracking-[0.25em] uppercase text-primary font-bold text-lg">
                {a.display_name}
              </p>
              <div className="w-full" style={{ pointerEvents: "none" }}>
                <FlyerCardForId
                  cardId={a.card_id}
                  sealed={!a.burned_at}
                  defaultOpened={!!a.burned_at}
                  hideHeading
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-10 sm:-left-12">
          <ChevronLeft className="w-4 h-4" />
        </CarouselPrevious>
        <CarouselNext className="-right-10 sm:-right-12">
          <ChevronRight className="w-4 h-4" />
        </CarouselNext>
      </Carousel>
      <div className="flex gap-1.5">
        {sorted.map((_, i) => (
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

export default FlyerAwardDrawer;
