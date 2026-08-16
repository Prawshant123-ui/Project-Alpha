import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js"
import type { Role } from "@prisma/client";

type TokenPayload = {
  id: string;
  email: string;
  role: Role; 
};

if (!env.JWT_SECRET) {
    logger.error("JWT_SECRET is not defined in environment variables")
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const JWT_SECRET = env.JWT_SECRET;

const signToken = (user: TokenPayload) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export { signToken, verifyToken };