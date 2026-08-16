import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const role = req.query.role as string | undefined;

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: role ? { role: role as any } : undefined,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBanned: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: role ? { role: role as any } : undefined }),
    ]);

    return res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      pagination: {
        currentPage: page,
        limit,
        totalItems: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch users");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
        createdAt: true,
        courses: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User fetched successfully", data: user });
  } catch (error) {
    logger.error({ error }, "Failed to fetch user");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const banUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { reason } = req.body;

    if (userId === req.user?.id) {
      return res.status(400).json({ message: "You cannot ban yourself" });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === "ADMIN") {
      return res.status(403).json({ message: "Cannot ban another admin" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        banReason: reason ?? "No reason provided",
      },
    });

    logger.info({ userId, adminId: req.user?.id }, "User banned");

    return res.status(200).json({ message: "User banned successfully", data: updated });
  } catch (error) {
    logger.error({ error }, "Failed to ban user");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const unbanUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedAt: null,
        banReason: null,
      },
    });

    logger.info({ userId, adminId: req.user?.id }, "User unbanned");

    return res.status(200).json({ message: "User unbanned successfully", data: updated });
  } catch (error) {
    logger.error({ error }, "Failed to unban user");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;

    if (userId === req.user?.id) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === "ADMIN") {
      return res.status(403).json({ message: "Cannot delete another admin" });
    }

    await prisma.user.delete({ where: { id: userId } });

    logger.info({ userId, adminId: req.user?.id }, "User deleted by admin");

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to delete user");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const moderateDeleteCourse = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.id as string;

    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await prisma.course.delete({ where: { id: courseId } });

    logger.info(
      { courseId, teacherId: course.teacherId, adminId: req.user?.id },
      "Course removed by admin moderation"
    );

    return res.status(200).json({ message: "Course removed successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to moderate/delete course");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { getAllUsers, getUserById, banUser, unbanUser, deleteUser, moderateDeleteCourse };