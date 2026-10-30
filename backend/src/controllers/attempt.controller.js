
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import Attempt from "../models/Attempt.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const sameId = (a, b) => String(a) === String(b);

const shuffle = (items) => {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

const getQuizWithAnswers = (quizId) =>
  Quiz.findById(quizId).select("+questions.correctAnswers");

const getAttemptForStudent = async (attemptId, studentId) => {
  if (!isValidId(attemptId)) return null;

  return Attempt.findOne({
    _id: attemptId,
    studentId,
  });
};

// Grade on the server. A question earns marks only if the
// selected answer IDs exactly match its correct answer IDs.
const calculateScore = (quiz, attempt) => {
  let score = 0;

  for (const answer of attempt.answers) {
    const question = quiz.questions.find((q) =>
      sameId(q._id, answer.questionId)
    );

    if (!question) continue;

    const correct = question.correctAnswers.map(String).sort();
    const selected = answer.selectedOptions.map(String).sort();

    if (
      correct.length === selected.length &&
      correct.every((id, index) => id === selected[index])
    ) {
      score += question.marks;
    }
  }

  return score;
};

const finalizeAttempt = async (attempt, quiz, autoSubmitted = false) => {
  if (attempt.status !== "IN_PROGRESS") return attempt;

  const submittedAt = new Date();

  attempt.score = calculateScore(quiz, attempt);
  attempt.totalMarks = quiz.questions.reduce(
    (total, question) => total + question.marks,
    0
  );
  attempt.submittedAt = submittedAt;
  attempt.timeTakenSeconds = Math.max(
    0,
    Math.floor((submittedAt - attempt.startedAt) / 1000)
  );
  attempt.status = autoSubmitted ? "AUTO_SUBMITTED" : "SUBMITTED";

  await attempt.save();
  return attempt;
};

const ensureNotExpired = async (attempt) => {
  if (attempt.status !== "IN_PROGRESS") return attempt;

  if (Date.now() >= new Date(attempt.deadline).getTime()) {
    const quiz = await getQuizWithAnswers(attempt.quizId);

    if (quiz) {
      return finalizeAttempt(attempt, quiz, true);
    }
  }

  return attempt;
};

// POST /api/quizzes/:id/start
export const startAttempt = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;

    if (!isValidId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz || quiz.status !== "PUBLISHED") {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const now = new Date();

    if (now < quiz.startTime) {
      return res.status(403).json({
        message: "This quiz has not started yet.",
        startTime: quiz.startTime,
      });
    }

    if (now >= quiz.endTime) {
      return res.status(403).json({
        message: "The quiz window has closed.",
      });
    }

    const existing = await Attempt.findOne({
      quizId: quiz._id,
      studentId: req.user._id,
    });

    if (existing) {
      return res.status(409).json({
        message: "You have already started this quiz.",
        attemptId: existing._id,
        status: existing.status,
      });
    }

    const startedAt = new Date();
    const durationDeadline = new Date(
      startedAt.getTime() + quiz.durationMinutes * 60 * 1000
    );
    const deadline = new Date(
      Math.min(durationDeadline.getTime(), quiz.endTime.getTime())
    );

    let questionOrder = quiz.questions.map((question) => question._id);

    if (quiz.shuffleQuestions) {
      questionOrder = shuffle(questionOrder);
    }

    const totalMarks = quiz.questions.reduce(
      (total, question) => total + question.marks,
      0
    );

    const attempt = await Attempt.create({
      quizId: quiz._id,
      studentId: req.user._id,
      startedAt,
      deadline,
      answers: [],
      status: "IN_PROGRESS",
      totalMarks,
      questionOrder,
    });

    return res.status(201).json({
      message: "Quiz attempt started.",
      attempt: {
        id: attempt._id,
        quizId: attempt.quizId,
        startedAt: attempt.startedAt,
        deadline: attempt.deadline,
        status: attempt.status,
        questionOrder: attempt.questionOrder,
      },
      serverNow: new Date(),
    });
  } catch (error) {
    // The compound unique index also protects against simultaneous starts.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already attempted this quiz.",
      });
    }

    next(error);
  }
};

