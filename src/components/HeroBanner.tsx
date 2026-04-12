import heroImage from "@/assets/hero-playoffs.jpg";

const HeroBanner = () => {
  return (
    <div className="relative w-full h-[50vh] min-h-[360px] overflow-hidden">
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
            2025 Season
          </p>
          <h1 className="text-6xl md:text-8xl font-display tracking-wider leading-none">
            NBA PLAYOFFS
          </h1>
          <p className="text-muted-foreground font-body text-lg mt-2">
            Betting game — pick your winners, brag to your buddies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
