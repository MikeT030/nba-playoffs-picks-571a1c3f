const DemoBroadcastHeading = () => {
  return (
    <div className="py-12 px-4 flex items-center justify-center bg-gradient-to-b from-[#05070d] via-[#0a1226] to-[#020308] rounded-md">
      <h1 className="broadcast-heading">
        WESTERN<br />CONFERENCE<br />FINALS
      </h1>
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
          background: linear-gradient(
            to bottom,
            #f4f6fa 0%,
            #ffffff 28%,
            #b8bdc7 52%,
            #ffffff 78%,
            #e8ebf0 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          /* Glow/shadow emanates UPWARD from the top of the letters (light source below) */
          filter:
            drop-shadow(0 -1px 0 rgba(255,255,255,0.6))
            drop-shadow(0 -3px 2px rgba(220,230,255,0.4))
            drop-shadow(0 -8px 12px rgba(170,195,255,0.32))
            drop-shadow(0 -16px 24px rgba(120,160,230,0.22))
            drop-shadow(0 2px 0 rgba(0,0,0,0.55))
            drop-shadow(0 6px 14px rgba(0,0,0,0.65));
        }
      `}</style>
    </div>
  );
};

export default DemoBroadcastHeading;
