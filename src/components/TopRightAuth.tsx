import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const TopRightAuth = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        to="/settings"
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
      >
        <Settings size={16} />
        Settings
      </Link>
    </div>
  );
};

export default TopRightAuth;
