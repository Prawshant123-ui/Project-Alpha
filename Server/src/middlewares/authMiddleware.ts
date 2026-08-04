import {verifyToken} from "../utils/jwt.js"
import type { Request, Response, NextFunction } from "express";



export const protect = (req:Request, res:Response, next:NextFunction) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token is missing." });
    }

    const token = header.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Malformed token." });
    }
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

