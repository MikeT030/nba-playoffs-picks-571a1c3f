import { useLocation, Link } from "react-router-dom";
import { Home, Trophy, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/scoreboard", label: "Scoreboard", icon: Trophy },
  { to: "/my-picks", label: "My Picks", icon: ClipboardList },
];

const FloatingNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/60 shadow-lg shadow-background/40 pl-[2px] pt-[6px] pr-[2px] pb-[6px]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-full text-sm font-body font-medium transition-colors duration-200 whitespace-nowrap",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default FloatingNav;
