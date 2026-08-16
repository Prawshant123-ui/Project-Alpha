import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.js";

export const protect = async (
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, isBanned: true },
    });

    if (!user) {
      logger.warn({ userId: decoded.id }, "Token valid but user no longer exists");
      return res.status(401).json({
        message: "User not found.",
      });
    }

    if (user.isBanned) {
      logger.warn({ userId: user.id }, "Banned user attempted access");
      return res.status(403).json({
        message: "Your account has been suspended.",
      });
    }

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