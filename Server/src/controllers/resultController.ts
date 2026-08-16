import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

// Helper: latest attempt per student for a given quiz
const latestAttemptsForQuiz = (quizId: string) =>
  prisma.quizAttempt.findMany({
    where: { quizId },
    orderBy: { attemptedAt: "desc" },
    distinct: ["studentId"],
    include: { student: { select: { id: true, name: true } } },
  });

// ---------- STUDENT ----------

// Student's own progress: latest score per course they've attempted
const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.id;

    const latest = await prisma.quizAttempt.findMany({
      where: { studentId },
      orderBy: { attemptedAt: "desc" },
      distinct: ["quizId"],
      include: {
        quiz: { include: { course: { select: { id: true, title: true, domain: true } } } },
      },
    });

    const progress = latest.map((a) => ({
      courseId: a.quiz.course.id,
      courseTitle: a.quiz.course.title,
      domain: a.quiz.course.domain,
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0,
      attemptedAt: a.attemptedAt,
    }));

    return res.status(200).json({ message: "Progress fetched", data: progress });
  } catch (error) {
    logger.error({ error }, "Failed to fetch student progress");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- LEADERBOARD (per course) ----------

const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId as string;

    const quiz = await prisma.quiz.findUnique({ where: { courseId } });
    if (!quiz) {
      return res.status(404).json({ message: "This course has no quiz yet" });
    }

    const latest = await latestAttemptsForQuiz(quiz.id);

    const ranked = latest
      .map((a) => ({
        studentId: a.studentId,
        studentName: a.student.name,
        score: a.score,
        totalQuestions: a.totalQuestions,
        attemptedAt: a.attemptedAt,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    return res.status(200).json({ message: "Leaderboard fetched", data: ranked });
  } catch (error) {
    logger.error({ error }, "Failed to fetch leaderboard");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- MENTOR ----------

// Teacher's performance dashboard: per-course quiz stats across their own courses
const getTeacherDashboard = async (req: Request, res: Response) => {
  try {
    const teacherId = req.user!.id;

    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: { quiz: true },
    });

    const dashboard = await Promise.all(
      courses.map(async (course) => {
        if (!course.quiz) {
          return {
            courseId: course.id,
            courseTitle: course.title,
            hasQuiz: false,
            totalAttempts: 0,
            uniqueStudents: 0,
            averageScorePct: null as number | null,
          };
        }

        const latest = await latestAttemptsForQuiz(course.quiz.id);
        const totalAttemptsCount = await prisma.quizAttempt.count({ where: { quizId: course.quiz.id } });

        const avgPct =
          latest.length > 0
            ? Math.round(
                (latest.reduce((sum, a) => sum + (a.totalQuestions > 0 ? a.score / a.totalQuestions : 0), 0) /
                  latest.length) *
                  100
              )
            : null;

        return {
          courseId: course.id,
          courseTitle: course.title,
          hasQuiz: true,
          totalAttempts: totalAttemptsCount,
          uniqueStudents: latest.length,
          averageScorePct: avgPct,
        };
      })
    );

    return res.status(200).json({ message: "Teacher dashboard fetched", data: dashboard });
  } catch (error) {
    logger.error({ error }, "Failed to fetch teacher dashboard");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- ADMIN ----------

const getAdminDashboard = async (_req: Request, res: Response) => {
  try {
    const [totalUsers, totalStudents, totalMentors, totalCourses, totalQuizzes, totalAttempts, bannedUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.user.count({ where: { role: "MENTOR" } }),
        prisma.course.count(),
        prisma.quiz.count(),
        prisma.quizAttempt.count(),
        prisma.user.count({ where: { isBanned: true } }),
      ]);

    return res.status(200).json({
      message: "Admin dashboard fetched",
      data: { totalUsers, totalStudents, totalMentors, totalCourses, totalQuizzes, totalAttempts, bannedUsers },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch admin dashboard");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { getStudentProgress, getLeaderboard, getTeacherDashboard, getAdminDashboard };
