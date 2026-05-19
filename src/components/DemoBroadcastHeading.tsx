const DemoBroadcastHeading = () => {
  const style = { fontFamily: "'Claymale', 'Archivo Black', sans-serif" };
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center gap-10 bg-[#0a0a0c] rounded-md">
      <h1 className="text-center tracking-wider leading-[1.05] font-medium" style={{ ...style, fontSize: 'clamp(2.75rem, 11vw, 5.5rem)' }}>
        WESTERN<br />CONFERENCE<br />FINALS
      </h1>
      <h1 className="text-center tracking-wider leading-[1.05] font-medium" style={{ ...style, fontSize: 'clamp(2.75rem, 11vw, 5.5rem)' }}>GAMES</h1>
      <h1 className="text-center tracking-wider leading-[1.05] font-medium" style={{ ...style, fontSize: 'clamp(2.75rem, 11vw, 5.5rem)' }}>LEADERBOARD</h1>
      <h1 className="text-center tracking-wider leading-[1.05] font-medium" style={{ ...style, fontSize: 'clamp(2.75rem, 11vw, 5.5rem)' }}>MY PICKS</h1>
    </div>
  );
};

export default DemoBroadcastHeading;
