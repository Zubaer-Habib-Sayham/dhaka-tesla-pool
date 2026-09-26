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

export const registerPassenger = async ({ name, email, password }) => {
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

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'PASSENGER')
     RETURNING id, name, email, role, created_at`,
    [name, normalizedEmail, passwordHash],
  );

  const user = result.rows[0];

  return {
    token: createToken(user),
    user,
  };
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
