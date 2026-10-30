
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import { quizSchema } from "../validators/quiz.validator.js";
import Attempt from "../models/Attempt.js";

function sendValidationError(res, error) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

function serializeQuiz(quiz, includeAnswers = false) {
  const result = quiz.toObject();

  result.availability =
    result.status !== "PUBLISHED"
      ? "draft"
      : Date.now() < new Date(result.startTime).getTime()
        ? "upcoming"
        : Date.now() >= new Date(result.endTime).getTime()
          ? "closed"
          : "active";

  if (result.questions) {
    result.questions = result.questions.map((question) => {
      if (!includeAnswers) {
        delete question.correctAnswers;
      }

      return question;
    });
  }

  return result;
}

function quizToInput(quiz) {
  return {
    title: quiz.title,
    description: quiz.description,
    startTime: quiz.startTime,
    endTime: quiz.endTime,
    durationMinutes: quiz.durationMinutes,
    shuffleQuestions: quiz.shuffleQuestions,
    questions: quiz.questions.map((question) => {
      const answerIds = (question.correctAnswers || []).map(String);

      return {
        text: question.text,
        type: question.type,
        options: question.options.map((option) => ({
          text: option.text,
        })),
        correctAnswers: question.options.reduce(
          (indexes, option, index) =>
            answerIds.includes(String(option._id))
              ? [...indexes, index]
              : indexes,
          []
        ),
        marks: question.marks,
      };
    }),
  };
}

function applyQuestionInput(quiz, questions) {
  quiz.questions = questions.map(({ correctAnswers, ...question }) => question);

  quiz.questions.forEach((question, index) => {
    question.correctAnswers = questions[index].correctAnswers.map(
      (optionIndex) => question.options[optionIndex]._id
    );
  });
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// POST /api/quizzes
export async function createQuiz(req, res, next) {
  try {
    const parsed = quizSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendValidationError(res, parsed.error);
    }

    const input = parsed.data;

    const quiz = new Quiz({
      title: input.title,
      description: input.description,
      createdBy: req.user._id,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes: input.durationMinutes,
      shuffleQuestions: input.shuffleQuestions,
      status: "DRAFT",
      questions: [],
    });

    applyQuestionInput(quiz, input.questions);

    await quiz.save();

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz: serializeQuiz(quiz, true),
    });
  } catch (error) {
    next(error);
  }
}


// GET /api/quizzes
export async function getQuizzes(req, res, next) {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = {};

    if (req.user.role === "TEACHER") {
      filter.createdBy = req.user._id;

      if (req.query.status) {
        if (!["DRAFT", "PUBLISHED"].includes(req.query.status)) {
          return res.status(400).json({
            success: false,
            message: "Status must be DRAFT or PUBLISHED",
          });
        }

        filter.status = req.query.status;
      }
    } else {
      // Students can only discover published quizzes.
      filter.status = "PUBLISHED";
    }

    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100);

      if (search) {
        filter.title = {
          $regex: escapeRegex(search),
          $options: "i",
        };
      }
    }

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("createdBy", "name")
        .lean(),

      Quiz.countDocuments(filter),
    ]);

    // Fetch attempt statuses for the logged-in student only.
    let attemptStatusByQuizId = new Map();

    if (req.user.role === "STUDENT" && quizzes.length > 0) {
      const attempts = await Attempt.find({
        studentId: req.user._id,
        quizId: { $in: quizzes.map((quiz) => quiz._id) },
      })
        .select("quizId status")
        .lean();

      attemptStatusByQuizId = new Map(
        attempts.map((attempt) => [
          attempt.quizId.toString(),
          attempt.status,
        ])
      );
    }

    const now = Date.now();

    const safeQuizzes = quizzes.map((quiz) => {
      if (quiz.questions) {
        quiz.questions = quiz.questions.map((question) => {
          delete question.correctAnswers;
          return question;
        });
      }

      quiz.availability =
        now < new Date(quiz.startTime).getTime()
          ? "upcoming"
          : now >= new Date(quiz.endTime).getTime()
            ? "closed"
            : "active";

      // Attempt status comes from the Attempt collection, not Quiz.
      quiz.attemptStatus =
        req.user.role === "STUDENT"
          ? attemptStatusByQuizId.get(quiz._id.toString()) ?? null
          : null;

      return quiz;
    });

    return res.status(200).json({
      success: true,
      quizzes: safeQuizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}


// GET /api/quizzes/:id
export async function getQuizById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID",
      });
    }

    const quiz = await Quiz.findById(id)
      .select("+questions.correctAnswers")
      .populate("createdBy", "name");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const isOwner =
      req.user.role === "TEACHER" &&
      String(quiz.createdBy._id) === String(req.user._id);

    if (quiz.status !== "PUBLISHED" && !isOwner) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    return res.status(200).json({
      success: true,
      quiz: serializeQuiz(quiz, isOwner),
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/quizzes/:id
// Only the owner can update a draft.
export async function updateQuiz(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID",
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      createdBy: req.user._id,
    }).select("+questions.correctAnswers");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Only draft quizzes can be updated",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "startTime",
      "endTime",
      "durationMinutes",
      "shuffleQuestions",
      "questions",
    ];

    const suppliedFields = Object.keys(req.body || {});

    if (
      suppliedFields.length === 0 ||
      suppliedFields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide valid quiz fields to update",
      });
    }

    const mergedInput = {
      ...quizToInput(quiz),
      ...req.body,
    };

    const parsed = quizSchema.safeParse(mergedInput);

    if (!parsed.success) {
      return sendValidationError(res, parsed.error);
    }

    const input = parsed.data;

    quiz.title = input.title;
    quiz.description = input.description;
    quiz.startTime = input.startTime;
    quiz.endTime = input.endTime;
    quiz.durationMinutes = input.durationMinutes;
    quiz.shuffleQuestions = input.shuffleQuestions;

    applyQuestionInput(quiz, input.questions);

    await quiz.save();

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      quiz: serializeQuiz(quiz, true),
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/quizzes/:id/publish
export async function publishQuiz(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID",
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Only draft quizzes can be published",
      });
    }

    if (quiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Add at least one question before publishing",
      });
    }

    if (quiz.startTime >= quiz.endTime) {
      return res.status(400).json({
        success: false,
        message: "Quiz end time must be after its start time",
      });
    }

    if (quiz.endTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish a quiz whose end time has passed",
      });
    }

    quiz.status = "PUBLISHED";
    await quiz.save();

    return res.status(200).json({
      success: true,
      message: "Quiz published successfully",
      quiz: serializeQuiz(quiz),
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/quizzes/:id
export async function deleteQuiz(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID",
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (quiz.status !== "DRAFT") {
      return res.status(409).json({
        success: false,
        message: "Only draft quizzes can be deleted",
      });
    }

    await quiz.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