// GET /api/attempts/:id
export const getAttempt = async (req, res, next) => {
  try {
    let attempt = await getAttemptForStudent(
      req.params.id,
      req.user._id
    );

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found." });
    }

    attempt = await ensureNotExpired(attempt);
    
    const quiz = await Quiz.findById(attempt.quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const questionsById = new Map(
      quiz.questions.map((question) => [
        question._id.toString(),
        question,
      ])
    );

    const questions = attempt.questionOrder
      .map((questionId) => questionsById.get(questionId.toString()))
      .filter(Boolean)
      .map((question) => ({
        id: question._id.toString(),
        text: question.text,
        type: question.type,
        marks: question.marks,
        options: question.options.map((option) => ({
          id: option._id.toString(),
          text: option.text,
        })),
      }));

    return res.json({
      attempt: {
        id: attempt._id,
        quizId: attempt.quizId,
        status: attempt.status,
        startedAt: attempt.startedAt,
        deadline: attempt.deadline,
        submittedAt: attempt.submittedAt,
        score: attempt.status === "IN_PROGRESS" ? undefined : attempt.score,
        totalMarks: attempt.totalMarks,
        timeTakenSeconds: attempt.timeTakenSeconds,
      },
      quiz: { id: quiz._id, title: quiz.title },
      questions,
      serverNow: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/attempts/:id/answers
// Body: { "questionId": "...", "selectedOptions": ["..."] }
export const saveAnswer = async (req, res, next) => {
  try {
    let attempt = await getAttemptForStudent(
      req.params.id,
      req.user._id
    );

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found." });
    }

    attempt = await ensureNotExpired(attempt);

    if (attempt.status !== "IN_PROGRESS") {
      return res.status(403).json({
        message: "This attempt is already closed.",
        status: attempt.status,
      });
    }

    const { questionId, selectedOptions } = req.body;

    if (
      !isValidId(questionId) ||
      !Array.isArray(selectedOptions) ||
      selectedOptions.some((id) => !isValidId(id)) ||
      new Set(selectedOptions.map(String)).size !== selectedOptions.length
    ) {
      return res.status(400).json({
        message: "Provide a valid questionId and unique selectedOptions IDs.",
      });
    }

    if (!attempt.questionOrder.some((id) => sameId(id, questionId))) {
      return res.status(400).json({
        message: "This question does not belong to the attempt.",
      });
    }

    const quiz = await Quiz.findById(attempt.quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const question = quiz.questions.find((q) =>
      sameId(q._id, questionId)
    );

    if (!question) {
      return res.status(400).json({ message: "Invalid question." });
    }

    const validOptionIds = new Set(
      question.options.map((option) => String(option._id))
    );

    if (selectedOptions.some((id) => !validOptionIds.has(String(id)))) {
      return res.status(400).json({
        message: "One or more selected options do not belong to this question.",
      });
    }

    if (question.type === "SINGLE" && selectedOptions.length > 1) {
      return res.status(400).json({
        message: "Select only one option for this question.",
      });
    }

    const existingAnswer = attempt.answers.find((answer) =>
      sameId(answer.questionId, questionId)
    );

    if (existingAnswer) {
      existingAnswer.selectedOptions = selectedOptions;
    } else {
      attempt.answers.push({
        questionId,
        selectedOptions,
      });
    }

    await attempt.save();

    return res.json({
      message: "Answer saved.",
      questionId,
      selectedOptions,
      deadline: attempt.deadline,
      serverNow: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/attempts/:id/submit
export const submitAttempt = async (req, res, next) => {
  try {
    let attempt = await getAttemptForStudent(
      req.params.id,
      req.user._id
    );

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found." });
    }

    if (attempt.status !== "IN_PROGRESS") {
      return res.json({
        message: "Attempt has already been submitted.",
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
      });
    }

    const quiz = await getQuizWithAnswers(attempt.quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const expired = Date.now() >= new Date(attempt.deadline).getTime();

    attempt = await finalizeAttempt(attempt, quiz, expired);

    return res.json({
      message: expired
        ? "Time expired. Your attempt was auto-submitted."
        : "Quiz submitted successfully.",
      attempt: {
        id: attempt._id,
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        submittedAt: attempt.submittedAt,
        timeTakenSeconds: attempt.timeTakenSeconds,
      },
      answersRevealed: Date.now() >= new Date(quiz.endTime).getTime(),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/attempts/:id/result
export const getAttemptResult = async (req, res, next) => {
  try {
    let attempt = await getAttemptForStudent(
      req.params.id,
      req.user._id
    );

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found." });
    }

    attempt = await ensureNotExpired(attempt);

    if (attempt.status === "IN_PROGRESS") {
      return res.status(403).json({
        message: "Submit your attempt before viewing the result.",
      });
    }

    const quiz = await getQuizWithAnswers(attempt.quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const answersRevealed = Date.now() >= new Date(quiz.endTime).getTime();

    const resultQuestions = quiz.questions.map((question) => {
      const answer = attempt.answers.find((item) =>
        sameId(item.questionId, question._id)
      );

      const result = {
        questionId: question._id,
        text: question.text,
        marks: question.marks,
        selectedOptions: answer?.selectedOptions ?? [],
      };

      if (answersRevealed) {
        result.correctOptions = question.correctAnswers;
      }

      return result;
    });

    return res.json({
      result: {
        attemptId: attempt._id,
        quizId: quiz._id,
        status: attempt.status,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        submittedAt: attempt.submittedAt,
        timeTakenSeconds: attempt.timeTakenSeconds,
        answersRevealed,
        questions: resultQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/quizzes/:id/leaderboard
export const getLeaderboard = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;

    if (!isValidId(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID." });
    }

    const quiz = await Quiz.findById(quizId).select("title status");

    if (!quiz || quiz.status !== "PUBLISHED") {
      return res.status(404).json({ message: "Quiz not found." });
    }

    const attempts = await Attempt.find({
      quizId,
      status: { $in: ["SUBMITTED", "AUTO_SUBMITTED"] },
    })
      .populate("studentId", "name")
      .sort({ score: -1, timeTakenSeconds: 1, submittedAt: 1 })
      .limit(100)
      .lean();

    return res.json({
      quiz: { id: quiz._id, title: quiz.title },
      leaderboard: attempts.map((attempt, index) => ({
        rank: index + 1,
        student: attempt.studentId?.name ?? "Student",
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        timeTakenSeconds: attempt.timeTakenSeconds,
        submittedAt: attempt.submittedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Called by a server-side scheduler to finalize attempts even when
// the student closes their browser.
export const expireDueAttempts = async () => {
  const dueAttempts = await Attempt.find({
    status: "IN_PROGRESS",
    deadline: { $lte: new Date() },
  }).limit(200);

  for (const attempt of dueAttempts) {
    try {
      const quiz = await getQuizWithAnswers(attempt.quizId);
      if (quiz) await finalizeAttempt(attempt, quiz, true);
    } catch (error) {
      console.error("Could not auto-submit attempt:", attempt._id, error);
    }
  }
};
