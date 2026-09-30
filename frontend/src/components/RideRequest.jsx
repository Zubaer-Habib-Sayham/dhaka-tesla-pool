import { useEffect, useState } from "react";
import { createRide, estimateFare, getZones } from "../services/api";
import CustomSelect from "./CustomSelect";

function RideRequest({ onBack, onRideCreated }) {
  const [zones, setZones] = useState([]);

  const [pickupZoneId, setPickupZoneId] = useState("");
  const [destinationZoneId, setDestinationZoneId] = useState("");
  const [requestedSeats, setRequestedSeats] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [shareRide, setShareRide] = useState(true);

  const [fare, setFare] = useState(null);

  const [loadingZones, setLoadingZones] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadZones = async () => {
      try {
        const result = await getZones();
        setZones(result.zones || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoadingZones(false);
      }
    };

    loadZones();
  }, []);

  const zoneOptions = zones.map((zone) => ({
    value: zone.id,
    label: zone.name,
  }));

  const seatOptions = [
    { value: "1", label: "1 seat" },
    { value: "2", label: "2 seats" },
    { value: "3", label: "3 seats" },
  ];

  const paymentOptions = [
    { value: "CASH", label: "Cash" },
    { value: "TESLAPAY", label: "TeslaPay" },
  ];

  const handleEstimate = async () => {
    setError("");
    setFare(null);

    if (!pickupZoneId || !destinationZoneId) {
      setError("Please select both pickup and destination.");
      return;
    }

    if (pickupZoneId === destinationZoneId) {
      setError("Pickup and destination must be different zones.");
      return;
    }

    setEstimating(true);

    try {
      const result = await estimateFare({
        pickupZoneId,
        destinationZoneId,
        requestedSeats,
        shareRide,
      });

      setFare(result.fare);
    } catch (error) {
      setError(error.message);
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!pickupZoneId || !destinationZoneId) {
      setError("Please select both pickup and destination.");
      return;
    }

    if (!fare) {
      setError("Please calculate your fare first.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createRide({
        pickupZoneId,
        destinationZoneId,
        requestedSeats,
        paymentMethod,
        shareRide,
      });

      onRideCreated({ ...result.ride,
        pickup_zone_name: result.pickupZone?.name || zones.find((z) => String(z.id) === String(pickupZoneId))?.name,
        destination_zone_name: result.destinationZone?.name || zones.find((z) => String(z.id) === String(destinationZoneId))?.name,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="ride-page">
      <div className="ride-page-inner">
        <button className="back-link" type="button" onClick={onBack}>
          <span className="back-arrow">←</span>
          <span>Dashboard</span>
        </button>

        <div className="ride-page-heading">
          <p className="section-kicker">REQUEST A RIDE</p>
          <h1>Where are you going?</h1>
          <p>Choose your route and we'll calculate your estimated fare.</p>
        </div>

        <div className="ride-builder">
          <section className="route-panel">
            <div className="panel-heading">
              <div className="panel-icon">↗</div>

              <div>
                <p className="section-kicker">YOUR ROUTE</p>
                <h2>Trip details</h2>
              </div>
            </div>

            <div className="route-fields">
              <div className="route-line">
                <div className="route-node pickup-node" />

                <CustomSelect
                  label="Pickup"
                  value={pickupZoneId}
                  options={zoneOptions}
                  placeholder={
                    loadingZones ? "Loading zones..." : "Choose pickup"
                  }
                  onChange={(value) => {
                    setPickupZoneId(value);
                    setFare(null);
                  }}
                  disabled={loadingZones || estimating || submitting}
                />
              </div>

              <div className="route-connector" />

              <div className="route-line">
                <div className="route-node destination-node" />

                <CustomSelect
                  label="Destination"
                  value={destinationZoneId}
                  options={zoneOptions}
                  placeholder={
                    loadingZones ? "Loading zones..." : "Choose destination"
                  }
                  onChange={(value) => {
                    setDestinationZoneId(value);
                    setFare(null);
                  }}
                  disabled={loadingZones || estimating || submitting}
                />
              </div>
            </div>

            <div className="trip-options">
              <CustomSelect
                label="Seats"
                value={requestedSeats}
                options={seatOptions}
                placeholder="Choose seats"
                disabled={estimating || submitting}
                onChange={(value) => {
                  setRequestedSeats(value);
                  setFare(null);
                }}
              />

              <CustomSelect
                label="Payment"
                value={paymentMethod}
                options={paymentOptions}
                placeholder="Choose payment"
                disabled={submitting}
                onChange={setPaymentMethod}
              />
            </div>

            <div className="payment-choice"><label><input type="checkbox" checked={shareRide} disabled={estimating || submitting} onChange={(event) => { setShareRide(event.target.checked); setFare(null); }} />Share my rickshaw</label><p>Save ৳20 by choosing a shared ride. Uncheck for a private ride.</p></div>

            {error && (
              <div className="ride-error" role="alert">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              className="estimate-button"
              type="button"
              onClick={handleEstimate}
              disabled={estimating || loadingZones || submitting}>
              {estimating ? "Calculating..." : "Calculate estimated fare"}
            </button>
          </section>

          <aside className="fare-panel">
            <div className="fare-panel-top">
              <p className="section-kicker">ESTIMATED FARE</p>

              {fare ? (
                <>
                  <div className="fare-amount">৳{fare.fareAmount}</div>

                  <p className="fare-caption">
                    Estimated for your selected route.
                  </p>
                </>
              ) : (
                <div className="fare-placeholder">—</div>
              )}
            </div>

            {fare && (
              <>
                <div className="fare-breakdown">
                  <div>
                    <span>Base fare</span>
                    <strong>৳{fare.baseFare}</strong>
                  </div>

                  <div>
                    <span>Distance charge</span>
                    <strong>৳{fare.distanceCharge}</strong>
                  </div>

                  <div>
                    <span>Distance</span>
                    <strong>{fare.distanceKm} km</strong>
                  </div>

                  <div>
                    <span>Pool discount</span>
                    <strong>-৳{fare.poolDiscount}</strong>
                  </div>
                </div>

                <div className="fare-divider" />

                <div className="ride-summary">
                  <span>Payment</span>
                  <strong>
                    {paymentMethod === "CASH" ? "Cash" : "TeslaPay"}
                  </strong>
                </div>

                <button
                  className="request-button"
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}>
                  {submitting ? "Requesting..." : "Request this ride"}
                </button>

                <p className="fare-note">
                  Your fare is confirmed when you request the ride.
                </p>
              </>
            )}

            {!fare && (
              <p className="fare-note">
                Select your route and calculate the fare to continue.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default RideRequest;
