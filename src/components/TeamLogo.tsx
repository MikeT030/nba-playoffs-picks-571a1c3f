interface TeamLogoProps {
  src: string;
  alt: string;
  className?: string;
}

const TeamLogo = ({ src, alt, className = "w-10 h-10" }: TeamLogoProps) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-contain`}
      loading="lazy"
      onError={(e) => {
        // Fallback to a basketball emoji if logo fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const span = document.createElement("span");
        span.textContent = "🏀";
        span.className = "text-3xl";
        target.parentNode?.appendChild(span);
      }}
    />
  );
};

export default TeamLogo;
