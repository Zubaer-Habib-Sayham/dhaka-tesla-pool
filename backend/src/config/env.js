import "dotenv/config";

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5433/dhaka_tesla_pool",
  jwtSecret: process.env.JWT_SECRET || "change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};

// Hosted instances must use their own database and signing secret.
if (env.nodeEnv === "production") {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required in production.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_me" || process.env.JWT_SECRET.length < 32) {
    throw new Error("Set a JWT_SECRET of at least 32 characters in production.");
  }
}

export default env;
