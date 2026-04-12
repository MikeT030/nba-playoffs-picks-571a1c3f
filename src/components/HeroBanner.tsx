import heroImage from "@/assets/hero-playoffs.jpg";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

const HeroBanner = ({ title = "NBA PLAYOFFS, BABY!", subtitle = "2026" }: HeroBannerProps) => {
  return (
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
          <p className="text-primary font-body font-semibold text-sm tracking-widest uppercase mb-2">
            {subtitle}
          </p>
          <h1 className="text-6xl md:text-8xl font-display tracking-wider leading-none">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
