import pool from "../config/database.js";
import { validateRideTransition } from "../services/ride-state.service.js";

export const cancelOwnedRide = async ({ rideId, passengerId }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Ownership is included even in the lock lookup; strangers cannot affect a pool.
    const assigned = await client.query(
      `SELECT t.id, p.id AS pool_id FROM teslas t
       JOIN pools p ON p.tesla_id = t.id
       JOIN pool_members pm ON pm.pool_id = p.id
       JOIN rides r ON r.id = pm.ride_id
       WHERE r.id = $1 AND r.passenger_id = $2 FOR UPDATE OF t`,
      [rideId, passengerId],
    );
    const result = await client.query("SELECT * FROM rides WHERE id = $1 AND passenger_id = $2 FOR UPDATE", [rideId, passengerId]);
    const ride = result.rows[0];
    if (!ride) {
      const error = new Error("Ride not found.");
      error.statusCode = 404; error.code = "RIDE_NOT_FOUND"; throw error;
    }
    // A concurrent acceptance may have attached a previously unassigned ride.
    // Retry rather than acquiring the vehicle in reverse lock order.
    if (!assigned.rowCount) {
      const membership = await client.query("SELECT id FROM pool_members WHERE ride_id = $1", [rideId]);
      if (membership.rowCount) {
        const error = new Error("Ride was just accepted. Please try cancelling again.");
        error.statusCode = 409; error.code = "RIDE_CHANGED"; throw error;
      }
    }
    validateRideTransition(ride.status, "CANCELLED");
    const updated = await client.query("UPDATE rides SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *", [rideId]);
    await client.query(
      "INSERT INTO ride_status_history (ride_id, from_status, to_status, changed_by) VALUES ($1, $2, 'CANCELLED', $3)",
      [rideId, ride.status, passengerId],
    );
    if (assigned.rowCount) {
      await client.query(
        `UPDATE pools p SET status = CASE WHEN EXISTS (
           SELECT 1 FROM pool_members pm JOIN rides r ON r.id = pm.ride_id
           WHERE pm.pool_id = p.id AND r.status = 'COMPLETED'
         ) THEN 'COMPLETED' ELSE 'CANCELLED' END, updated_at = NOW()
         WHERE p.id = $1 AND NOT EXISTS (
           SELECT 1 FROM pool_members pm JOIN rides r ON r.id = pm.ride_id
           WHERE pm.pool_id = p.id AND r.status IN ('MATCHED', 'DRIVER_ARRIVED', 'STARTED')
         )`,
        [assigned.rows[0].pool_id],
      );
    }
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK"); throw error;
  } finally { client.release(); }
};

export const createRide = async ({
  passengerId,
  pickupZoneId,
  destinationZoneId,
  requestedSeats,
  shareRide,
  fareAmount,
  paymentMethod,
}) => {
  const result = await pool.query(
    `INSERT INTO rides (
      passenger_id,
      pickup_zone_id,
      destination_zone_id,
      requested_seats,
      share_ride,
      status,
      fare_amount,
      payment_method,
      payment_status
    )
    VALUES ($1, $2, $3, $4, $5, 'REQUESTED', $6, $7, 'PENDING')
    RETURNING
      id,
      passenger_id,
      pickup_zone_id,
      destination_zone_id,
      requested_seats,
      share_ride,
      status,
      fare_amount,
      payment_method,
      payment_status,
      created_at,
      updated_at`,
    [
      passengerId,
      pickupZoneId,
      destinationZoneId,
      requestedSeats,
      shareRide,
      fareAmount,
      paymentMethod,
    ],
  );

  return result.rows[0];
};

export const createRideStatusHistory = async ({
  rideId,
  toStatus,
  changedBy,
}) => {
  const result = await pool.query(
    `INSERT INTO ride_status_history (
      ride_id,
      from_status,
      to_status,
      changed_by
    )
    VALUES ($1, NULL, $2, $3)
    RETURNING id, ride_id, from_status, to_status, changed_by, created_at`,
    [rideId, toStatus, changedBy],
  );

  return result.rows[0];
};

export const findRidesByPassengerId = async (passengerId) => {
  const result = await pool.query(
    `SELECT
      r.id,
      r.requested_seats,
      r.share_ride,
      r.status,
      r.fare_amount,
      r.payment_method,
      r.payment_status,
      r.created_at,
      r.updated_at,
      p.id AS pool_id,
      p.status AS pool_status,
      pickup.id AS pickup_zone_id,
      pickup.name AS pickup_zone_name,
      destination.id AS destination_zone_id,
      destination.name AS destination_zone_name
    FROM rides r
    JOIN zones pickup
      ON pickup.id = r.pickup_zone_id
    JOIN zones destination
      ON destination.id = r.destination_zone_id
    LEFT JOIN pool_members pm
      ON pm.ride_id = r.id
    LEFT JOIN pools p
      ON p.id = pm.pool_id
    WHERE r.passenger_id = $1
    ORDER BY r.created_at DESC`,
    [passengerId],
  );

  return result.rows;
};

export const findRideByIdAndPassengerId = async (rideId, passengerId) => {
  const result = await pool.query(
    `SELECT
      r.id,
      r.passenger_id,
      r.requested_seats,
      r.share_ride,
      r.status,
      r.fare_amount,
      r.payment_method,
      r.payment_status,
      r.created_at,
      r.updated_at,
      pickup.id AS pickup_zone_id,
      pickup.name AS pickup_zone_name,
      destination.id AS destination_zone_id,
      destination.name AS destination_zone_name,
      p.id AS pool_id,
      p.status AS pool_status,
      t.id AS tesla_id,
      t.name AS tesla_name,
      driver.name AS driver_name
    FROM rides r
    JOIN zones pickup
      ON pickup.id = r.pickup_zone_id
    JOIN zones destination
      ON destination.id = r.destination_zone_id
    LEFT JOIN pool_members pm
      ON pm.ride_id = r.id
    LEFT JOIN pools p
      ON p.id = pm.pool_id
    LEFT JOIN teslas t
      ON t.id = p.tesla_id
    LEFT JOIN users driver
      ON driver.id = t.driver_id
    WHERE r.id = $1
      AND r.passenger_id = $2`,
    [rideId, passengerId],
  );

  return result.rows[0] || null;
};

export const updateRideStatus = async (rideId, status) => {
  const result = await pool.query(
    `UPDATE rides
     SET status = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING
       id,
       passenger_id,
       pickup_zone_id,
       destination_zone_id,
       requested_seats,
       share_ride,
       status,
       fare_amount,
       payment_method,
       payment_status,
       created_at,
       updated_at`,
    [status, rideId],
  );

  return result.rows[0] || null;
};

export const createStatusHistoryEntry = async ({
  rideId,
  fromStatus,
  toStatus,
  changedBy,
}) => {
  const result = await pool.query(
    `INSERT INTO ride_status_history (
      ride_id,
      from_status,
      to_status,
      changed_by
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      ride_id,
      from_status,
      to_status,
      changed_by,
      created_at`,
    [rideId, fromStatus, toStatus, changedBy],
  );

  return result.rows[0];
};

export const findRideStatusHistory = async (rideId) => {
  const result = await pool.query(
    `SELECT
      id,
      ride_id,
      from_status,
      to_status,
      changed_by,
      created_at
    FROM ride_status_history
    WHERE ride_id = $1
    ORDER BY created_at ASC`,
    [rideId],
  );

  return result.rows;
};
