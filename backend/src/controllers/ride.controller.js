import { fareEstimateSchema } from "../validators/ride.validator.js";
import { findZoneById } from "../repositories/zone.repository.js";
import { calculateFare } from "../services/fare.service.js";

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
