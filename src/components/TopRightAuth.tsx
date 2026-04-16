import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";

const TopRightAuth = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/match/")) return null;

  return (
    <Link
      to="/settings"
      className="absolute top-4 right-4 z-50 flex items-center justify-center gap-1.5 h-10 px-4 rounded-full border border-white/10 bg-[#22272E]/80 backdrop-blur-md hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
    >
      <User size={16} className="text-white" />
      <span className="text-xs font-body text-white">Profile</span>
    </Link>
  );
};

export default TopRightAuth;