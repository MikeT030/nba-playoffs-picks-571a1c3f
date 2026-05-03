import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { FlyerCardForId } from "@/components/DemoFlyerCardVariants";
import {
  type DemoWinner,
  type FlyerCardId,
  isDemoCardBurned,
  markDemoCardBurned,
  useDemoFlyerState,
} from "@/lib/flyerDemo";

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

const AdminFlyerAwardDemoDrawer = ({ open, onOpenChange, mode, viewerUserId }: Props) => {
  // Subscribe so other tabs / panel updates re-render the drawer too
  const { winners: liveWinners, burned } = useDemoFlyerState();
  const winners: DemoWinner[] = liveWinners;

  const viewer = winners.find((w) => w.user_id === viewerUserId) ?? winners[0];

  const headline =
    mode === "receiver"
      ? `${viewer?.name ?? "You"}, you're worthy of receiving 1 of 4 FLYER – The Shot player cards.`
      : `It's official, ${formatNames(winners.map((w) => w.name))} are worthy of receiving 1 of 4 FLYER – The Shot player cards.`;

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

        <div className="px-4 pb-8 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {winners.map((w) => {
              const isViewerCard = mode === "receiver" && w.user_id === viewer?.user_id;
              const cardBurned = burned[w.cardId] ?? isDemoCardBurned(w.cardId);
              // Receiver mode: viewer's card is interactive (burnable);
              //   other 3 stay sealed regardless of their burn state.
              // Broadcast mode: each card reveals only after that user has burned it.
              const sealed =
                mode === "receiver" ? !isViewerCard || !cardBurned : true;
              const defaultOpened = mode === "broadcast" ? cardBurned : isViewerCard && cardBurned;

              return (
                <div key={w.cardId} className="space-y-2">
                  <FlyerCardForId
                    cardId={w.cardId}
                    sealed={sealed}
                    defaultOpened={defaultOpened}
                    hideHeading
                    onBurn={
                      mode === "receiver" && isViewerCard
                        ? () => markDemoCardBurned(w.cardId)
                        : undefined
                    }
                  />
                  <p className="text-center font-body text-xs text-muted-foreground truncate">
                    {w.name}
                    {mode === "receiver" && isViewerCard ? " (you)" : ""}
                  </p>
                </div>
              );
            })}
          </div>

          {mode === "receiver" && winners.length > 0 && (
            <p className="text-center font-body text-xs text-muted-foreground mt-6">
              Tap your pack to burn it open. The card will then appear on your Profile page.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AdminFlyerAwardDemoDrawer;
