import { useAuth } from "@/contexts/AuthContext";
import flyerLogo from "@/assets/flyer-logo.png";

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
      className="absolute top-4 right-16 z-50 flex items-center justify-center h-10 w-10 rounded-full border border-solid border-[#ededed] bg-[#22272E]/80 backdrop-blur-md hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
      aria-label="Open flyer card"
    >
      <img src={flyerLogo} alt="Flyer" className="h-5 w-auto object-contain" />
    </button>
  );
};

export default FlyerReopenButton;
