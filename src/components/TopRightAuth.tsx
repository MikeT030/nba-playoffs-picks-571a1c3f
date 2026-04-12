import { Link, useLocation } from "react-router-dom";

const TopRightAuth = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/match/")) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        to="/settings"
        className="flex items-center justify-center px-4 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 hover:border-primary/40 transition-colors text-sm font-medium text-foreground"
      >
        Profile
      </Link>
    </div>
  );
};

export default TopRightAuth;