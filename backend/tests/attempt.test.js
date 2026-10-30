
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_SECRET = "automated-test-secret";

const { default: app } = await import("../src/app.js");
const { default: User } = await import("../src/models/User.js");
const { default: Quiz } = await import("../src/models/Quiz.js");
const { default: Attempt } = await import("../src/models/Attempt.js");

let mongo;
let teacher;
let student;
let otherStudent;
let quiz;
let token;
let otherToken;

const makeToken = (user) =>
  jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

async function createQuiz({
  startTime = new Date(Date.now() - 60_000),
  endTime = new Date(Date.now() + 60 * 60_000),
  durationMinutes = 20,
  status = "PUBLISHED",
} = {}) {
  return Quiz.create({
    title: "JavaScript Test Quiz",
    description: "Automated test quiz",
    createdBy: teacher._id,
    startTime,
    endTime,
    durationMinutes,
    status,
    shuffleQuestions: false,
    questions: [
      {
        text: "Which are JavaScript primitive types?",
        type: "MULTIPLE",
        options: [
          { text: "string" },
          { text: "boolean" },
          { text: "HTML" },
        ],
        marks: 5,
        // These are MongoDB option IDs, not array indexes.
        correctAnswers: [],
      },
    ],
  }).then(async (createdQuiz) => {
    // Assign answer keys using the generated option IDs.
    const question = createdQuiz.questions[0];
    question.correctAnswers = [
      question.options[0]._id,
      question.options[1]._id,
    ];
    await createdQuiz.save();
    return createdQuiz;
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Quiz.deleteMany({}),
    Attempt.deleteMany({}),
  ]);

  teacher = await User.create({
    name: "Test Teacher",
    email: "teacher@example.com",
    passwordHash: "not-used-in-these-tests",
    role: "TEACHER",
  });

  student = await User.create({
    name: "Test Student",
    email: "student@example.com",
    passwordHash: "not-used-in-these-tests",
    role: "STUDENT",
  });

  otherStudent = await User.create({
    name: "Other Student",
    email: "other@example.com",
    passwordHash: "not-used-in-these-tests",
    role: "STUDENT",
  });

  token = makeToken(student);
  otherToken = makeToken(otherStudent);

  quiz = await createQuiz();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("Quiz attempt API", () => {
  test("1. rejects requests without authentication", async () => {
    const response = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`);

    expect(response.status).toBe(401);
  });

  test("2. allows a student to start a published quiz", async () => {
    const response = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body.attempt.status).toBe("IN_PROGRESS");
    expect(response.body.attempt.deadline).toBeDefined();
    expect(response.body.attempt.questionOrder).toHaveLength(1);
  });

  test("3. prevents a student from starting the same quiz twice", async () => {
    await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const response = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(409);
  });

  test("4. does not expose correct answers in the attempt questions", async () => {
    const start = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const response = await request(app)
      .get(`/api/attempts/${start.body.attempt.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.questions).toHaveLength(1);
    expect(response.body.questions[0].options).toHaveLength(3);
    expect(response.body.questions[0]).not.toHaveProperty("correctAnswers");
    expect(response.body.questions[0]).not.toHaveProperty("correctOptions");
  });

  test("5. rejects an option that does not belong to the question", async () => {
    const start = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const question = quiz.questions[0];

    const response = await request(app)
      .put(`/api/attempts/${start.body.attempt.id}/answers`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        questionId: question._id,
        selectedOptions: [new mongoose.Types.ObjectId().toString()],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/selected options/i);
  });

  test("6. prevents a different student from accessing an attempt", async () => {
    const start = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const response = await request(app)
      .get(`/api/attempts/${start.body.attempt.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(response.status).toBe(404);
  });

  test("7. grades correct answers on the server at submission", async () => {
    const start = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const question = quiz.questions[0];
    const correctOptionIds = question.options
      .slice(0, 2)
      .map((option) => String(option._id));

    await request(app)
      .put(`/api/attempts/${start.body.attempt.id}/answers`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        questionId: String(question._id),
        selectedOptions: correctOptionIds,
      })
      .expect(200);

    const response = await request(app)
      .post(`/api/attempts/${start.body.attempt.id}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.attempt.status).toBe("SUBMITTED");
    expect(response.body.attempt.score).toBe(5);
    expect(response.body.attempt.totalMarks).toBe(5);
  });

  test("8. rejects answer changes after the server deadline", async () => {
    const start = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    await Attempt.updateOne(
      { _id: start.body.attempt.id },
      { $set: { deadline: new Date(Date.now() - 1_000) } }
    );

    const question = quiz.questions[0];

    const response = await request(app)
      .put(`/api/attempts/${start.body.attempt.id}/answers`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        questionId: String(question._id),
        selectedOptions: [String(question.options[0]._id)],
      });

    expect(response.status).toBe(403);

    const savedAttempt = await Attempt.findById(start.body.attempt.id);
    expect(savedAttempt.status).toBe("AUTO_SUBMITTED");
  });

  test("9. hides correct answers until the quiz window closes", async () => {
    const start = await request(app)
      .post(`/api/quizzes/${quiz._id}/start`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    await request(app)
      .post(`/api/attempts/${start.body.attempt.id}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const result = await request(app)
      .get(`/api/attempts/${start.body.attempt.id}/result`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(result.body.result.answersRevealed).toBe(false);
    expect(result.body.result.questions[0]).not.toHaveProperty(
      "correctOptions"
    );
  });
});
