import multer from "multer";
import { logger } from "../config/logger.js";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.warn({ mimetype: file.mimetype, originalName: file.originalname }, "Rejected file: unsupported type");
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});