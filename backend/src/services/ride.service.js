import {
  createRide,
  createRideStatusHistory,
} from "../repositories/ride.repository.js";
import { findZoneById } from "../repositories/zone.repository.js";
import { calculateFare } from "./fare.service.js";

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
