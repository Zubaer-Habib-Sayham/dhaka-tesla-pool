const stages = ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED", "COMPLETED"];
const labels = ["Requested", "On the way", "Arrived", "On your ride", "Completed"];
const messages = {
  REQUESTED: "Finding your three-wheeled ride…",
  MATCHED: "Your rickshaw is coming to pick you up.",
  DRIVER_ARRIVED: "Your rickshaw is here. Time to hop in!",
  STARTED: "On the road to your destination.",
  COMPLETED: "You’ve arrived. Thanks for sharing the ride!",
  CANCELLED: "Ride cancelled. The road will be here when you’re ready.",
};

function RideProgress({ status, pickup = "Pickup", destination = "Destination", decorative = false }) {
  const step = stages.indexOf(status);
  return <section className={`ride-progress progress-${status.toLowerCase()} ${decorative ? "decorative-progress" : ""}`} aria-label={decorative ? "Bangladeshi rickshaw illustration" : "Ride progress"}>
    {!decorative && <div className="progress-caption" aria-live="polite"><span className="live-dot" /><p>{messages[status] || "Checking ride status…"}</p><span className="schematic-label">TRIP PROGRESS</span></div>}
    <div className="rickshaw-scene" aria-hidden="true">
      <svg className="cityscape" viewBox="0 0 800 200" preserveAspectRatio="xMidYMax slice"><g fill="currentColor"><path d="M0 175V92h46v83h9V61h43v114h10V115h57v60h18V38h48v137h14V78h70v97h21V108h28v67h12V55h53v120h18V86h48v89h18V123h65v52h12V66h45v109h15V95h54v80h15V43h47v132h14V105h70v70Z" /></g><g stroke="var(--scene-window)" strokeWidth="3" strokeDasharray="5 12"><path d="M24 110v52M73 75v90M205 57v112M275 95v70M427 73v91M494 103v64M622 83v83M739 63v106" /></g><path d="M10 176h780" stroke="currentColor" strokeWidth="2" /></svg>
      <div className="scene-sun" /><span className="scene-tree tree-one">♧</span><span className="scene-tree tree-two">♧</span>
      <div className="road"><div className="road-dashes" /></div>
      <div className="moving-rickshaw"><svg className="rickshaw" viewBox="0 0 240 170">
        <ellipse cx="119" cy="155" rx="99" ry="7" fill="#163b2a" opacity=".12" />
        <g className="rickshaw-wheel"><circle cx="59" cy="129" r="26" fill="#173d31" /><circle cx="59" cy="129" r="19" fill="#f7edc9" /><path d="M59 111v36m-18-18h36m-31-13 26 26m-26 0 26-26" stroke="#678475" strokeWidth="2" /><circle cx="59" cy="129" r="4" fill="#173d31" /></g>
        <g className="rickshaw-wheel"><circle cx="188" cy="129" r="25" fill="#173d31" /><circle cx="188" cy="129" r="18" fill="#f7edc9" /><path d="M188 112v34m-17-17h34m-29-12 24 24m-24 0 24-24" stroke="#678475" strokeWidth="2" /><circle cx="188" cy="129" r="4" fill="#173d31" /></g>
        <path d="m55 124 53-6 51-19 29 30m-82-11 16-37 36 17 24 31m-38-35 19-34 20 3" fill="none" stroke="#bf342f" strokeWidth="6" strokeLinejoin="round" />
        <path d="M20 87h91l-6 32H29Z" fill="#1c7850" /><path d="M26 89h80v16H26Z" fill="#e9b84a" /><path d="M18 80h85v12H18Z" fill="#d44a3f" />
        <path d="M17 79V41Q60 0 103 41v39" fill="#1c7850" stroke="#154e39" strokeWidth="3" /><path d="M18 44Q60 6 102 44" fill="#ecbb4d" /><path d="M27 48h67v29H27Z" fill="#f4d382" /><path d="M30 76V53m60 23V53" stroke="#bc3931" strokeWidth="6" /><path d="M42 34q18-15 36 0M38 88l9 8 10-8 10 8 10-8 10 8" fill="none" stroke="#f7df91" strokeWidth="3" />
        <path d="M22 108h74" stroke="#f2c55a" strokeWidth="4" /><path d="m51 68 6-8 6 8-6 7Z" fill="#bf342f" /><circle cx="76" cy="64" r="5" fill="#bf342f" />
        <circle cx="150" cy="44" r="12" fill="#b8794d" /><path d="M139 40q2-14 19-7l5 8" fill="#243e32" /><path d="m149 58-12 25 28 5 9-21" fill="#eee4c9" stroke="#173d31" strokeWidth="2" /><path d="m155 63 15 9 13-8m-45 19 16 18-9 22m17-36 8 21-1 12" fill="none" stroke="#b8794d" strokeWidth="7" strokeLinecap="round" /><path d="m140 125 14 1m9-6 14 1" stroke="#173d31" strokeWidth="5" strokeLinecap="round" />
      </svg></div>
      <span className="scene-stop stop-pickup"><i />{pickup}</span><span className="scene-stop stop-destination"><i />{destination}</span>
    </div>
    {!decorative && <ol className="progress-steps">{labels.map((label, i) => <li key={label} className={status === "CANCELLED" ? "" : i <= step ? "reached" : ""} aria-current={i === step ? "step" : undefined}><span>{i < step ? "✓" : i + 1}</span>{label}</li>)}</ol>}
  </section>;
}
export default RideProgress;
