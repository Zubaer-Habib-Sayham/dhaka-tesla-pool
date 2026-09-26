import { z } from "zod";

export const fareEstimateSchema = z.object({
  pickupZoneId: z.coerce.number().int().positive(),
  destinationZoneId: z.coerce.number().int().positive(),
  requestedSeats: z.coerce.number().int().min(1).max(3),
});

export const createRideSchema = z.object({
  pickupZoneId: z.coerce.number().int().positive(),
  destinationZoneId: z.coerce.number().int().positive(),
  requestedSeats: z.coerce.number().int().min(1).max(3),
  paymentMethod: z.enum(["CASH", "TESLAPAY"]),
});
