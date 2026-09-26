import { getAllZones } from "../services/zone.service.js";

export const getZones = async (req, res, next) => {
  try {
    const zones = await getAllZones();

    res.status(200).json({
      zones,
    });
  } catch (error) {
    next(error);
  }
};
