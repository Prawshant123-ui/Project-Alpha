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
      notePdfFile ? uploadToCloudinary(notePdfFile.buffer, "courses/pdf", "raw") : Promise.resolve(null),
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

    const course = await prisma.course.findUnique({
      where: { id: courseId },
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

const searchCourse = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.q as string | undefined;

    if (!keyword) {
      return res.status(400).json({ message: "Search keyword is required" });
    }

    const course = await prisma.course.findMany({
      where: {
        title: {
          contains: keyword,
          mode: "insensitive",
        },
      },
    });

    return res.status(200).json(course);
  } catch (error) {
    logger.error({ error }, "Failed to search courses");
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const getCoursesByDomain = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const domain = req.params.domain as string;

    const course = await prisma.course.findMany({
      where: { domain },
    });

    return res.status(200).json({
      message: "Courses fetched successfully",
      data: course,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch courses by domain");
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = req.params.id as string;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        teacherId: req.user.id,
      },
    });

    if (!existingCourse) {
      logger.warn(
        { courseId, userId: req.user.id },
        "Course not found or not owned by user"
      );
      return res.status(404).json({ message: "Course not found" });
    }

    const { title, subject, description, domain } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const notePdfFile = files?.notePdfUrl?.[0];
    const thumbnailImageFile = files?.thumbnailImageUrl?.[0];
    const videoFile = files?.videoUrl?.[0];

    const [notePdfResult, thumbnailResult, videoResult] = await Promise.all([
      notePdfFile ? uploadToCloudinary(notePdfFile.buffer, "courses/pdf", "raw") : Promise.resolve(null),
      thumbnailImageFile ? uploadToCloudinary(thumbnailImageFile.buffer, "courses/thumbnails", "image") : Promise.resolve(null),
      videoFile ? uploadToCloudinary(videoFile.buffer, "courses/videos", "video") : Promise.resolve(null),
    ]);

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(title && { title }),
        ...(subject && { subject }),
        ...(description && { description }),
        ...(domain && { domain }),
        ...(notePdfResult && { notePdfUrl: notePdfResult.secure_url }),
        ...(thumbnailResult && { thumbnailImageUrl: thumbnailResult.secure_url }),
        ...(videoResult && { videoUrl: videoResult.secure_url }),
      },
    });

    logger.info({ courseId, userId: req.user.id }, "Course updated successfully");

    return res.status(200).json({
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    logger.error({ error, courseId: req.params.id, userId: req.user?.id }, "Failed to update course");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteCourse = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = req.params.id as string;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        teacherId: req.user.id,
      },
    });

    if (!existingCourse) {
      logger.warn(
        { courseId, userId: req.user.id },
        "Course not found or not owned by user"
      );
      return res.status(404).json({ message: "Course not found" });
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    logger.info({ courseId, userId: req.user.id }, "Course deleted successfully");

    return res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    logger.error({ error, courseId: req.params.id, userId: req.user?.id }, "Failed to delete course");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createCourse, getAllCourse, getCourseById, updateCourse, deleteCourse, searchCourse, getCoursesByDomain };