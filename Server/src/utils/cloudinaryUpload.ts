import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import type { UploadApiResponse } from "cloudinary";
import { logger } from "../config/logger.js";

type ResourceType = "image" | "video" | "raw" | "auto";

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string,
  resourceType: ResourceType = "auto"
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    logger.info({ folder, resourceType }, "Cloudinary upload started");

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          logger.error({ err: error, folder }, "Cloudinary upload failed");
          return reject(error);
        }
        if (!result) {
          logger.error({ folder }, "Cloudinary returned no result");
          return reject(new Error("Cloudinary returned no result"));
        }

        logger.info(
          { publicId: result.public_id, resourceType: result.resource_type, bytes: result.bytes },
          "Cloudinary upload succeeded"
        );
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });