import trophyThumb from "@/assets/trophy-thumb.png";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

const HeroBanner = ({ title = "PLAYOFFS PICKS,\nBABY!", subtitle = "2026 Playoffs Picks" }: HeroBannerProps) => {
  return (
    <div className="relative w-full">
      <div className="w-full bg-background">
        <div className="container py-6">
          <div className="flex items-center gap-5 py-[20px]">
            <img
              src={trophyThumb}
              alt="Supreme Championship Trophy"
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
  );
};

export default HeroBanner;
