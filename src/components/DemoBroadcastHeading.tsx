const DemoBroadcastHeading = () => {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center gap-10 bg-[#0a0a0c] rounded-md">
      <h1 className="broadcast-heading">
        WESTERN<br />CONFERENCE<br />FINALS
      </h1>
      <h1 className="broadcast-heading">GAMES</h1>
      <h1 className="broadcast-heading">LEADERBOARD</h1>
      <h1 className="broadcast-heading">MY PICKS</h1>
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
          /* Inner-shadow trick: transparent text over white background-clip, then a dark text-shadow shows through from the top */
          background: linear-gradient(
            to bottom,
            #d8dce4 0%,
            #eef0f3 30%,
            #c2c6cf 55%,
            #e4e7ec 80%,
            #cfd3da 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow:
            0 6px 10px rgba(0, 0, 0, 0.28),
            0 14px 22px rgba(0, 0, 0, 0.18);
          /* Outer shadows below the letters + subtle upward glow */
          filter:
            drop-shadow(0 -1px 0 rgba(255,255,255,0.5))
            drop-shadow(0 -8px 12px rgba(170,195,255,0.22))
            drop-shadow(0 -16px 24px rgba(120,160,230,0.16))
            drop-shadow(0 2px 0 rgba(0,0,0,0.55))
            drop-shadow(0 6px 14px rgba(0,0,0,0.65));
        }
      `}</style>
    </div>
  );
};

export default DemoBroadcastHeading;
