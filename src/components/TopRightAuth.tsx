import { Link } from "react-router-dom";
import { User, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TopRightAuth = () => {
  const { user } = useAuth();

  return (
    <div className="fixed top-4 right-4 z-50">
      {user ? (
        <Link
          to="/settings"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Settings"
        >
          <User size={18} />
        </Link>
      ) : (
        <Link
          to="/auth"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Sign in"
        >
          <LogIn size={18} />
        </Link>
      )}
    </div>
  );
};

export default TopRightAuth;
