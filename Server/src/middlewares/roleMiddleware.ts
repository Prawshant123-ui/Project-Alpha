import type { Request, Response, NextFunction } from "express";
import {logger} from "../config/logger.js"


export const authorize = (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.error("Not Authenticated")
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
            logger.error(`Access denied: requires role ${allowedRoles.join(" or ")}`)
      return res.status(403).json({
        message: `Access denied: requires role ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };