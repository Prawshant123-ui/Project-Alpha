import { verifyToken } from "../utils/jwt.js";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      logger.warn("Access token is missing");

      return res.status(401).json({
        message: "Access token is missing.",
      });
    }

    const token = header.split(" ")[1];

    if (!token) {
      logger.warn("Malformed authorization header");

      return res.status(401).json({
        message: "Malformed token.",
      });
    }

    const decoded = verifyToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    logger.warn(
      { error },
      "Invalid or expired access token"
    );

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};