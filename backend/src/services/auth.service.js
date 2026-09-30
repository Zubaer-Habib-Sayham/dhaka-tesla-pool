import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import env from "../config/env.js";

const SALT_ROUNDS = 12;

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    },
  );
};

export const registerPassenger = async ({ name, email, password, role = "PASSENGER", teslaName, capacity }) => {
  const normalizedEmail = email.toLowerCase();

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [normalizedEmail],
  );

  if (existingUser.rowCount > 0) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    error.code = "EMAIL_ALREADY_EXISTS";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, normalizedEmail, passwordHash, role],
    );
    const user = result.rows[0];
    if (role === "DRIVER") {
      await client.query(
        `INSERT INTO teslas (driver_id, name, capacity, status)
         VALUES ($1, $2, $3, 'OFFLINE')`,
        [user.id, teslaName, capacity],
      );
    }
    const token = createToken(user);
    await client.query("COMMIT");
    return { token, user };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      error.statusCode = 409;
      error.code = "EMAIL_ALREADY_EXISTS";
      error.message = "An account with this email already exists.";
    }
    throw error;
  } finally {
    client.release();
  }
};

export const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const result = await pool.query(
    `SELECT id, name, email, password_hash, role
     FROM users
     WHERE email = $1`,
    [normalizedEmail],
  );

  if (result.rowCount === 0) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const user = result.rows[0];

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  delete user.password_hash;

  return {
    token: createToken(user),
    user,
  };
};
