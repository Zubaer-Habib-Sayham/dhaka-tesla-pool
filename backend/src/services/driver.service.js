import {
  findDriverWithTesla,
  updateTeslaStatus,
  findRequestedRides,
  acceptRideForDriver,
  updateDriverRideStatus,
  findRidesForDriver,
  setTeslaAvailability,
} from "../repositories/driver.repository.js";


const ensureDriver = async (driverId) => {
  const driver = await findDriverWithTesla(driverId);

  if (!driver || !driver.tesla_id) {
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
  await setTeslaAvailability(driverId, "OFFLINE");
  return ensureDriver(driverId);
};

export const getDriverRides = async (driverId) => {
  await ensureDriver(driverId);
  return findRidesForDriver(driverId);
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

const changeRideStatus = ({ rideId, driverId, nextStatus }) => {
  return updateDriverRideStatus({ rideId, driverId, nextStatus });
};
