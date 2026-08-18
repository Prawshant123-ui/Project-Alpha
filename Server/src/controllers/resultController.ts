import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

const latestAttemptsForQuiz = (quizId: string) =>
  prisma.quizAttempt.findMany({
    where: { quizId },
    orderBy: { attemptedAt: "desc" },
    distinct: ["studentId"],
    include: { student: { select: { id: true, name: true } } },
  });




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



const getAdminDashboard = async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalMentors,
      totalAdmins,
      bannedUsers,
      newUsersLast7Days,
      newUsersLast30Days,
      totalCourses,
      newCoursesLast7Days,
      totalQuizzes,
      totalAttempts,
      attemptsLast7Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "MENTOR" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.course.count(),
      prisma.course.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.quiz.count(),
      prisma.quizAttempt.count(),
      prisma.quizAttempt.count({ where: { attemptedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    
    const distinctAttemptStudents = await prisma.quizAttempt.findMany({
      distinct: ["studentId"],
      select: { studentId: true },
    });

    
    const coursesByDomainRaw = await prisma.course.groupBy({
      by: ["domain"],
      _count: { domain: true },
      orderBy: { _count: { domain: "desc" } },
    });
    const coursesByDomain = coursesByDomainRaw.map((d) => ({ domain: d.domain, count: d._count.domain }));

   
    const topMentorsRaw = await prisma.course.groupBy({
      by: ["teacherId"],
      _count: { teacherId: true },
      orderBy: { _count: { teacherId: "desc" } },
      take: 5,
    });
    const topMentorIds = topMentorsRaw.map((m) => m.teacherId);
    const topMentorUsers = await prisma.user.findMany({
      where: { id: { in: topMentorIds } },
      select: { id: true, name: true, email: true },
    });
    const topMentors = topMentorsRaw.map((m) => {
      const mentor = topMentorUsers.find((u) => u.id === m.teacherId);
      return {
        mentorId: m.teacherId,
        name: mentor?.name ?? "Unknown",
        email: mentor?.email ?? "",
        coursesPublished: m._count.teacherId,
      };
    });

    
    const signupTrendRaw = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") as date, COUNT(*)::bigint as count
      FROM "User"
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY date
      ORDER BY date ASC
    `;
    const signupTrend = signupTrendRaw.map((row) => ({ date: row.date, count: Number(row.count) }));

    
    const avgScoreRaw = await prisma.$queryRaw<{ avgpct: number | null }[]>`
      SELECT AVG(CASE WHEN "totalQuestions" > 0 THEN (score::float / "totalQuestions") * 100 ELSE NULL END) as avgpct
      FROM "QuizAttempt"
    `;
    const averageScorePct = avgScoreRaw[0]?.avgpct != null ? Math.round(avgScoreRaw[0].avgpct) : null;

  
    const recentSignups = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return res.status(200).json({
      message: "Admin dashboard fetched",
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          mentors: totalMentors,
          admins: totalAdmins,
          banned: bannedUsers,
          newLast7Days: newUsersLast7Days,
          newLast30Days: newUsersLast30Days,
        },
        courses: {
          total: totalCourses,
          newLast7Days: newCoursesLast7Days,
          byDomain: coursesByDomain,
        },
        engagement: {
          totalQuizzes,
          totalAttempts,
          attemptsLast7Days,
          activeLearners: distinctAttemptStudents.length,
          averageScorePct,
        },
        topMentors,
        signupTrend,
        recentSignups,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch admin dashboard");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { getStudentProgress, getLeaderboard, getTeacherDashboard, getAdminDashboard };

