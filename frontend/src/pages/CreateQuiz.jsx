
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Clock3,
  CalendarDays,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Save,
  FileQuestion,
  Sparkles,
  CircleAlert,
  Settings2,
  ChevronRight,
  Eye,
  ListChecks,
  X,
  GraduationCap,
  Check,
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const prefilledQuestions = [
  {
    text: "Which hook is used to manage state in a React functional component?",
    type: "SINGLE",
    options: ["useEffect", "useState", "useRef", "useMemo"],
    correctAnswers: [1],
    marks: 2,
  },
  {
    text: "Which statements about React props are correct?",
    type: "MULTIPLE",
    options: [
      "Props pass data between components",
      "Props should be treated as read-only",
      "Props automatically update the parent component",
      "Props can contain callback functions",
    ],
    correctAnswers: [0, 1, 3],
    marks: 3,
  },
  {
    text: "What does the useEffect hook commonly handle?",
    type: "SINGLE",
    options: [
      "Defining CSS classes",
      "Side effects in components",
      "Creating database tables",
      "Declaring JavaScript classes",
    ],
    correctAnswers: [1],
    marks: 2,
  },
  {
    text: "Which method is commonly used to send a GET request with Axios?",
    type: "SINGLE",
    options: ["axios.create()", "axios.get()", "axios.push()", "axios.fetchData()"],
    correctAnswers: [1],
    marks: 2,
  },
  {
    text: "Which features are provided by Node.js?",
    type: "MULTIPLE",
    options: [
      "A JavaScript runtime",
      "Access to filesystem APIs",
      "A built-in relational database",
      "Asynchronous I/O capabilities",
    ],
    correctAnswers: [0, 1, 3],
    marks: 3,
  },
  {
    text: "Which Node.js module is commonly used to create an HTTP server?",
    type: "SINGLE",
    options: ["http", "path", "crypto", "events"],
    correctAnswers: [0],
    marks: 2,
  },
  {
    text: "In Express.js, what does next() usually do in middleware?",
    type: "SINGLE",
    options: [
      "Restarts the server",
      "Passes control to the next middleware",
      "Deletes the current request",
      "Closes the database",
    ],
    correctAnswers: [1],
    marks: 2,
  },
  {
    text: "Which HTTP status codes are commonly used correctly?",
    type: "MULTIPLE",
    options: [
      "200 for a successful request",
      "201 for a resource created",
      "404 when a resource is not found",
      "500 for successful authentication",
    ],
    correctAnswers: [0, 1, 2],
    marks: 3,
  },
  {
    text: "Which method retrieves multiple documents from a Mongoose model?",
    type: "SINGLE",
    options: ["find()", "save()", "deleteOne()", "populateOnly()"],
    correctAnswers: [0],
    marks: 2,
  },
  {
    text: "Which statements about MongoDB are correct?",
    type: "MULTIPLE",
    options: [
      "Documents are stored in BSON format",
      "Collections contain documents",
      "Every document must have the same optional fields",
      "MongoDB supports document-based data storage",
    ],
    correctAnswers: [0, 1, 3],
    marks: 3,
  },
  {
    text: "What is the primary purpose of a JWT in a typical authentication system?",
    type: "SINGLE",
    options: [
      "To encrypt every database document",
      "To carry signed claims between parties",
      "To replace password hashing",
      "To automatically create user accounts",
    ],
    correctAnswers: [1],
    marks: 2,
  },
  {
    text: "Which practices help protect user passwords?",
    type: "MULTIPLE",
    options: [
      "Hash passwords with a suitable password-hashing algorithm",
      "Store passwords as plain text",
      "Use bcrypt or Argon2",
      "Avoid logging passwords",
    ],
    correctAnswers: [0, 2, 3],
    marks: 3,
  },
  {
    text: "What does REST commonly use to identify resources?",
    type: "SINGLE",
    options: [
      "URLs and HTTP methods",
      "CSS selectors",
      "JavaScript comments",
      "Local component state",
    ],
    correctAnswers: [0],
    marks: 2,
  },
  {
    text: "Which practices improve API reliability and security?",
    type: "MULTIPLE",
    options: [
      "Validate incoming request data",
      "Return appropriate HTTP status codes",
      "Expose secret keys in frontend code",
      "Handle errors consistently",
    ],
    correctAnswers: [0, 1, 3],
    marks: 3,
  },
  {
    text: "What is the main purpose of a database index in MongoDB?",
    type: "SINGLE",
    options: [
      "To hash user passwords",
      "To improve the efficiency of supported queries",
      "To replace database validation",
      "To automatically remove duplicate documents in every case",
    ],
    correctAnswers: [1],
    marks: 3,
  },
];

