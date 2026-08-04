import {verifyToken} from "../utils/jwt.js"
import type { Request, Response, NextFunction } from "express";
import {logger} from "../config/logger.js"



export const protect = (req:Request, res:Response, next:NextFunction) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token is missing." });
    }

    const token = header.split(" ")[1];
    if (!token) {
      logger.error("Malformed token")
      return res.status(401).json({ message: "Malformed token." });
    }
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (err) {
     logger.error("Invalid or expired  token")
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

