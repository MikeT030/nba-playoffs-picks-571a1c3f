import { useState } from "react";

interface TeamLogoProps {
  src: string;
  alt: string;
  className?: string;
}

const TeamLogo = ({ src, alt, className = "w-10 h-10" }: TeamLogoProps) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <span aria-label={alt} role="img" className={`${className} inline-flex items-center justify-center text-3xl`}>
        🏀
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} object-contain`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

export default TeamLogo;
