import pool from "../config/database.js";

export const findAllZones = async () => {
  const result = await pool.query(
    `SELECT id, name, latitude, longitude
     FROM zones
     ORDER BY name ASC`,
  );

  return result.rows;
};

export const findZoneById = async (zoneId) => {
  const result = await pool.query(
    `SELECT id, name, latitude, longitude
     FROM zones
     WHERE id = $1`,
    [zoneId],
  );

  return result.rows[0] || null;
};
