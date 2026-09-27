import pool from "../config/database.js";

export const createRide = async ({
  passengerId,
  pickupZoneId,
  destinationZoneId,
  requestedSeats,
  fareAmount,
  paymentMethod,
}) => {
  const result = await pool.query(
    `INSERT INTO rides (
      passenger_id,
      pickup_zone_id,
      destination_zone_id,
      requested_seats,
      status,
      fare_amount,
      payment_method,
      payment_status
    )
    VALUES ($1, $2, $3, $4, 'REQUESTED', $5, $6, 'PENDING')
    RETURNING
      id,
      passenger_id,
      pickup_zone_id,
      destination_zone_id,
      requested_seats,
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
      t.name AS tesla_name
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
