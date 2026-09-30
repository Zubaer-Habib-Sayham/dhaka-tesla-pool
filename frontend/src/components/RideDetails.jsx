import { useEffect, useState } from "react";
import { cancelRide, getMyRide } from "../services/api";
import RideProgress from "./RideProgress";
const formatStatus = (status) => ({ REQUESTED: "Requested", MATCHED: "On the way", DRIVER_ARRIVED: "Driver arrived", STARTED: "In progress", COMPLETED: "Completed", CANCELLED: "Cancelled" })[status] || status;
const formatDate = (date) => new Date(date).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });
function RideDetails({ rideId, initialRide, onBack }) {
  const [ride, setRide] = useState(initialRide);
  const [history, setHistory] = useState(initialRide?.history || []);
  const [loading, setLoading] = useState(!initialRide);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false;
    let fetching = false;
    const refresh = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const result = await getMyRide(rideId);
        if (!disposed) { setRide(result.ride); setHistory(result.history || []); setError(""); }
      } catch (error) { if (!disposed) setError(error.message); }
      finally { fetching = false; if (!disposed) setLoading(false); }
    };
    refresh(); const timer = setInterval(refresh, 3000);
    return () => { disposed = true; clearInterval(timer); };
  }, [rideId, retry]);
  const handleCancel = async () => {
    if (!window.confirm("Cancel this ride?")) return;
    setError(""); setCancelling(true);
    try {
      const result = await cancelRide(ride.id);
      setRide((previous) => ({ ...previous, ...result.ride }));
      const updated = await getMyRide(rideId); setRide(updated.ride); setHistory(updated.history || []);
    } catch (error) { setError(error.message); }
    finally { setCancelling(false); }
  };
  return <main className="ride-page"><div className="ride-page-inner">
    <button className="back-link" onClick={onBack}>← Dashboard</button>
    {loading && <div className="ride-loading"><div className="loading-dot" /><p>Loading ride…</p></div>}
    {error && <div className="ride-error" role="alert"><p>{error}</p><button className="text-button" onClick={() => setRetry((n) => n + 1)}>Retry</button></div>}
    {!loading && ride && <>
      <div className="ride-details-heading"><div><p className="section-kicker">YOUR RIDE / #{ride.id}</p><h1>{ride.pickup_zone_name}<span> → </span>{ride.destination_zone_name}</h1></div><span className={`ride-status-badge ride-status-${ride.status.toLowerCase()}`}>{formatStatus(ride.status)}</span></div>
      <RideProgress status={ride.status} pickup={ride.pickup_zone_name} destination={ride.destination_zone_name} />
      <div className="ride-detail-grid"><section className="ride-info-card"><p className="section-kicker">YOUR TRIP</p><div className="info-row"><span>Pickup</span><strong>{ride.pickup_zone_name}</strong></div><div className="info-row"><span>Destination</span><strong>{ride.destination_zone_name}</strong></div><div className="info-row"><span>Seats</span><strong>{ride.requested_seats} · {ride.share_ride ? "Shared ride" : "Private ride"}</strong></div><div className="info-row"><span>Rickshaw</span><strong>{ride.tesla_name || "Waiting for a driver"}</strong></div>{ride.driver_name && <div className="info-row"><span>Driver</span><strong>{ride.driver_name}</strong></div>}{ride.pool_id && <div className="info-row"><span>Pool</span><strong>#{ride.pool_id}</strong></div>}</section>
        <section className="ride-info-card"><p className="section-kicker">YOUR FARE</p><div className="ride-fare-large">৳{ride.fare_amount}</div><div className="info-row"><span>Payment</span><strong>{ride.payment_method === "CASH" ? "Cash" : "TeslaPay"}</strong></div><div className="info-row"><span>Payment status</span><strong>{ride.payment_status === "PAID" ? "Paid" : "Pending"}</strong></div><div className="info-row"><span>Booked</span><strong>{formatDate(ride.created_at)}</strong></div></section></div>
      <section className="ride-history-card"><p className="section-kicker">ACTIVITY</p><h2>Your trip, step by step</h2><div className="timeline">{history.map((item) => <div className="timeline-item" key={item.id}><div className="timeline-dot" /><div><strong>{formatStatus(item.to_status)}</strong><span>{formatDate(item.created_at)}</span></div></div>)}</div></section>
      <div className="ride-bottom-actions">{["REQUESTED", "MATCHED"].includes(ride.status) && <button className="cancel-button" onClick={handleCancel} disabled={cancelling}>{cancelling ? "Cancelling…" : "Cancel ride"}</button>}<button className="secondary-button" onClick={onBack}>Back to dashboard</button></div>
    </>}
    {!loading && !ride && !error && <div className="state-card">This ride could not be found.</div>}
  </div></main>;
}
export default RideDetails;
