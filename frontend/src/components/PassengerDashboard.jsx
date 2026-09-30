import { useEffect, useState } from "react";
import { getMyRides } from "../services/api";
import { getCurrentUser } from "../services/auth";
const formatStatus = (status) => ({ REQUESTED: "Finding a ride", MATCHED: "Rickshaw on the way", DRIVER_ARRIVED: "Driver arrived", STARTED: "In progress", COMPLETED: "Completed", CANCELLED: "Cancelled" })[status] || status;
const date = (value) => new Date(value).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
function PassengerDashboard({ onLogout, onRequestRide, onRideClick }) {
  const user = getCurrentUser();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false;
    let fetching = false;
    const refresh = async () => {
      if (fetching) return;
      fetching = true;
      try { const result = await getMyRides(); if (!disposed) { setRides(result.rides || []); setError(""); } }
      catch (error) { if (!disposed) setError(error.message); }
      finally { fetching = false; if (!disposed) setLoading(false); }
    };
    refresh(); const timer = setInterval(refresh, 5000);
    return () => { disposed = true; clearInterval(timer); };
  }, [retry]);
  const activeRides = rides.filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status));
  const previous = rides.filter((r) => ["COMPLETED", "CANCELLED"].includes(r.status));
  const cards = (items) => <div className="ride-list">{items.map((ride) => <button className="ride-card" key={ride.id} onClick={() => onRideClick(ride)}>
    <div className="ride-route"><div><span>Pickup</span><strong>{ride.pickup_zone_name}</strong></div><div className="route-arrow">→</div><div><span>Drop-off</span><strong>{ride.destination_zone_name}</strong></div></div>
    <div className="ride-details"><span>{ride.requested_seats} seat{Number(ride.requested_seats) === 1 ? "" : "s"}</span><strong>৳{ride.fare_amount}</strong><span>{date(ride.created_at)}</span>{ride.pool_id && <span>Pool #{ride.pool_id}</span>}</div>
    <div className="ride-footer"><span className={`status status-${ride.status.toLowerCase()}`}>{formatStatus(ride.status)}</span><span>View trip ↗</span></div>
  </button>)}</div>;
  return <div className="dashboard">
    <header className="dashboard-header"><div className="brand"><span className="brand-mark">dtp<span>↗</span></span>Dhaka Tesla Pool</div><div className="header-actions"><div className="user-chip"><span className="avatar">{user?.name?.[0]}</span><div>{user?.name}<small>Passenger account</small></div></div><button className="secondary-button" onClick={onLogout}>Log out</button></div></header>
    <main className="dashboard-content">
      <div className="dashboard-title"><div><p className="eyebrow">PASSENGER DASHBOARD / DHAKA</p><h1>Let’s get you there, {user?.name?.split(" ")[0]}.</h1><p>Your rides, all in one place.</p></div><button className="primary-button" disabled={loading || Boolean(error)} onClick={activeRides.length ? () => onRideClick(activeRides[0]) : onRequestRide}>{activeRides.length ? "Track your ride ↗" : "Request a ride ↗"}</button></div>
      {error && <div className="ride-error" role="alert"><p>{error}</p><button className="text-button" onClick={() => setRetry((n) => n + 1)}>Retry</button></div>}
      {loading && <div className="state-card">Loading your rides…</div>}
      {!loading && !error && <>
        <section className="rides-section"><div className="section-heading"><div><p className="eyebrow">RIGHT NOW</p><h2>Your active ride <span className="count-badge">{activeRides.length}</span></h2></div><span className="pool-label">Updates automatically</span></div>
          {activeRides.length ? cards(activeRides) : <div className="welcome-section"><div><h2>A seat with your name on it.</h2><p>Choose your pickup, destination, and seats. We’ll take it from there.</p></div><button className="primary-button" onClick={onRequestRide}>Find a rickshaw →</button></div>}
        </section>
        <section className="history-section"><div className="section-heading"><div><p className="eyebrow">YOUR ROAD SO FAR</p><h2>Ride history</h2></div><span className="pool-label">{previous.length} trips</span></div>{previous.length ? cards(previous) : <div className="empty-state"><span className="empty-symbol">↗</span><h3>Your story starts here</h3><p>Your completed and cancelled rides will appear here.</p></div>}</section>
      </>}
    </main>
  </div>;
}
export default PassengerDashboard;
