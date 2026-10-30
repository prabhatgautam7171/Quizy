
import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Option text is required"],
      trim: true,
      maxlength: [200, "Option cannot exceed 200 characters"],
    },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      maxlength: [2000, "Question cannot exceed 2000 characters"],
    },

    type: {
      type: String,
      enum: ["SINGLE", "MULTIPLE"],
      required: true,
    },

    options: {
      type: [optionSchema],
      validate: {
        validator: (options) => options.length >= 2 && options.length <= 6,
        message: "Each question must have between 2 and 6 options",
      },
    },

    correctAnswers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
        },
      ],
      required: true,
      select: false,
    },

    marks: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 1,
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      minlength: 3,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    questions: {
      type: [questionSchema],
      validate: {
        validator: (questions) =>
          questions.length >= 1 && questions.length <= 100,
        message: "A quiz must contain between 1 and 100 questions",
      },
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 300,
    },

    shuffleQuestions: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED"],
      default: "DRAFT",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

quizSchema.index({ status: 1, startTime: 1, endTime: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
