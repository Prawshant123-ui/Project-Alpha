import "dotenv/config";



export const env = {
  PORT: process.env.PORT || "5000",
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  CLOUDINARY_API_KEY:process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_SECRET_KEY:process.env.CLOUDINARY_SECRET_KEY,
  CLOUDINARY_CLOUD_NAME:process.env.CLOUDINARY_CLOUD_NAME,
};