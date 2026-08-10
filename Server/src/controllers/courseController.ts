import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

const createCourse = async (req: Request, res: Response) => {
  try {
    const { title, subject, description, domain } = req.body;
    const teacherId = req.user?.id;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const notePdfFile = files?.notePdfUrl?.[0];
    const thumbnailImageFile = files?.thumbnailImageUrl?.[0];
    const videoFile = files?.videoUrl?.[0];

    if (!title || !subject || !description || !domain || !teacherId) {
      logger.warn({ title, subject, domain, teacherId }, "Missing required fields for course creation");
      return res.status(400).json({ message: "Title, subject, description, domain are required" });
    }

    const [notePdfResult, thumbnailResult, videoResult] = await Promise.all([
      notePdfFile ? uploadToCloudinary(notePdfFile.buffer, "courses/pdfs", "raw") : Promise.resolve(null),
      thumbnailImageFile ? uploadToCloudinary(thumbnailImageFile.buffer, "courses/thumbnails", "image") : Promise.resolve(null),
      videoFile ? uploadToCloudinary(videoFile.buffer, "courses/videos", "video") : Promise.resolve(null),
    ]);

    const course = await prisma.course.create({
      data: {
        title,
        subject,
        description,
        domain,
        teacherId,
        notePdfUrl: notePdfResult?.secure_url ?? null,
        thumbnailImageUrl: thumbnailResult?.secure_url ?? null,
        videoUrl: videoResult?.secure_url ?? null,
      },
    });

    logger.info({ courseId: course.id }, "Course created successfully");
    return res.status(201).json({ message: "Course created", course });
  } catch (error) {
    logger.error({ err: error }, "Failed to create course");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllCourse = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    logger.info(
      {
        page,
        limit,
        skip,
      },
      "Fetching courses"
    );

    const [courses, totalCourses] = await Promise.all([
      prisma.course.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.course.count(),
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    logger.info(
      {
        page,
        limit,
        coursesFetched: courses.length,
        totalCourses,
        totalPages,
      },
      "Courses fetched successfully"
    );

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        currentPage: page,
        limit,
        totalItems: totalCourses,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to fetch courses"
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
};


const getCourseById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      logger.warn("Unauthorized request to get course");

      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const courseId = req.params.id as string;

    if (!courseId) {
      logger.warn(
        { userId: req.user.id },
        "Course ID is missing"
      );

      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: req.user.id,
      },
    });

    if (!course) {
      logger.warn(
        {
          courseId,
          userId: req.user.id,
        },
        "Course not found"
      );

      return res.status(404).json({
        message: "Course not found",
      });
    }

    logger.info(
      {
        courseId,
        userId: req.user.id,
      },
      "Course fetched successfully"
    );

    return res.status(200).json({
      message: "Course fetched successfully",
      data: course,
    });
  } catch (error) {
    logger.error(
      {
        error,
        courseId: req.params.id,
        userId: req.user?.id,
      },
      "Failed to fetch course"
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { createCourse, getAllCourse,getCourseById};