import * as React from "react";
import { cn } from "@/lib/utils";

interface TeamLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

const TeamLogo = React.forwardRef<HTMLImageElement, TeamLogoProps>(
  ({ src, alt, className = "w-10 h-10", ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    if (hasError || !src) {
      return (
        <span
          aria-label={alt}
          role="img"
          className={cn("inline-flex items-center justify-center text-3xl", className)}
        >
          🏀
        </span>
      );
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn(className, "object-contain")}
        loading="lazy"
        onError={() => setHasError(true)}
        {...props}
      />
    );
  }
);

TeamLogo.displayName = "TeamLogo";

export default TeamLogo;
