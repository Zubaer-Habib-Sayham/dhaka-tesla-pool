import pool from "../config/database.js";

export const findAllZones = async () => {
  const result = await pool.query(
    `SELECT id, name, latitude, longitude
     FROM zones
     ORDER BY name ASC`,
  );

  return result.rows;
};
