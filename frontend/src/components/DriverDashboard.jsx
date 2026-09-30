import { useEffect, useState } from "react";
import { getDriverProfile, getDriverRequests, getDriverRides, setDriverAvailability, updateDriverRide } from "../services/api";
import { getCurrentUser } from "../services/auth";
import RideProgress from "./RideProgress";
const isActive = (ride) => !["COMPLETED", "CANCELLED"].includes(ride.status);
const statusLabel = (status) => ({ MATCHED: "On the way", DRIVER_ARRIVED: "At pickup", STARTED: "In progress", COMPLETED: "Completed", CANCELLED: "Cancelled", REQUESTED: "Waiting" })[status] || status;
const nextActions = { MATCHED: ["arrive", "Mark arrival"], DRIVER_ARRIVED: ["start", "Start ride"], STARTED: ["complete", "Complete ride"] };
const tripDate = (date) => new Date(date).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
function Route({ ride }) {
  return <div className="ride-route"><div><span>Pickup</span><strong>{ride.pickup_zone_name}</strong></div><div className="route-arrow">→</div><div><span>Drop-off</span><strong>{ride.destination_zone_name}</strong></div></div>;
}
function DriverDashboard({ onLogout }) {
  const user = getCurrentUser();
  const [driver, setDriver] = useState(null);
  const [rides, setRides] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState("");
  const loadDashboard = async () => {
    const [profile, assigned, waiting] = await Promise.all([getDriverProfile(), getDriverRides(), getDriverRequests()]);
    setDriver(profile.driver); setRides(assigned.rides || []); setRequests(waiting.rides || []); setError("");
  };
  useEffect(() => {
    let disposed = false;
    let fetching = false;
    const refresh = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const [profile, assigned, waiting] = await Promise.all([getDriverProfile(), getDriverRides(), getDriverRequests()]);
        if (!disposed) { setDriver(profile.driver); setRides(assigned.rides || []); setRequests(waiting.rides || []); setError(""); }
      } catch (error) { if (!disposed) setError(error.message); }
      finally { fetching = false; if (!disposed) setLoading(false); }
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { disposed = true; clearInterval(timer); };
  }, []);
  const perform = async (key, action, message) => {
    setBusy(key); setError(""); setNotice("");
    try { await action(); setNotice(message); await loadDashboard(); }
    catch (error) { setError(error.message); }
    finally { setBusy(null); }
  };
  const activeRides = rides.filter(isActive);
  const completed = rides.filter((r) => r.status === "COMPLETED");
  const history = rides.filter((r) => !isActive(r));
  const occupied = activeRides.reduce((sum, r) => sum + Number(r.requested_seats), 0);
  const online = driver?.tesla_status === "ONLINE";
  return <div className="dashboard">
    <header className="dashboard-header"><div className="brand"><span className="brand-mark">dtp<span>↗</span></span>Dhaka Tesla Pool</div><div className="header-actions"><div className="user-chip"><span className="avatar">{user?.name?.[0]}</span><div>{user?.name}<small>Driver account</small></div></div><button className="secondary-button" onClick={onLogout}>Log out</button></div></header>
    <main className="dashboard-content">
      <div className="dashboard-title"><div><p className="eyebrow">DRIVER DASHBOARD / DHAKA</p><h1>Your day on the road, {user?.name?.split(" ")[0]}.</h1><p>Pick up your passengers. Keep the city moving.</p></div><button className={`availability ${online ? "online" : ""}`} role="switch" aria-checked={online} disabled={loading || busy !== null || !driver} onClick={() => perform("availability", () => setDriverAvailability(!online), online ? "You are now offline." : "You are online and ready for rides.")}><span className="live-dot" style={{ background: online ? "#63944d" : "#b3baac" }} />{busy === "availability" ? "Updating…" : online ? "You’re online" : "You’re offline"}<i /></button></div>
      <div className="stats-grid"><div className="stat"><span>Your rickshaw</span><strong>{driver?.tesla_name || "—"}</strong><small>{driver ? `${driver.capacity} seats` : ""}</small></div><div className="stat"><span>Seats on active rides</span><strong>{occupied}<small>/ {driver?.capacity || "—"}</small></strong></div><div className="stat"><span>Completed rides</span><strong>{completed.length}</strong></div><div className="stat"><span>Completed fares · all time</span><strong>৳{completed.reduce((sum, r) => sum + Number(r.fare_amount), 0)}</strong></div></div>
      {error && <div className="ride-error" role="alert"><span>!</span><p>{error}</p><button className="text-button" disabled={busy !== null} onClick={() => perform("refresh", loadDashboard, "Dashboard refreshed.")}>Retry</button></div>}
      {notice && <p className="action-notice" role="status">✓ {notice}</p>}
      {loading ? <div className="state-card">Loading your dashboard…</div> : <div className="driver-grid">
        <section><div className="section-heading"><div><p className="eyebrow">ON YOUR RICKSHAW</p><h2>Active rides <span className="count-badge">{activeRides.length}</span></h2></div><button className="refresh-button" disabled={busy !== null} onClick={() => perform("refresh", loadDashboard, "Dashboard refreshed.")}>↻ Refresh</button></div>
          {activeRides.length === 0 && <div className="empty-state"><span className="empty-symbol">◎</span><h3>Your next ride is waiting</h3><p>{online ? "Accept a request to see your passengers here." : "Go online to start accepting ride requests."}</p></div>}
          {activeRides.map((ride) => <article key={ride.id} className="driver-ride-card"><div className="driver-card-top"><div className="passenger-label"><span className="avatar">{ride.passenger_name?.[0]}</span><div>{ride.passenger_name}<small>Ride #{ride.id} · {ride.requested_seats} seat{Number(ride.requested_seats) === 1 ? "" : "s"}</small></div></div><span className={`status status-${ride.status.toLowerCase()}`}>{statusLabel(ride.status)}</span></div>
            <Route ride={ride} /><RideProgress status={ride.status} pickup={ride.pickup_zone_name} destination={ride.destination_zone_name} />
            <div className="driver-ride-meta"><span className="pool-label">Pool #{ride.pool_id}</span><span>{ride.payment_method === "CASH" ? "Cash" : "TeslaPay"} · {ride.payment_status.toLowerCase()}</span><strong>৳{ride.fare_amount}</strong></div>
            <div className="driver-card-actions"><span>{ride.status === "MATCHED" ? "Head to your passenger’s pickup." : ride.status === "DRIVER_ARRIVED" ? "Ready when your passenger is on board." : "Mark complete at their destination."}</span>{nextActions[ride.status] && <button className="primary-button" disabled={busy !== null || !online} onClick={() => perform(ride.id, () => updateDriverRide(ride.id, nextActions[ride.status][0]), `${ride.passenger_name}’s ride updated.`)}>{busy === ride.id ? "Updating…" : nextActions[ride.status][1]} →</button>}</div>
          </article>)}
        </section>
        <aside className="requests-panel"><div className="section-heading"><div><p className="eyebrow">READY TO GO</p><h2>Ride requests <span className="count-badge">{requests.length}</span></h2></div></div>{!online && <p className="offline-note">You’re offline. Go online to accept a ride.</p>}
          {requests.length === 0 && <div className="empty-state"><h3>All caught up</h3><p>New requests appear here automatically.</p></div>}
          {requests.map((ride) => <article className="request-card" key={ride.id}><div className="passenger-label"><span className="avatar">{ride.passenger_name?.[0]}</span><div>{ride.passenger_name}<small>{ride.requested_seats} seat{Number(ride.requested_seats) === 1 ? "" : "s"} · {(ride.share_ride ?? ride.shareRide) ? "Shared ride" : "Private ride"}</small></div></div><Route ride={ride} /><div className="driver-ride-meta"><span>{ride.payment_method === "CASH" ? "Cash" : "TeslaPay"}</span><strong>৳{ride.fare_amount}</strong></div><button className="primary-button" disabled={!online || busy !== null || Number(ride.requested_seats) > Number(driver?.capacity) - occupied} onClick={() => perform(ride.id, () => updateDriverRide(ride.id, "accept"), `${ride.passenger_name} added to your active rides.`)}>{busy === ride.id ? "Accepting…" : Number(ride.requested_seats) > Number(driver?.capacity) - occupied ? "Not enough seats" : "Accept ride ↗"}</button></article>)}
        </aside>
      </div>}
      <section className="history-section"><div className="section-heading"><div><p className="eyebrow">YOUR ROAD SO FAR</p><h2>Ride history</h2></div><span className="pool-label">{history.length} trips</span></div>{history.length === 0 ? <div className="empty-state"><p>Completed and cancelled rides will appear here.</p></div> : <div className="history-list">{history.map((ride) => <div key={ride.id} className="history-row"><div><strong>{ride.passenger_name} · {ride.pickup_zone_name} → {ride.destination_zone_name}</strong><p>Pool #{ride.pool_id} · {tripDate(ride.updated_at)}</p></div><div className="history-fare"><strong>৳{ride.fare_amount}</strong><span className={`status status-${ride.status.toLowerCase()}`}>{statusLabel(ride.status)}</span></div></div>)}</div>}</section>
    </main>
  </div>;
}
export default DriverDashboard;
