import pool from "../config/database.js";

export const getDatabaseHealth = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    res.status(200).json({
      status: "ok",
      database: "connected",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    next(error);
  }
};
