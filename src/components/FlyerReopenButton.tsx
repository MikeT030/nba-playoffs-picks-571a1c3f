import { Ticket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const FlyerReopenButton = () => {
  const { user } = useAuth();

  if (!user) return null;

  const handleClick = () => {
    window.dispatchEvent(new Event("flyer:reopen"));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute top-16 right-4 z-50 flex items-center gap-1.5 h-10 px-3 rounded-full border border-solid border-[#ededed] bg-[#22272E]/80 backdrop-blur-md hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 font-display tracking-[0.2em] text-[10px] text-white uppercase"
      aria-label="Open flyer card"
    >
      <Ticket size={14} className="text-primary" />
      Flyer
    </button>
  );
};

export default FlyerReopenButton;
