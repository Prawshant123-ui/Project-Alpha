import "dotenv/config";

const parseSaltRounds = (value: string | undefined): number => {
  const fallback = 10;
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("SALT_ROUNDS must be a positive integer");
  }
  return parsed;
};

export const env = {
  PORT: process.env.PORT || "5000",
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_SECRET_KEY: process.env.CLOUDINARY_SECRET_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_NAME: process.env.ADMIN_NAME,
  SALT_ROUNDS: parseSaltRounds(process.env.SALT_ROUNDS),
};