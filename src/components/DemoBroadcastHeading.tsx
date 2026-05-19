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
          /* Inner-shadow trick: transparent text over white background-clip, dark text-shadow shows through from the top */
          color: transparent;
          background-color: #ffffff;
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow: 0 3px 2px rgba(0, 0, 0, 0.4);
          /* Outer shadow below the letters */
          filter:
            drop-shadow(0 2px 0 rgba(0,0,0,0.55))
            drop-shadow(0 6px 14px rgba(0,0,0,0.65));
        }
      `}</style>
    </div>
  );
};

export default DemoBroadcastHeading;
