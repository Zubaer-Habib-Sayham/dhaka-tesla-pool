import pool from "../config/database.js";
import {
  findDriverWithTesla,
  updateTeslaStatus,
  findRequestedRides,
  acceptRideForDriver,
  updateDriverRideStatus,
} from "../repositories/driver.repository.js";

import { validateRideTransition } from "./ride-state.service.js";

const ensureDriver = async (driverId) => {
  const driver = await findDriverWithTesla(driverId);

  if (!driver) {
    const error = new Error("Driver or Tesla could not be found.");

    error.statusCode = 404;
    error.code = "DRIVER_NOT_FOUND";

    throw error;
  }

  return driver;
};

export const getDriverProfile = async (driverId) => {
  return ensureDriver(driverId);
};

export const setDriverOnline = async (driverId) => {
  const driver = await ensureDriver(driverId);

  if (driver.tesla_status === "ONLINE") {
    return driver;
  }

  const tesla = await updateTeslaStatus(driverId, "ONLINE");

  return {
    ...driver,
    tesla_status: tesla.status,
    tesla_updated_at: tesla.updated_at,
  };
};

export const setDriverOffline = async (driverId) => {
  const driver = await ensureDriver(driverId);

  if (driver.tesla_status === "OFFLINE") {
    return driver;
  }

  const tesla = await updateTeslaStatus(driverId, "OFFLINE");

  return {
    ...driver,
    tesla_status: tesla.status,
    tesla_updated_at: tesla.updated_at,
  };
};

export const getDriverRequests = async () => {
  return findRequestedRides();
};

export const acceptRide = async ({ rideId, driverId }) => {
  return acceptRideForDriver({
    rideId,
    driverId,
  });
};

export const arriveAtRide = async ({ rideId, driverId }) => {
  return changeRideStatus({
    rideId,
    driverId,
    nextStatus: "DRIVER_ARRIVED",
  });
};

export const startRide = async ({ rideId, driverId }) => {
  return changeRideStatus({
    rideId,
    driverId,
    nextStatus: "STARTED",
  });
};

export const completeRide = async ({ rideId, driverId }) => {
  return changeRideStatus({
    rideId,
    driverId,
    nextStatus: "COMPLETED",
  });
};

const changeRideStatus = async ({ rideId, driverId, nextStatus }) => {
  const ride = await findRideStatusForDriver({
    rideId,
    driverId,
  });

  validateRideTransition(ride.status, nextStatus);

  return updateDriverRideStatus({
    rideId,
    driverId,
    nextStatus,
  });
};

const findRideStatusForDriver = async ({ rideId, driverId }) => {
  const driver = await ensureDriver(driverId);

  if (driver.tesla_status === "OFFLINE") {
    const error = new Error("Tesla must be online to manage rides.");

    error.statusCode = 409;
    error.code = "TESLA_OFFLINE";

    throw error;
  }

  const result = await pool.query(
    `SELECT
       r.id,
       r.status
     FROM rides r
     JOIN pool_members pm
       ON pm.ride_id = r.id
     JOIN pools p
       ON p.id = pm.pool_id
     JOIN teslas t
       ON t.id = p.tesla_id
     WHERE r.id = $1
       AND t.driver_id = $2`,
    [rideId, driverId],
  );

  if (result.rowCount === 0) {
    const error = new Error("Ride could not be found for this driver.");

    error.statusCode = 404;
    error.code = "RIDE_NOT_FOUND";

    throw error;
  }

  return result.rows[0];
};
