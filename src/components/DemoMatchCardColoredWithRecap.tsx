import { useState } from "react";
import DemoMatchCardColored from "@/components/DemoMatchCardColored";
import DeadpoolRecapDrawer from "@/components/DeadpoolRecapDrawer";

const DemoMatchCardColoredWithRecap = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DemoMatchCardColored onClick={() => setOpen(true)} />
      <p className="mt-2 text-xs text-muted-foreground font-body text-center">
        Tap the card to summon Wade's recap.
      </p>
      <DeadpoolRecapDrawer open={open} onOpenChange={setOpen} />
    </>
  );
};

export default DemoMatchCardColoredWithRecap;
