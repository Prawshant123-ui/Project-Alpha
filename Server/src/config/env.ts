import "dotenv/config";



export const env = {
  PORT: process.env.PORT || "5000",
  JWT_SECRET: ("JWT_SECRET"),
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  CLIENT_URL: "http://localhost:3000"
};