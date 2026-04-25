import { RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

/**
 * Visual indicator that sits above the page top and is revealed as the user
 * pulls down. Pin this near the top of your page (above the scrollable content).
 */
const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  progress,
}: PullToRefreshIndicatorProps) => {
  const visible = pullDistance > 4 || isRefreshing;
  const translate = isRefreshing ? 40 : pullDistance;
  const rotation = progress * 360;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-50 flex justify-center"
      style={{
        transform: `translateY(${translate - 40}px)`,
        transition: isRefreshing || pullDistance === 0 ? "transform 200ms ease-out" : "none",
        opacity: visible ? 1 : 0,
      }}
      aria-hidden={!visible}
    >
      <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1E24]/90 backdrop-blur-md border border-white/10 shadow-lg">
        <RefreshCw
          className={`h-4 w-4 text-primary ${isRefreshing ? "animate-spin" : ""}`}
          style={!isRefreshing ? { transform: `rotate(${rotation}deg)` } : undefined}
        />
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
