import { Link } from "react-router-dom";
import jumpmanLogo from "@/assets/jumpman-logo.png";

const TopRightAuth = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        to="/settings"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 hover:border-primary/40 transition-colors"
      >
        <img src={jumpmanLogo} alt="Settings" className="w-5 h-5 invert" />
      </Link>
    </div>
  );
};

export default TopRightAuth;