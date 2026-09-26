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

export default env;