const createQuestion = (question = {}) => ({
  id: crypto.randomUUID(),
  text: question.text ?? "",
  type: question.type ?? "SINGLE",
  options: question.options ? [...question.options] : ["", "", "", ""],
  correctAnswers: question.correctAnswers
    ? [...question.correctAnswers]
    : [],
  marks: question.marks ?? 1,
});

const toLocalDateTime = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function CreateQuiz() {
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: toLocalDateTime(new Date(Date.now() + 5 * 60000)),
    endTime: toLocalDateTime(new Date(Date.now() + 24 * 60 * 60000)),
    durationMinutes: 30,
    shuffleQuestions: false,
  });

  const [questions, setQuestions] = useState(() =>
    prefilledQuestions.map((question) => createQuestion(question))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Teacher-only frontend protection.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    let user = {};

    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "TEACHER") {
      navigate(user.role === "STUDENT" ? "/student" : "/login", {
        replace: true,
      });
      return;
    }

    setAuthorized(true);
  }, [navigate]);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateQuestion = (questionId, changes) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, ...changes }
          : question
      )
    );
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id !== questionId
          ? question
          : {
              ...question,
              options: question.options.map((option, index) =>
                index === optionIndex ? value : option
              ),
            }
      )
    );
  };

  const toggleCorrectAnswer = (question, optionIndex) => {
    const isSelected = question.correctAnswers.includes(optionIndex);

    let correctAnswers;

    if (question.type === "SINGLE") {
      correctAnswers = isSelected ? [] : [optionIndex];
    } else {
      correctAnswers = isSelected
        ? question.correctAnswers.filter((index) => index !== optionIndex)
        : [...question.correctAnswers, optionIndex];
    }

    updateQuestion(question.id, { correctAnswers });
  };

  const changeQuestionType = (question, type) => {
    updateQuestion(question.id, {
      type,
      correctAnswers:
        type === "SINGLE"
          ? question.correctAnswers.slice(0, 1)
          : question.correctAnswers,
    });
  };

  const addQuestion = () => {
    if (questions.length >= 100) {
      setError("A quiz can contain at most 100 questions.");
      return;
    }

    setError("");
    const newQuestion = createQuestion();

    setQuestions((current) => [...current, newQuestion]);
    setActiveQuestion(questions.length);
    setTimeout(() => {
      document
        .getElementById(`question-${newQuestion.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const removeQuestion = (questionId) => {
    if (questions.length === 1) {
      setError("A quiz must contain at least one question.");
      return;
    }

    const removedIndex = questions.findIndex(
      (question) => question.id === questionId
    );

    setQuestions((current) =>
      current.filter((question) => question.id !== questionId)
    );

    setActiveQuestion((current) => {
      if (removedIndex < current) return current - 1;
      if (removedIndex === current) return Math.max(0, current - 1);
      return current;
    });

    setError("");
  };

  const totalMarks = useMemo(
    () =>
      questions.reduce(
        (sum, question) => sum + Number(question.marks || 0),
        0
      ),
    [questions]
  );

  const completedQuestions = useMemo(
    () =>
      questions.filter(
        (question) =>
          question.text.trim() &&
          question.options.length >= 2 &&
          question.options.every((option) => option.trim()) &&
          question.correctAnswers.length > 0
      ).length,
    [questions]
  );

  const validateForm = () => {
    if (form.title.trim().length < 3) {
      return "Quiz title must contain at least 3 characters.";
    }

    if (!form.startTime || !form.endTime) {
      return "Choose both the quiz start and end time.";
    }

    if (new Date(form.startTime) >= new Date(form.endTime)) {
      return "The end time must be after the start time.";
    }

    if (new Date(form.endTime) <= new Date()) {
      return "The quiz end time must be in the future.";
    }

    if (
      Number(form.durationMinutes) < 1 ||
      Number(form.durationMinutes) > 300
    ) {
      return "Duration must be between 1 and 300 minutes.";
    }

    for (let i = 0; i < questions.length; i += 1) {
      const question = questions[i];

      if (!question.text.trim()) {
        return `Enter the text for question ${i + 1}.`;
      }

      if (question.options.length < 2 || question.options.length > 6) {
        return `Question ${i + 1} must have between 2 and 6 options.`;
      }

      if (question.options.some((option) => !option.trim())) {
        return `Fill in every option for question ${i + 1}.`;
      }

      if (
        new Set(
          question.options.map((option) => option.trim().toLowerCase())
        ).size !== question.options.length
      ) {
        return `Question ${i + 1} has duplicate options.`;
      }

      if (question.correctAnswers.length === 0) {
        return `Choose at least one correct answer for question ${i + 1}.`;
      }

      if (
        question.type === "MULTIPLE" &&
        question.correctAnswers.length < 2
      ) {
        return `A multiple-answer question needs at least two correct answers (question ${i + 1}).`;
      }

      if (
        Number(question.marks) < 1 ||
        Number(question.marks) > 100
      ) {
        return `Marks for question ${i + 1} must be between 1 and 100.`;
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      durationMinutes: Number(form.durationMinutes),
      shuffleQuestions: form.shuffleQuestions,
      questions: questions.map((question) => ({
        text: question.text.trim(),
        type: question.type,
        options: question.options.map((text) => ({
          text: text.trim(),
        })),
        correctAnswers: question.correctAnswers,
        marks: Number(question.marks),
      })),
    };

    setLoading(true);

    try {
      await axios.post(`${API_URL}/quizzes`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(
        "Your quiz has been saved as a draft. You can review and publish it from your dashboard."
      );

      setTimeout(() => {
        navigate("/teacher", { replace: true });
      }, 1200);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (err.response?.status === 403) {
        navigate("/student", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          JSON.stringify(err.response?.data?.issues ?? err.response?.data) ||
          "Unable to save quiz."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-900">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/teacher"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Back to teacher dashboard"
            >
              <ArrowLeft size={19} />
            </Link>

            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BookOpen size={19} />
              </span>
              <div>
                <p className="font-bold tracking-tight">QuizFlow</p>
                <p className="hidden text-[11px] text-slate-400 sm:block">
                  Assessment builder
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Draft in progress
            </span>

            <button
              type="button"
              onClick={() => navigate("/teacher")}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
            >
              Exit editor
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:py-10">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>Teacher workspace</span>
              <ChevronRight size={13} />
              <span>Quiz library</span>
              <ChevronRight size={13} />
              <span className="text-blue-600">New quiz</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Sparkles size={23} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Create a new quiz
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Design an assessment for your students.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <SummaryPill
              icon={FileQuestion}
              value={questions.length}
              label="Questions"
            />
            <SummaryPill
              icon={ListChecks}
              value={totalMarks}
              label="Total marks"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800"
          >
            <CircleAlert size={19} className="mt-0.5 shrink-0 text-red-600" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
            {/* Main editor */}
            <div className="min-w-0 space-y-7">
              {/* Quiz information */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeading
                  number="01"
                  icon={BookOpen}
                  title="Quiz information"
                  description="Give your assessment a clear identity."
                />

                <div className="space-y-5 p-5 sm:p-7">
                  <div>
                    <label
                      htmlFor="title"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Quiz title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={updateForm}
                      minLength={3}
                      maxLength={120}
                      required
                      placeholder="e.g. JavaScript Fundamentals"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                    <p className="mt-2 text-right text-xs text-slate-400">
                      {form.title.length}/120
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Description{" "}
                      <span className="font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={updateForm}
                      maxLength={1000}
                      rows={3}
                      placeholder="Describe what students will learn or practise in this assessment..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>
              </section>

              {/* Schedule */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeading
                  number="02"
                  icon={CalendarDays}
                  title="Schedule and settings"
                  description="Decide when students can access the quiz."
                />

                <div className="p-5 sm:p-7">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DateField
                      id="startTime"
                      label="Start date and time"
                      value={form.startTime}
                      onChange={updateForm}
                    />

                    <DateField
                      id="endTime"
                      label="End date and time"
                      value={form.endTime}
                      onChange={updateForm}
                    />
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="durationMinutes"
                        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                      >
                        <Clock3 size={16} className="text-slate-400" />
                        Time limit
                      </label>

                      <div className="relative">
                        <input
                          id="durationMinutes"
                          name="durationMinutes"
                          type="number"
                          min={1}
                          max={300}
                          value={form.durationMinutes}
                          onChange={updateForm}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 pr-20 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                          Minutes
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Choose between 1 and 300 minutes.
                      </p>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                      <input
                        type="checkbox"
                        name="shuffleQuestions"
                        checked={form.shuffleQuestions}
                        onChange={updateForm}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          Shuffle questions
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Show questions in a different order for students.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Questions */}
              <section>
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <FileQuestion size={17} />
                      </span>
                      <h2 className="text-xl font-bold tracking-tight">
                        Questions
                      </h2>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Write questions, add answer options, and mark the correct
                      answers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addQuestion}
                    disabled={questions.length >= 100}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus size={17} />
                    Add question
                  </button>
                </div>

                <div className="space-y-5">
                  {questions.map((question, questionIndex) => (
                    <QuestionEditor
                      key={question.id}
                      question={question}
                      questionIndex={questionIndex}
                      isActive={activeQuestion === questionIndex}
                      onActivate={() => setActiveQuestion(questionIndex)}
                      onUpdate={(changes) =>
                        updateQuestion(question.id, changes)
                      }
                      onUpdateOption={(optionIndex, value) =>
                        updateOption(question.id, optionIndex, value)
                      }
                      onToggleCorrect={() =>
                        toggleCorrectAnswer(question, arguments[0])
                      }
                      onChangeType={(type) =>
                        changeQuestionType(question, type)
                      }
                      onRemove={() => removeQuestion(question.id)}
                      canRemove={questions.length > 1}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={questions.length >= 100}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700 disabled:opacity-50"
                >
                  <Plus size={18} />
                  Add another question
                </button>
              </section>

              {/* Form actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/teacher"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200/70"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading || Boolean(success)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="animate-spin" size={18} />
                      Saving quiz...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save as draft
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-slate-400">
                Your quiz is saved as a draft. Students cannot access it until
                you publish it.
              </p>
            </div>

            {/* Right summary panel */}
            <aside className="space-y-5 xl:sticky xl:top-24">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-[#172641] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest text-blue-200">
                      QUIZ OVERVIEW
                    </span>
                    <Eye size={17} className="text-blue-200" />
                  </div>
                  <p className="mt-4 text-lg font-bold">
                    {form.title.trim() || "Untitled quiz"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">
                    {form.description || "Your quiz description will appear here."}
                  </p>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                  <div className="p-4">
                    <p className="text-xs text-slate-400">Questions</p>
                    <p className="mt-1 text-2xl font-bold">{questions.length}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-slate-400">Total marks</p>
                    <p className="mt-1 text-2xl font-bold">{totalMarks}</p>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        Question completion
                      </span>
                      <span className="font-bold text-blue-600">
                        {Math.round(
                          (completedQuestions / questions.length) * 100
                        ) || 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${
                            (completedQuestions / questions.length) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {completedQuestions} of {questions.length} questions
                      have basic content and a correct answer selected.
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-3 text-xs font-bold tracking-wider text-slate-400">
                      QUESTION NAVIGATOR
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((question, index) => {
                        const complete =
                          question.text.trim() &&
                          question.options.every((option) => option.trim()) &&
                          question.correctAnswers.length > 0;

                        return (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => {
                              setActiveQuestion(index);
                              document
                                .getElementById(`question-${question.id}`)
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                            }}
                            className={`relative flex h-9 items-center justify-center rounded-lg border text-xs font-bold transition ${
                              activeQuestion === index
                                ? "border-blue-600 bg-blue-600 text-white"
                                : complete
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-300"
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-3 text-xs font-bold tracking-wider text-slate-400">
                      CONFIGURATION
                    </p>

                    <OverviewRow
                      icon={Clock3}
                      label="Time limit"
                      value={`${form.durationMinutes || 0} min`}
                    />
                    <OverviewRow
                      icon={CalendarDays}
                      label="Schedule"
                      value={
                        form.startTime
                          ? new Date(form.startTime).toLocaleDateString()
                          : "Not set"
                      }
                    />
                    <OverviewRow
                      icon={Settings2}
                      label="Question order"
                      value={form.shuffleQuestions ? "Shuffled" : "Default"}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  <GraduationCap size={19} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  Ready to publish?
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Save your quiz as a draft first. You can review the questions
                  and publish it from your teacher dashboard.
                </p>
              </div>
            </aside>
          </div>
        </form>

        <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          QuizFlow · Assessment builder
        </footer>
      </div>
    </div>
  );
}

function SectionHeading({ number, icon: Icon, title, description }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest text-blue-600">
            {number}
          </span>
          <h2 className="font-bold text-slate-900">{title}</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SummaryPill({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Icon size={18} className="text-blue-600" />
      <div>
        <p className="text-lg font-bold leading-none text-slate-900">{value}</p>
        <p className="mt-1 text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function DateField({ id, label, value, onChange }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
      >
        <CalendarDays size={16} className="text-slate-400" />
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="datetime-local"
        value={value}
        onChange={onChange}
        required
        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function OverviewRow({ icon: Icon, label, value }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 last:mb-0">
      <span className="flex items-center gap-2 text-xs text-slate-500">
        <Icon size={14} />
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function QuestionEditor({
  question,
  questionIndex,
  isActive,
  onActivate,
  onUpdate,
  onUpdateOption,
  onToggleCorrect,
  onChangeType,
  onRemove,
  canRemove,
}) {
  const complete =
    question.text.trim() &&
    question.options.every((option) => option.trim()) &&
    question.correctAnswers.length > 0;

  return (
    <article
      id={`question-${question.id}`}
      onClick={onActivate}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        isActive
          ? "border-blue-300 ring-4 ring-blue-50"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
              complete
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {complete ? <Check size={17} /> : String(questionIndex + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Question {questionIndex + 1}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {complete ? "Content added" : "Complete this question"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${
              complete
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {complete ? "READY" : "INCOMPLETE"}
          </span>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            disabled={!canRemove}
            aria-label={`Remove question ${questionIndex + 1}`}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div>
          <label
            htmlFor={`question-text-${question.id}`}
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Question text <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`question-text-${question.id}`}
            value={question.text}
            onChange={(event) =>
              onUpdate({ text: event.target.value })
            }
            onFocus={onActivate}
            required
            maxLength={1000}
            rows={3}
            placeholder="Write your question here..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
          <div>
            <label
              htmlFor={`type-${question.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Answer format
            </label>
            <select
              id={`type-${question.id}`}
              value={question.type}
              onChange={(event) => onChangeType(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            >
              <option value="SINGLE">Single answer</option>
              <option value="MULTIPLE">Multiple answers</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`marks-${question.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Marks
            </label>
            <input
              id={`marks-${question.id}`}
              type="number"
              min={1}
              max={100}
              value={question.marks}
              onChange={(event) =>
                onUpdate({ marks: event.target.value })
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Answer options
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Select the correct option{question.type === "MULTIPLE" ? "s" : ""}.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500">
              {question.correctAnswers.length} selected
            </span>
          </div>

          <div className="space-y-3">
            {question.options.map((option, optionIndex) => {
              const selected =
                question.correctAnswers.includes(optionIndex);

              return (
                <div
                  key={optionIndex}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    selected
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleCorrect(optionIndex)}
                    aria-pressed={selected}
                    aria-label={`Mark option ${optionIndex + 1} as ${
                      selected ? "incorrect" : "correct"
                    }`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                      selected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {selected
                      ? <CheckCircle2 size={17} />
                      : String.fromCharCode(65 + optionIndex)}
                  </button>

                  <input
                    aria-label={`Question ${questionIndex + 1}, option ${optionIndex + 1}`}
                    value={option}
                    onChange={(event) =>
                      onUpdateOption(optionIndex, event.target.value)
                    }
                    required
                    maxLength={300}
                    placeholder={`Enter option ${String.fromCharCode(65 + optionIndex)}`}
                    className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-slate-400"
                  />

                  {selected && (
                    <span className="hidden text-[10px] font-bold tracking-wide text-emerald-700 sm:inline">
                      CORRECT
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {question.options.length < 6 && (
              <button
                type="button"
                onClick={() =>
                  onUpdate({ options: [...question.options, ""] })
                }
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition hover:text-blue-700"
              >
                <Plus size={15} />
                Add option
              </button>
            )}

            {question.options.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  const removedIndex = question.options.length - 1;

                  onUpdate({
                    options: question.options.slice(0, -1),
                    correctAnswers: question.correctAnswers.filter(
                      (index) => index !== removedIndex
                    ),
                  });
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-red-600"
              >
                <Trash2 size={14} />
                Remove last option
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 px-4 py-3 text-xs text-blue-700">
          <CheckCircle2 size={15} className="shrink-0" />
          {question.type === "SINGLE"
            ? "Choose one option as the correct answer."
            : "Choose at least two options as correct answers."}
        </div>
      </div>
    </article>
  );
}

