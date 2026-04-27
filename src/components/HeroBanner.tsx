import trophyThumb from "@/assets/trophy-thumb.png";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

const HeroBanner = ({ title = "PLAYOFFS PICKS", subtitle = "2026 Playoffs" }: HeroBannerProps) => {
  return (
    <div className="relative w-full">
      <div className="w-full bg-background">
        <div className="container py-6">
          <div className="flex items-stretch gap-5 py-[20px]">
            <img
              src={trophyThumb}
              alt="Supreme Championship Trophy"
              width={1024}
              height={1024}
              loading="lazy"
              className="w-[6.6rem] h-[6.6rem] md:w-[8.8rem] md:h-[8.8rem] rounded-2xl object-cover flex-shrink-0"
            />
            <div className="min-w-0 relative flex-1 flex flex-col justify-between h-[6.6rem] md:h-[8.8rem]">
              <div className="pointer-events-none absolute -left-2 right-0 top-0 h-px bg-gradient-to-r from-border/70 via-border/40 to-transparent" />
              <div className="pointer-events-none absolute -left-2 right-0 bottom-0 h-px bg-gradient-to-r from-border/70 via-border/40 to-transparent" />
              <div className="flex flex-col justify-center flex-1 py-2">
                <p className="text-primary font-body md:text-sm tracking-widest uppercase mb-1 font-extrabold text-sm">
                  {subtitle}
                </p>
                <h1
                  className="text-2xl md:text-5xl tracking-wider leading-[1.05] whitespace-pre-line"
                  style={{ fontFamily: "'Archivo Black', sans-serif" }}
                >
                  {title}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
