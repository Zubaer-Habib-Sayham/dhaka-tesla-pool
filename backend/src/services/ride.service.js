import {
  createRide,
  createRideStatusHistory,
} from "../repositories/ride.repository.js";
import { findZoneById } from "../repositories/zone.repository.js";
import { calculateFare } from "./fare.service.js";
import {
  findRidesByPassengerId,
  findRideByIdAndPassengerId,
  updateRideStatus,
  createStatusHistoryEntry,
  findRideStatusHistory,
} from "../repositories/ride.repository.js";

export const requestRide = async ({
  passengerId,
  pickupZoneId,
  destinationZoneId,
  requestedSeats,
  paymentMethod,
}) => {
  const pickupZone = await findZoneById(pickupZoneId);
  const destinationZone = await findZoneById(destinationZoneId);

  if (!pickupZone || !destinationZone) {
    const error = new Error("One or more selected zones do not exist.");
    error.statusCode = 404;
    error.code = "ZONE_NOT_FOUND";
    throw error;
  }

  const fare = calculateFare({
    pickupZone,
    destinationZone,
    requestedSeats,
    isPooled: false,
  });

  const ride = await createRide({
    passengerId,
    pickupZoneId,
    destinationZoneId,
    requestedSeats,
    fareAmount: fare.fareAmount,
    paymentMethod,
  });

  await createRideStatusHistory({
    rideId: ride.id,
    toStatus: "REQUESTED",
    changedBy: passengerId,
  });

  return {
    ride,
    pickupZone,
    destinationZone,
    fare,
  };
};

export const getPassengerRides = async (passengerId) => {
  return findRidesByPassengerId(passengerId);
};

export const getPassengerRide = async (rideId, passengerId) => {
  const ride = await findRideByIdAndPassengerId(rideId, passengerId);

  if (!ride) {
    const error = new Error("Ride not found.");
    error.statusCode = 404;
    error.code = "RIDE_NOT_FOUND";
    throw error;
  }

  const history = await findRideStatusHistory(rideId);

  return {
    ride,
    history,
  };
};

export const cancelPassengerRide = async ({ rideId, passengerId }) => {
  const ride = await findRideByIdAndPassengerId(rideId, passengerId);

  if (!ride) {
    const error = new Error("Ride not found.");
    error.statusCode = 404;
    error.code = "RIDE_NOT_FOUND";
    throw error;
  }

  if (!["REQUESTED", "MATCHED"].includes(ride.status)) {
    const error = new Error("This ride can no longer be cancelled.");

    error.statusCode = 409;
    error.code = "RIDE_CANNOT_BE_CANCELLED";
    throw error;
  }

  const previousStatus = ride.status;

  const updatedRide = await updateRideStatus(rideId, "CANCELLED");

  await createStatusHistoryEntry({
    rideId,
    fromStatus: previousStatus,
    toStatus: "CANCELLED",
    changedBy: passengerId,
  });

  return updatedRide;
};
