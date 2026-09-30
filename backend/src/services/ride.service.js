import {
  createRide,
  createRideStatusHistory,
  findRidesByPassengerId,
  findRideByIdAndPassengerId,
  cancelOwnedRide,
  findRideStatusHistory,
} from "../repositories/ride.repository.js";

import { findZoneById } from "../repositories/zone.repository.js";
import { calculateFare } from "./fare.service.js";

export const requestRide = async ({
  passengerId,
  pickupZoneId,
  destinationZoneId,
  requestedSeats,
  shareRide,
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
    shareRide,
  });

  const ride = await createRide({
    passengerId,
    pickupZoneId,
    destinationZoneId,
    requestedSeats,
    shareRide,
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
  return cancelOwnedRide({ rideId, passengerId });
};
