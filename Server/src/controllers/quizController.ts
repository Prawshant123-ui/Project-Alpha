import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";


const createQuiz = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const { title } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.teacherId !== req.user!.id) {
      return res.status(403).json({ message: "You do not own this course" });
    }

    const existing = await prisma.quiz.findUnique({ where: { courseId } });
    if (existing) {
      return res.status(409).json({ message: "This course already has a quiz. Edit it instead." });
    }

    const quiz = await prisma.quiz.create({
      data: { courseId, title: title ?? `${course.title} Quiz` },
    });

    logger.info({ quizId: quiz.id, courseId }, "Quiz created");
    return res.status(201).json({ message: "Quiz created", data: quiz });
  } catch (error) {
    logger.error({ error }, "Failed to create quiz");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteQuiz = async (req: Request, res: Response) => {
  try {
    const quizId = req.params.quizId as string;

    const quiz = await prisma.quiz.findUnique({ include: { course: true }, where: { id: quizId } });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.course.teacherId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "You do not own this quiz" });
    }

    await prisma.quiz.delete({ where: { id: quizId } });

    logger.info({ quizId }, "Quiz deleted");
    return res.status(200).json({ message: "Quiz deleted" });
  } catch (error) {
    logger.error({ error }, "Failed to delete quiz");
    return res.status(500).json({ message: "Internal server error" });
  }
};



const addQuestion = async (req: Request, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const { text, options } = req.body as {
      text: string;
      options: { text: string; isCorrect: boolean }[];
    };

    const quiz = await prisma.quiz.findUnique({ include: { course: true }, where: { id: quizId } });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    if (quiz.course.teacherId !== req.user!.id) {
      return res.status(403).json({ message: "You do not own this quiz" });
    }

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      return res.status(400).json({ message: "Exactly one option must be marked correct" });
    }

    const question = await prisma.question.create({
      data: {
        quizId,
        text,
        options: { create: options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) },
      },
      include: { options: true },
    });

    logger.info({ questionId: question.id, quizId }, "Question added");
    return res.status(201).json({ message: "Question added", data: question });
  } catch (error) {
    logger.error({ error }, "Failed to add question");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = req.params.questionId as string;
    const { text, options } = req.body as {
      text?: string;
      options?: { id?: string; text: string; isCorrect: boolean }[];
    };

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: { include: { course: true } } },
    });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    if (question.quiz.course.teacherId !== req.user!.id) {
      return res.status(403).json({ message: "You do not own this question" });
    }

    if (options) {
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        return res.status(400).json({ message: "Exactly one option must be marked correct" });
      }
      // Replace all options wholesale — simpler and avoids partial-id mismatches
      await prisma.option.deleteMany({ where: { questionId } });
      await prisma.option.createMany({
        data: options.map((o) => ({ questionId, text: o.text, isCorrect: o.isCorrect })),
      });
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { ...(text && { text }) },
      include: { options: true },
    });

    logger.info({ questionId }, "Question updated");
    return res.status(200).json({ message: "Question updated", data: updated });
  } catch (error) {
    logger.error({ error }, "Failed to update question");
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = req.params.questionId as string;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: { include: { course: true } } },
    });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    if (question.quiz.course.teacherId !== req.user!.id) {
      return res.status(403).json({ message: "You do not own this question" });
    }

    await prisma.question.delete({ where: { id: questionId } });

    logger.info({ questionId }, "Question deleted");
    return res.status(200).json({ message: "Question deleted" });
  } catch (error) {
    logger.error({ error }, "Failed to delete question");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------- STUDENT: TAKE QUIZ ----------

// Get a quiz to take — correct answers are stripped out
const getQuizForAttempt = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId as string;

    const quiz = await prisma.quiz.findUnique({
      where: { courseId },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            options: { select: { id: true, text: true } }, // isCorrect deliberately omitted
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "This course has no quiz yet" });
    }

    return res.status(200).json({ message: "Quiz fetched", data: quiz });
  } catch (error) {
    logger.error({ error }, "Failed to fetch quiz for attempt");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Submit answers, score server-side, store as latest attempt
const submitQuizAttempt = async (req: Request, res: Response) => {
  try {
    const quizId = req.params.quizId as string;
    const studentId = req.user!.id;
    const { answers } = req.body as { answers: Record<string, string> }; // { questionId: optionId }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { options: true } } },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let score = 0;
    for (const question of quiz.questions) {
      const selectedOptionId = answers[question.id];
      const correctOption = question.options.find((o) => o.isCorrect);
      if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
        score += 1;
      }
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        score,
        totalQuestions: quiz.questions.length,
        answers,
      },
    });

    logger.info({ quizId, studentId, score, total: quiz.questions.length }, "Quiz attempt submitted");

    return res.status(201).json({
      message: "Quiz submitted",
      data: { score, totalQuestions: quiz.questions.length, attemptId: attempt.id },
    });
  } catch (error) {
    logger.error({ error }, "Failed to submit quiz attempt");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizForAttempt,
  submitQuizAttempt,
};
