import { useState, useEffect, useCallback } from "react";
import heroImage1 from "@/assets/hero-playoffs.jpg";
import heroImage2 from "@/assets/hero-playoffs-2.jpg";
import heroImage3 from "@/assets/hero-playoffs-3.jpg";

const defaultSlides = [
  { image: heroImage1, title: "NBA PLAYOFFS,\nBABY!", subtitle: "2026" },
  { image: heroImage2, title: "WHO'S TAKING\nTHE CROWN?", subtitle: "MAKE YOUR PICKS" },
  { image: heroImage3, title: "EVERY BUCKET\nCOUNTS", subtitle: "PLAYOFF MODE" },
];

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

const HeroBanner = ({ title, subtitle }: HeroBannerProps) => {
  const isCarousel = !title && !subtitle;
  const slides = isCarousel
    ? defaultSlides
    : [{ image: heroImage1, title: title!, subtitle: subtitle! }];

  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!isCarousel) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, isCarousel]);

  return (
    <div className="relative w-full h-[27.5vh] min-h-[198px] overflow-hidden">
      {slides.map((slide, i) => (
        <img
          key={i}
          src={slide.image}
          alt={`NBA Playoffs – ${slide.subtitle}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
          width={1920}
          height={800}
          {...(i === 0 ? {} : { loading: "lazy" as const })}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      <div className="absolute inset-0 flex items-end">
        <div className="container pb-10">
          <p className="text-primary font-body text-sm tracking-widest uppercase mb-2 font-extrabold">
            {slides[active].subtitle}
          </p>
          <h1
            className="md:text-8xl tracking-wider leading-none font-extrabold text-5xl whitespace-pre-line"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {slides[active].title}
          </h1>

          {isCarousel && (
            <div className="flex gap-2 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-6 bg-primary"
                      : "w-2 bg-foreground/40 hover:bg-foreground/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
