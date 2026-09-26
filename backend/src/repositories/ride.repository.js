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
