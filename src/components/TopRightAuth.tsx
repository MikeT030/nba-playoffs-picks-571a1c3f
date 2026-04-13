import { Link, useLocation } from "react-router-dom";

const TopRightAuth = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/match/")) return null;

  return (
    <Link
      to="/settings"
      className="absolute top-4 right-4 z-50 flex items-center justify-center px-5 py-3.5 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-sm font-body font-semibold text-[#F9F9FA] hover:text-foreground transition-colors duration-200"
    >
      Profile
    </Link>
  );
};

export default TopRightAuth;