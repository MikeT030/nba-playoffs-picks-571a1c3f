const DemoBroadcastHeading = () => {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center gap-10 bg-[#0a0a0c] rounded-md">
      <h1 className="broadcast-heading">
        WESTERN<br />CONFERENCE<br />FINALS
      </h1>
      <h1 className="broadcast-heading">GAMES</h1>
      <h1 className="broadcast-heading">LEADERBOARD</h1>
      <h1 className="broadcast-heading">MY PICKS</h1>

      <svg
        aria-hidden="true"
        width="0"
        height="0"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter id="broadcast-inner-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feOffset in="blur" dy="6" result="offsetBlur" />
            <feComposite
              in="offsetBlur"
              in2="SourceAlpha"
              operator="arithmetic"
              k2="-1"
              k3="1"
              result="innerShadow"
            />
            <feColorMatrix
              in="innerShadow"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.85 0"
              result="innerShadowColored"
            />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="innerShadowColored" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <style>{`
        .broadcast-heading {
          font-family: 'Saira Extra Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(2.75rem, 11vw, 5.5rem);
          line-height: 0.92;
          letter-spacing: 0.005em;
          text-transform: uppercase;
          text-align: center;
          margin: 0;
          color: #ffffff;
          filter:
            url(#broadcast-inner-shadow)
            drop-shadow(0 2px 0 rgba(0, 0, 0, 0.55))
            drop-shadow(0 6px 14px rgba(0, 0, 0, 0.5));
        }
      `}</style>
    </div>
  );
};

export default DemoBroadcastHeading;
