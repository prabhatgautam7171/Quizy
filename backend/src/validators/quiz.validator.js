
import { z } from "zod";

const questionSchema = z
  .object({
    text: z.string().trim().min(1).max(2000),

    type: z.enum(["SINGLE", "MULTIPLE"]),

    options: z
      .array(
        z.object({
          text: z.string().trim().min(1).max(200),
        })
      )
      .min(2)
      .max(6),

    // Zero-based indexes into options, e.g. [0] or [0, 2].
    correctAnswers: z
      .array(z.number().int().min(0).max(5))
      .min(1)
      .max(6),

    marks: z.number().int().min(1).max(100).default(1),
  })
  .superRefine((question, ctx) => {
    if (new Set(question.correctAnswers).size !== question.correctAnswers.length) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswers"],
        message: "Correct answer indexes must be unique",
      });
    }

    if (question.correctAnswers.some((index) => index >= question.options.length)) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswers"],
        message: "A correct answer index does not match an option",
      });
    }

    if (
      question.type === "SINGLE" &&
      question.correctAnswers.length !== 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswers"],
        message: "Single-answer questions must have exactly one correct answer",
      });
    }

    if (
      question.type === "MULTIPLE" &&
      question.correctAnswers.length < 2
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["correctAnswers"],
        message: "Multiple-answer questions must have at least two correct answers",
      });
    }
  });

export const quizSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(1000).default(""),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    durationMinutes: z.number().int().min(1).max(300),
    shuffleQuestions: z.boolean().default(false),
    questions: z.array(questionSchema).min(1).max(100),
  })
  .superRefine((quiz, ctx) => {
    if (quiz.startTime >= quiz.endTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time",
      });
    }
  });
