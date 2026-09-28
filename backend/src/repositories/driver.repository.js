import pool from "../config/database.js";

export const findDriverWithTesla = async (driverId) => {
  const result = await pool.query(
    `SELECT
       u.id AS driver_id,
       u.name AS driver_name,
       u.email AS driver_email,
       u.role,
       t.id AS tesla_id,
       t.name AS tesla_name,
       t.capacity,
       t.status AS tesla_status
     FROM users u
     LEFT JOIN teslas t ON t.driver_id = u.id
     WHERE u.id = $1
       AND u.role = 'DRIVER'`,
    [driverId],
  );

  return result.rows[0] || null;
};

export const updateTeslaStatus = async (driverId, status) => {
  const result = await pool.query(
    `UPDATE teslas
     SET status = $1,
         updated_at = NOW()
     WHERE driver_id = $2
     RETURNING id, name, capacity, status, updated_at`,
    [status, driverId],
  );

  return result.rows[0] || null;
};

export const findRequestedRides = async () => {
  const result = await pool.query(
    `SELECT
       r.id,
       r.passenger_id,
       u.name AS passenger_name,
       r.pickup_zone_id,
       pickup.name AS pickup_zone_name,
       r.destination_zone_id,
       destination.name AS destination_zone_name,
       r.requested_seats,
       r.fare_amount,
       r.payment_method,
       r.payment_status,
       r.status,
       r.created_at
     FROM rides r
     JOIN users u ON u.id = r.passenger_id
     JOIN zones pickup ON pickup.id = r.pickup_zone_id
     JOIN zones destination
       ON destination.id = r.destination_zone_id
     WHERE r.status = 'REQUESTED'
     ORDER BY r.created_at ASC`,
  );

  return result.rows;
};

export const findRideForDriver = async (rideId, driverId) => {
  const result = await pool.query(
    `SELECT
       r.id,
       r.passenger_id,
       r.pickup_zone_id,
       r.destination_zone_id,
       r.requested_seats,
       r.fare_amount,
       r.payment_method,
       r.payment_status,
       r.status,
       t.id AS tesla_id,
       t.capacity,
       p.id AS pool_id
     FROM rides r
     JOIN pool_members pm ON pm.ride_id = r.id
     JOIN pools p ON p.id = pm.pool_id
     JOIN teslas t ON t.id = p.tesla_id
     WHERE r.id = $1
       AND t.driver_id = $2`,
    [rideId, driverId],
  );

  return result.rows[0] || null;
};

export const createPool = async (teslaId) => {
  const result = await pool.query(
    `INSERT INTO pools (tesla_id, status)
     VALUES ($1, 'ACTIVE')
     RETURNING id, tesla_id, status, created_at`,
    [teslaId],
  );

  return result.rows[0];
};

export const createPoolMember = async ({ poolId, rideId, seats }) => {
  const result = await pool.query(
    `INSERT INTO pool_members (pool_id, ride_id, seats)
     VALUES ($1, $2, $3)
     RETURNING id, pool_id, ride_id, seats, joined_at`,
    [poolId, rideId, seats],
  );

  return result.rows[0];
};

export const updateRideStatus = async (rideId, status) => {
  const result = await pool.query(
    `UPDATE rides
     SET status = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
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
    `INSERT INTO ride_status_history
      (ride_id, from_status, to_status, changed_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, ride_id, from_status, to_status, changed_by, created_at`,
    [rideId, fromStatus, toStatus, changedBy],
  );

  return result.rows[0];
};
