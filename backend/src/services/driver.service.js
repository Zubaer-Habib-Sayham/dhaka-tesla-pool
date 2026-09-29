import {
  findDriverWithTesla,
  updateTeslaStatus,
  findRequestedRides,
  acceptRideForDriver,
} from "../repositories/driver.repository.js";

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
