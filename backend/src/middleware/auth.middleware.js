import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "The provided token is invalid or expired.",
      },
    });
  }
};
