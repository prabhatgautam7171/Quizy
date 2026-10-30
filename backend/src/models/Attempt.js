
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Store selected option IDs, not option text.
    selectedOptions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Server-generated timestamps.
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    deadline: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    answers: {
      type: [answerSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "AUTO_SUBMITTED"],
      default: "IN_PROGRESS",
      index: true,
    },

    score: {
      type: Number,
      default: null,
      min: 0,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    timeTakenSeconds: {
      type: Number,
      default: null,
      min: 0,
    },

    // Preserve question order for shuffled quizzes and refreshes.
    questionOrder: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
        },
      ],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Enforce one attempt per student per quiz at the database level.
attemptSchema.index(
  { quizId: 1, studentId: 1 },
  { unique: true }
);

attemptSchema.index({ quizId: 1, status: 1, score: -1 });

const Attempt = mongoose.model("Attempt", attemptSchema);

export default Attempt;
