import {
  fareEstimateSchema,
  createRideSchema,
} from "../validators/ride.validator.js";
import { findZoneById } from "../repositories/zone.repository.js";
import { calculateFare } from "../services/fare.service.js";
import {
  requestRide,
  getPassengerRides,
  getPassengerRide,
  cancelPassengerRide,
} from "../services/ride.service.js";

export const estimateFare = async (req, res, next) => {
  try {
    const data = fareEstimateSchema.parse(req.body);

    const pickupZone = await findZoneById(data.pickupZoneId);
    const destinationZone = await findZoneById(data.destinationZoneId);

    if (!pickupZone || !destinationZone) {
      const error = new Error("One or more selected zones do not exist.");
      error.statusCode = 404;
      error.code = "ZONE_NOT_FOUND";
      throw error;
    }

    const fare = calculateFare({
      pickupZone,
      destinationZone,
      requestedSeats: data.requestedSeats,
      isPooled: false,
    });

    res.status(200).json({
      pickupZone,
      destinationZone,
      fare,
    });
  } catch (error) {
    next(error);
  }
};

export const createRideRequest = async (req, res, next) => {
  try {
    const data = createRideSchema.parse(req.body);

    const result = await requestRide({
      passengerId: req.user.userId,
      ...data,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyRides = async (req, res, next) => {
  try {
    const rides = await getPassengerRides(req.user.userId);

    res.status(200).json({
      rides,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRide = async (req, res, next) => {
  try {
    const rideId = Number(req.params.id);

    if (!Number.isInteger(rideId) || rideId <= 0) {
      const error = new Error("Invalid ride ID.");
      error.statusCode = 400;
      error.code = "INVALID_RIDE_ID";
      throw error;
    }

    const result = await getPassengerRide(rideId, req.user.userId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const cancelRide = async (req, res, next) => {
  try {
    const rideId = Number(req.params.id);

    if (!Number.isInteger(rideId) || rideId <= 0) {
      const error = new Error("Invalid ride ID.");
      error.statusCode = 400;
      error.code = "INVALID_RIDE_ID";
      throw error;
    }

    const ride = await cancelPassengerRide({
      rideId,
      passengerId: req.user.userId,
    });

    res.status(200).json({
      ride,
    });
  } catch (error) {
    next(error);
  }
};
