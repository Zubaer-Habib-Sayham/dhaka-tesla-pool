import { findAllZones } from "../repositories/zone.repository.js";

export const getAllZones = async () => {
  return findAllZones();
};
