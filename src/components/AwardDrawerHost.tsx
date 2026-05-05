import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFlyerState } from "@/lib/flyerState";
import FlyerAwardDrawer from "@/components/FlyerAwardDrawer";

const seenKey = (uid: string) => `flyer.lastSeenBurnedAt.${uid}`;

const AwardDrawerHost = () => {
  const { user } = useAuth();
  const { assignments } = useFlyerState();
  const [closed, setClosed] = useState<{ kind: "receiver" | "broadcast"; key: string } | null>(null);

  const myAssignment = useMemo(
    () => (user ? assignments.find((a) => a.user_id === user.id) : undefined),
    [user, assignments]
  );

  const latestBurn = useMemo(() => {
    const burns = assignments.map((a) => a.burned_at).filter(Boolean) as string[];
    return burns.length > 0 ? burns.reduce((m, t) => (t > m ? t : m)) : "";
  }, [assignments]);

  // Receiver: user has unburned card.
  const showReceiver =
    !!myAssignment && !myAssignment.burned_at && closed?.kind !== "receiver";

  // Broadcast: user is a winner, there's a new burn since they last saw, receiver isn't showing.
  const lastSeen =
    user && typeof window !== "undefined" ? window.localStorage.getItem(seenKey(user.id)) ?? "" : "";
  const showBroadcast =
    !showReceiver &&
    !!latestBurn &&
    latestBurn !== lastSeen &&
    closed?.key !== latestBurn;

  if (!user) return null;
  if (!showReceiver && !showBroadcast) return null;

  const mode: "receiver" | "broadcast" = showReceiver ? "receiver" : "broadcast";

  return (
    <FlyerAwardDrawer
      open
      mode={mode}
      viewerUserId={user.id}
      assignments={assignments}
      onOpenChange={(o) => {
        if (o) return;
        if (mode === "broadcast") {
          window.localStorage.setItem(seenKey(user.id), latestBurn);
          setClosed({ kind: "broadcast", key: latestBurn });
        } else {
          setClosed({ kind: "receiver", key: "" });
        }
      }}
    />
  );
};

export default AwardDrawerHost;
