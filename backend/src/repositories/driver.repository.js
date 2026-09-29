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

export const acceptRideForDriver = async ({ rideId, driverId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const teslaResult = await client.query(
      `SELECT
         t.id,
         t.name,
         t.capacity,
         t.status
       FROM teslas t
       WHERE t.driver_id = $1
       FOR UPDATE`,
      [driverId],
    );

    if (teslaResult.rowCount === 0) {
      const error = new Error("Driver or Tesla could not be found.");

      error.statusCode = 404;
      error.code = "DRIVER_NOT_FOUND";

      throw error;
    }

    const tesla = teslaResult.rows[0];

    if (tesla.status !== "ONLINE") {
      const error = new Error("Tesla must be online to accept rides.");

      error.statusCode = 409;
      error.code = "TESLA_OFFLINE";

      throw error;
    }

    const rideResult = await client.query(
      `SELECT
         r.id,
         r.passenger_id,
         r.pickup_zone_id,
         r.destination_zone_id,
         r.requested_seats,
         r.status,
         r.fare_amount,
         r.payment_method,
         r.payment_status
       FROM rides r
       WHERE r.id = $1
       FOR UPDATE`,
      [rideId],
    );

    if (rideResult.rowCount === 0) {
      const error = new Error("Ride could not be found.");

      error.statusCode = 404;
      error.code = "RIDE_NOT_FOUND";

      throw error;
    }

    const ride = rideResult.rows[0];

    if (ride.status !== "REQUESTED") {
      const error = new Error("Only requested rides can be accepted.");

      error.statusCode = 409;
      error.code = "RIDE_NOT_AVAILABLE";

      throw error;
    }

    const poolResult = await client.query(
      `SELECT
         p.id,
         p.status
       FROM pools p
       WHERE p.tesla_id = $1
         AND p.status = 'ACTIVE'
       ORDER BY p.created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [tesla.id],
    );

    let activePool;

    if (poolResult.rowCount === 0) {
      const newPoolResult = await client.query(
        `INSERT INTO pools (tesla_id, status)
         VALUES ($1, 'ACTIVE')
         RETURNING id, tesla_id, status, created_at`,
        [tesla.id],
      );

      activePool = newPoolResult.rows[0];
    } else {
      activePool = poolResult.rows[0];
    }

    const occupiedResult = await client.query(
      `SELECT COALESCE(SUM(seats), 0) AS occupied_seats
       FROM pool_members
       WHERE pool_id = $1`,
      [activePool.id],
    );

    const occupiedSeats = Number(occupiedResult.rows[0].occupied_seats);

    const availableSeats = tesla.capacity - occupiedSeats;

    if (ride.requested_seats > availableSeats) {
      const error = new Error(
        `Not enough seats available. ${availableSeats} seat(s) remaining.`,
      );

      error.statusCode = 409;
      error.code = "INSUFFICIENT_CAPACITY";

      throw error;
    }

    await client.query(
      `INSERT INTO pool_members
        (pool_id, ride_id, seats)
       VALUES ($1, $2, $3)`,
      [activePool.id, ride.id, ride.requested_seats],
    );

    const updatedRideResult = await client.query(
      `UPDATE rides
       SET status = 'MATCHED',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [ride.id],
    );

    await client.query(
      `INSERT INTO ride_status_history
        (ride_id, from_status, to_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [ride.id, ride.status, "MATCHED", driverId],
    );

    await client.query("COMMIT");

    return {
      ride: updatedRideResult.rows[0],
      pool: activePool,
      occupiedSeats: occupiedSeats + ride.requested_seats,
      availableSeats: availableSeats - ride.requested_seats,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
