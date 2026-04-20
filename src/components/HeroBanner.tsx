import { useState } from "react";
import heroImage from "@/assets/hero-playoffs.jpg";
import trophyThumb from "@/assets/trophy-thumb.jpg";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

const HeroBanner = ({ title = "NBA PLAYOFFS, BABY!", subtitle = "2026" }: HeroBannerProps) => {
  const [version, setVersion] = useState<0 | 1>(0);

  return (
    <div className="relative w-full">
      {version === 0 ? (
        <div className="relative w-full h-[27.5vh] min-h-[198px] overflow-hidden">
          <img
            src={heroImage}
            alt="NBA Playoffs Arena"
            className="absolute inset-0 w-full h-full object-cover"
            width={1920}
            height={800}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="container pb-10">
              <p className="text-primary font-body text-sm tracking-widest uppercase mb-2 font-extrabold">
                {subtitle}
              </p>
              <h1
                className="md:text-8xl tracking-wider leading-none font-extrabold whitespace-pre-line text-4xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {title}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full bg-background">
          <div className="container py-6">
            <div className="flex items-center gap-5">
              <img
                src={trophyThumb}
                alt="NBA Championship Trophy"
                width={1024}
                height={1024}
                loading="lazy"
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-primary font-body text-xs md:text-sm tracking-widest uppercase mb-1 font-extrabold">
                  {subtitle}
                </p>
                <h1
                  className="text-2xl md:text-5xl tracking-wider leading-[1.05] font-extrabold whitespace-pre-line"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {title}
                </h1>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container -mt-2 pb-3 flex items-center justify-center gap-2">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setVersion(i as 0 | 1)}
            aria-label={`Show header version ${i + 1}`}
            aria-current={version === i}
            className={`h-2 rounded-full transition-all ${
              version === i ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
