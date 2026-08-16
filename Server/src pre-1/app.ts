import express from "express";
import cors from "cors";
import { httpLogger } from "../src/middlewares/loggerMiddleware.js";
import { env } from "../src/config/env.js"
import helmet from "helmet"
import { apiLimiter } from "./utils/rateLimiter.js";
import authRoute from "../src/routes/authRoute.js"
import courseRoute from "../src/routes/courseRoute.js"
import adminRoute from "../src/routes/adminRoute.js"



export const app = express();

app.use(helmet());

app.use(cors({
  origin: env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(httpLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Project-Alpha API" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

app.use('/api/auth', authRoute)
app.use("/api/courses", courseRoute);
app.use("/api/admin", adminRoute);