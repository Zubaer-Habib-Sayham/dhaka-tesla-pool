import { useEffect, useState } from "react";
import { getMyRides } from "../services/api";
import { getCurrentUser, logout } from "../services/auth";

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

function PassengerDashboard({ onLogout, onRequestRide, onRideClick }) {
  const user = getCurrentUser();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRides = async () => {
      try {
        const result = await getMyRides();
        setRides(result.rides || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadRides();
  }, []);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="brand">Dhaka Tesla Pool</p>
          <p className="tagline">
            Share a seat. Split the fare. Survive Dhaka traffic.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <p className="eyebrow">Passenger dashboard</p>
          <h1>Good to see you, {user?.name}.</h1>
          <p>Find a Tesla, share the ride, and keep track of your trips.</p>

          <button
            className="primary-button"
            type="button"
            onClick={onRequestRide}>
            Request a ride
          </button>
        </section>

        <section className="rides-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Your rides</h2>
            </div>
          </div>

          {loading && (
            <div className="state-card">
              <p>Loading your rides...</p>
            </div>
          )}

          {!loading && error && (
            <div className="state-card error-card">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && rides.length === 0 && (
            <div className="state-card">
              <h3>No rides yet</h3>
              <p>
                Your completed, active, and cancelled rides will appear here.
              </p>
            </div>
          )}

          {!loading && !error && rides.length > 0 && (
            <div className="ride-list">
              {rides.map((ride) => (
                <button
                  className="ride-card"
                  key={ride.id}
                  type="button"
                  onClick={() => onRideClick(ride)}>
                  <div className="ride-route">
                    <div>
                      <span>Pickup</span>
                      <strong>{ride.pickup_zone_name}</strong>
                    </div>

                    <div className="route-arrow">→</div>

                    <div>
                      <span>Destination</span>
                      <strong>{ride.destination_zone_name}</strong>
                    </div>
                  </div>

                  <div className="ride-details">
                    <span>{ride.requested_seats} seat(s)</span>
                    <span>৳{ride.fare_amount}</span>
                    <span>{formatDate(ride.created_at)}</span>
                  </div>

                  <div className="ride-footer">
                    <span
                      className={`status status-${ride.status.toLowerCase()}`}>
                      {formatStatus(ride.status)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PassengerDashboard;
