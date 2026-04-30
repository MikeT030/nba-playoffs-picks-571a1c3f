interface HeroBannerMinimalProps {
  title: string;
}

/**
 * Minimal hero header variant.
 * - No trophy thumbnail, no subtitle, no divider lines.
 * - Just a large H1 on the page background.
 * - Generous top padding so the title clears the fixed top-right avatar.
 * - H1 typography matches HeroBanner (Claymale display font).
 */
const HeroBannerMinimal = ({ title }: HeroBannerMinimalProps) => {
  return (
    <div className="w-full bg-background">
      <div className="container pt-20 pb-6">
        <h1
          className="md:text-6xl tracking-wider leading-[1.05] whitespace-pre-line text-5xl font-medium"
          style={{ fontFamily: "'Claymale', 'Archivo Black', sans-serif" }}
        >
          {title}
        </h1>
      </div>
    </div>
  );
};

export default HeroBannerMinimal;
