import { useEffect, useState } from "react";
import { cancelRide, getMyRide } from "../services/api";

const formatStatus = (status) => {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusMessage = (status) => {
  switch (status) {
    case "REQUESTED":
      return "Your ride request is waiting for a Tesla.";

    case "MATCHED":
      return "A Tesla has been matched with your ride.";

    case "DRIVER_ARRIVED":
      return "Your driver has arrived at the pickup point.";

    case "STARTED":
      return "Your ride is now in progress.";

    case "COMPLETED":
      return "Your ride has been completed.";

    case "CANCELLED":
      return "This ride has been cancelled.";

    default:
      return "Your ride status has been updated.";
  }
};

function RideDetails({ rideId, initialRide, onBack }) {
  const [ride, setRide] = useState(initialRide);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRide = async () => {
      try {
        const result = await getMyRide(rideId);
        setRide(result.ride);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadRide();
  }, [rideId]);

  const handleCancel = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this ride?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setCancelling(true);

    try {
      const result = await cancelRide(ride.id);
      setRide(result.ride);
    } catch (error) {
      setError(error.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className="ride-page">
        <div className="ride-loading">
          <div className="loading-dot" />
          <p>Loading ride...</p>
        </div>
      </main>
    );
  }

  if (!ride) {
    return (
      <main className="ride-page">
        <div className="ride-page-inner">
          <div className="state-card error-card">
            <p>Ride could not be found.</p>
          </div>
        </div>
      </main>
    );
  }

  const canCancel = ride.status === "REQUESTED" || ride.status === "MATCHED";

  return (
    <main className="ride-page">
      <div className="ride-page-inner">
        <button className="back-link" type="button" onClick={onBack}>
          <span className="back-arrow">←</span>
          <span>Dashboard</span>
        </button>

        <div className="ride-details-heading">
          <div>
            <p className="section-kicker">YOUR RIDE</p>

            <h1>
              {ride.pickup_zone_name}
              <span> → </span>
              {ride.destination_zone_name}
            </h1>
          </div>

          <span
            className={`ride-status-badge ride-status-${ride.status.toLowerCase()}`}>
            {formatStatus(ride.status)}
          </span>
        </div>

        <section className="ride-status-card">
          <div className="status-icon">
            {ride.status === "COMPLETED"
              ? "✓"
              : ride.status === "CANCELLED"
                ? "×"
                : "•"}
          </div>

          <div>
            <h2>{formatStatus(ride.status)}</h2>
            <p>{getStatusMessage(ride.status)}</p>
          </div>
        </section>

        {error && (
          <div className="ride-error">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        <div className="ride-detail-grid">
          <section className="ride-info-card">
            <p className="section-kicker">TRIP</p>

            <div className="info-row">
              <span>Pickup</span>
              <strong>{ride.pickup_zone_name}</strong>
            </div>

            <div className="info-row">
              <span>Destination</span>
              <strong>{ride.destination_zone_name}</strong>
            </div>

            <div className="info-row">
              <span>Seats</span>
              <strong>{ride.requested_seats}</strong>
            </div>
          </section>

          <section className="ride-info-card">
            <p className="section-kicker">FARE</p>

            <div className="ride-fare-large">৳{ride.fare_amount}</div>

            <div className="info-row">
              <span>Payment</span>

              <strong>
                {ride.payment_method === "CASH" ? "Cash" : "TeslaPay"}
              </strong>
            </div>

            <div className="info-row">
              <span>Payment status</span>
              <strong>{ride.payment_status}</strong>
            </div>
          </section>
        </div>

        <section className="ride-history-card">
          <div>
            <p className="section-kicker">ACTIVITY</p>
            <h2>Ride history</h2>
          </div>

          <div className="timeline">
            {ride.history?.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div className="timeline-dot" />

                <div>
                  <strong>{formatStatus(item.to_status)}</strong>

                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="ride-bottom-actions">
          {canCancel && (
            <button
              className="cancel-button"
              type="button"
              onClick={handleCancel}
              disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel ride"}
            </button>
          )}

          <button className="secondary-button" type="button" onClick={onBack}>
            Back to dashboard
          </button>
        </div>
      </div>
    </main>
  );
}

export default RideDetails;
