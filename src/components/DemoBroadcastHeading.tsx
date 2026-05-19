const DemoBroadcastHeading = () => {
  return (
    <div className="py-8 px-4 flex items-center justify-center bg-gradient-to-b from-[#0a0e1a] to-[#1a2236] rounded-md">
      <h1 className="broadcast-heading">GAME ON</h1>
      <style>{`
        .broadcast-heading {
          font-family: 'Saira Extra Condensed', sans-serif;
          font-weight: 900;
          font-style: italic;
          font-size: clamp(3.5rem, 14vw, 7rem);
          line-height: 0.9;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          margin: 0;
          background: linear-gradient(
            to bottom,
            #ffffff 0%,
            #ffffff 18%,
            #a8adb8 50%,
            #ffffff 82%,
            #ffffff 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          filter:
            drop-shadow(0 1px 0 rgba(255,255,255,0.4))
            drop-shadow(0 2px 0 #1a1f2e)
            drop-shadow(0 4px 0 #0f1320)
            drop-shadow(0 6px 0 #080a14)
            drop-shadow(0 12px 18px rgba(0,0,0,0.7));
        }
      `}</style>
    </div>
  );
};

export default DemoBroadcastHeading;
