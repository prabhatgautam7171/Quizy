
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  FileCheck2,
  LayoutGrid,
  LoaderCircle,
  Send,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function AttemptQuiz() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const answersRef = useRef({});
  const attemptRef = useRef(null);
  const submittingRef = useRef(false);
  const saveQueueRef = useRef({});

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const getMessage = (err, fallback) =>
    err.response?.data?.message || err.message || fallback;

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds ?? 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainder = safeSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(
      remainder
    ).padStart(2, "0")}`;
  };

  const loadAttempt = useCallback(async () => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/attempts/${attemptId}`,
        { headers: authHeaders }
      );

      const responseData = response.data?.data ?? response.data;

      const attemptData = responseData?.attempt
        ? {
            ...responseData.attempt,
            questions:
              responseData.questions ??
              responseData.attempt.questions ??
              [],
            quiz: responseData.quiz ?? responseData.attempt.quiz,
            serverNow: responseData.serverNow,
          }
        : responseData;

      if (!attemptData || !attemptData.id) {
        throw new Error("Invalid attempt response from the server.");
      }

      attemptRef.current = attemptData;
      setAttempt(attemptData);

      const initialAnswers = {};

      for (const answer of attemptData.answers ?? []) {
        initialAnswers[String(answer.questionId)] =
          answer.selectedOptions?.map(String) ?? [];
      }

      answersRef.current = initialAnswers;
      setAnswers(initialAnswers);

      const deadline = new Date(attemptData.deadline).getTime();
      const serverNow = attemptData.serverNow
        ? new Date(attemptData.serverNow).getTime()
        : Date.now();

      if (!Number.isFinite(deadline) || !Number.isFinite(serverNow)) {
        throw new Error("The server returned an invalid quiz timer.");
      }

      setRemainingSeconds(
        Math.max(0, Math.ceil((deadline - serverNow) / 1000))
      );
    } catch (err) {
      console.error("Failed to load quiz attempt:", err);
      setError(getMessage(err, "Unable to load this quiz attempt."));
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate, token]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // Queue saves for each question so older requests cannot
  // finish after newer requests for the same question.
  const saveAnswer = useCallback(
    (questionId, selectedOptions) => {
      const previous = saveQueueRef.current[questionId] || Promise.resolve();

      const next = previous
        .catch(() => {})
        .then(() =>
          axios.put(
            `${API_URL}/attempts/${attemptId}/answers`,
            { questionId, selectedOptions },
            { headers: authHeaders }
          )
        );

      saveQueueRef.current[questionId] = next;

      return next.finally(() => {
        if (saveQueueRef.current[questionId] === next) {
          delete saveQueueRef.current[questionId];
        }
      });
    },
    [attemptId, token]
  );

  const waitForPendingSaves = useCallback(async () => {
    const pending = Object.values(saveQueueRef.current);
    await Promise.all(pending);
  }, []);

  const submitQuiz = useCallback(
    async (automatic = false) => {
      if (submittingRef.current) return;

      submittingRef.current = true;
      setSubmitting(true);
      setError("");

      try {
        // Wait for answer requests already in progress.
        await waitForPendingSaves();

        const currentAttempt = attemptRef.current;

        // Make sure the latest local answers are saved.
        if (currentAttempt?.questions?.length) {
          for (const question of currentAttempt.questions) {
            const questionId = String(question._id ?? question.id);
            const selectedOptions =
              answersRef.current[questionId] ?? [];

            await axios.put(
              `${API_URL}/attempts/${attemptId}/answers`,
              { questionId, selectedOptions },
              { headers: authHeaders }
            );
          }
        }

        await axios.post(
          `${API_URL}/attempts/${attemptId}/submit`,
          {},
          { headers: authHeaders }
        );

        navigate(`/attempt/${attemptId}/result`, {
          replace: true,
        });
      } catch (err) {
        setError(
          getMessage(
            err,
            automatic
              ? "Time expired. Please try submitting again."
              : "Unable to submit the quiz. Please try again."
          )
        );

        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [attemptId, navigate, token, waitForPendingSaves]
  );

  // Countdown timer.
  useEffect(() => {
    if (remainingSeconds === null || submitting) return;

    if (remainingSeconds <= 0) {
      submitQuiz(true);
      return;
    }

    const timer = setTimeout(() => {
      setRemainingSeconds((seconds) =>
        seconds === null ? null : Math.max(0, seconds - 1)
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [remainingSeconds, submitting, submitQuiz]);

  const selectOption = async (question, optionId) => {
    if (saving || submitting || remainingSeconds <= 0) return;

    const questionId = String(question._id ?? question.id);
    const optionValue = String(optionId);
    const currentSelection = answersRef.current[questionId] ?? [];

    const isMultiple = question.type === "MULTIPLE";

    const nextSelection = isMultiple
      ? currentSelection.includes(optionValue)
        ? currentSelection.filter((id) => id !== optionValue)
        : [...currentSelection, optionValue]
      : [optionValue];

    const updatedAnswers = {
      ...answersRef.current,
      [questionId]: nextSelection,
    };

    answersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);
    setError("");
    setSaving(true);

    try {
      await saveAnswer(questionId, nextSelection);
    } catch (err) {
      setError(
        getMessage(
          err,
          "Unable to save this answer. Please check your connection."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <LoaderCircle size={27} className="animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800">
              Preparing your examination
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Please wait while we load your questions.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !attempt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={23} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Unable to open quiz
          </h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-red-600">
            {error}
          </p>
          <Link
            to="/student"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const questions = attempt?.questions ?? [];
  const question = questions[currentIndex];

  if (!question) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 text-slate-400" size={36} />
          <h1 className="text-xl font-bold text-slate-900">
            No questions found
          </h1>
          <Link to="/student" className="mt-4 inline-block text-blue-600">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const questionId = String(question._id ?? question.id);
  const selectedOptions = answers[questionId] ?? [];

  const answeredCount = questions.filter((item) => {
    const id = String(item._id ?? item.id);
    return (answers[id] ?? []).length > 0;
  }).length;

  const unansweredCount = questions.length - answeredCount;
  const progress = questions.length
    ? (answeredCount / questions.length) * 100
    : 0;

  const isUrgent = remainingSeconds !== null && remainingSeconds <= 300;
  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;

  const quizTitle =
    attempt.quiz?.title ?? attempt.quizTitle ?? "Your examination";

  const getQuestionStatus = (item, index) => {
    const id = String(item._id ?? item.id);
    const answered = (answers[id] ?? []).length > 0;

    if (index === currentIndex) return "current";
    if (answered) return "answered";
    return "unanswered";
  };

  return (
    <main className="min-h-screen bg-[#f6f8fc] pb-10">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/student"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <ShieldCheck size={21} />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                  QuizFlow
                </h1>
                <p className="hidden text-[11px] font-medium text-slate-400 sm:block">
                  Learning management system
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Exam in progress
            </div>

            <button
              type="button"
              onClick={() => setConfirmSubmit(true)}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Submit exam</span>
              <span className="sm:hidden">Submit</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Page heading */}
        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Examination session
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {quizTitle}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Read each question carefully and select your answer. Your
              progress is saved as you go.
            </p>
          </div>

          {/* Timer */}
          <div
            className={`flex min-w-[190px] items-center gap-4 rounded-2xl border p-4 transition ${
              isUrgent
                ? "border-red-200 bg-red-50"
                : "border-slate-200 bg-white shadow-sm shadow-slate-200/40"
            }`}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isUrgent
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Clock3 size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Time remaining
              </p>
              <p
                className={`mt-0.5 font-mono text-2xl font-extrabold tabular-nums ${
                  isUrgent ? "text-red-600" : "text-slate-900"
                }`}
              >
                {formatTime(remainingSeconds)}
              </p>
            </div>
            {isUrgent && (
              <span className="ml-auto text-[10px] font-bold text-red-600">
                {isExpired ? "TIME UP" : "HURRY"}
              </span>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          {/* Question area */}
          <div className="min-w-0">
            {/* Progress card */}
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Your progress
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {answeredCount} of {questions.length} questions completed
                  </p>
                </div>

                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-700">
                    {String(currentIndex + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Question {currentIndex + 1}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      of {questions.length} questions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                    {question.marks ?? 1} marks
                  </span>
                  <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    {question.type === "MULTIPLE"
                      ? "Multiple choice"
                      : "Single choice"}
                  </span>
                </div>
              </div>

              <div className="px-5 py-7 sm:px-8 sm:py-9">
                <div className="mb-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Question
                  </p>

                  <h3 className="max-w-3xl text-xl font-bold leading-[1.65] text-slate-900 sm:text-2xl">
                    {question.text}
                  </h3>

                  <p className="mt-3 text-sm text-slate-400">
                    {question.type === "MULTIPLE"
                      ? "Choose all options that apply."
                      : "Choose the one best answer."}
                  </p>
                </div>

                <div className="space-y-3">
                  {(question.options ?? []).map((option, index) => {
                    const optionId = String(
                      typeof option === "string"
                        ? index
                        : option._id ?? option.id
                    );

                    const optionText =
                      typeof option === "string" ? option : option.text;

                    const selected = selectedOptions.includes(optionId);

                    return (
                      <button
                        key={optionId}
                        type="button"
                        disabled={
                          saving || submitting || remainingSeconds <= 0
                        }
                        onClick={() => selectOption(question, optionId)}
                        aria-pressed={selected}
                        className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5 ${
                          selected
                            ? "border-blue-500 bg-blue-50/80 shadow-sm shadow-blue-100"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        } disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-blue-200 group-hover:text-blue-600"
                          }`}
                        >
                          {selected ? (
                            <Check size={19} strokeWidth={2.8} />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </span>

                        <span
                          className={`min-w-0 flex-1 text-sm font-medium leading-6 sm:text-base ${
                            selected ? "text-blue-950" : "text-slate-700"
                          }`}
                        >
                          {optionText}
                        </span>

                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 text-transparent group-hover:border-blue-400"
                          }`}
                        >
                          {selected && <Check size={12} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Save status */}
                <div className="mt-5 min-h-6">
                  {saving ? (
                    <p className="flex items-center gap-2 text-xs font-medium text-blue-600">
                      <LoaderCircle size={14} className="animate-spin" />
                      Saving your answer...
                    </p>
                  ) : selectedOptions.length > 0 ? (
                    <p className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={14} />
                      Answer selected
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 text-xs text-slate-400">
                      <Circle size={13} />
                      Not answered yet
                    </p>
                  )}
                </div>
              </div>

              {/* Question navigation */}
              <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:px-8">
                <button
                  type="button"
                  disabled={currentIndex === 0 || saving || submitting}
                  onClick={() =>
                    setCurrentIndex((index) => Math.max(0, index - 1))
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={17} />
                  Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    disabled={saving || submitting}
                    onClick={() =>
                      setCurrentIndex((index) =>
                        Math.min(questions.length - 1, index + 1)
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next question
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving || submitting}
                    onClick={() => setConfirmSubmit(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Review & submit
                    <FileCheck2 size={17} />
                  </button>
                )}
              </div>
            </section>

            {/* Inline error */}
            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} />
              Your answers are saved as you progress.
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-[96px]">
            {/* Question navigator */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <LayoutGrid size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Question palette
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Navigate questions
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-400">
                  {currentIndex + 1}/{questions.length}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((item, index) => {
                  const status = getQuestionStatus(item, index);

                  return (
                    <button
                      key={String(item._id ?? item.id)}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      disabled={saving || submitting}
                      aria-label={`Question ${index + 1}: ${status}`}
                      aria-current={
                        status === "current" ? "step" : undefined
                      }
                      className={`flex aspect-square items-center justify-center rounded-xl border text-sm font-bold transition ${
                        status === "current"
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : status === "answered"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"
                            : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="h-3 w-3 rounded bg-blue-600" />
                    Current
                  </span>
                  <span className="font-semibold text-slate-700">
                    1 question
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-100" />
                    Answered
                  </span>
                  <span className="font-semibold text-slate-700">
                    {answeredCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="h-3 w-3 rounded border border-slate-300 bg-white" />
                    Unanswered
                  </span>
                  <span className="font-semibold text-slate-700">
                    {unansweredCount}
                  </span>
                </div>
              </div>
            </section>

            {/* Completion summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
              <h3 className="text-sm font-bold text-slate-900">
                Completion summary
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Your current examination status
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {answeredCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-emerald-700/70">
                    Answered
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-extrabold text-slate-700">
                    {unansweredCount}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Remaining
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmSubmit(true)}
                disabled={submitting || saving}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                Review submission
                <ArrowRight size={16} />
              </button>
            </section>

            {/* Exam reminder */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <div className="flex items-center gap-2 text-blue-700">
                <ShieldCheck size={18} />
                <p className="text-sm font-bold">Exam guidelines</p>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-blue-900/70">
                <li>• Review unanswered questions before submitting.</li>
                <li>• Your selected answers are saved automatically.</li>
                <li>• Submission cannot be undone.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Submission confirmation modal */}
      {confirmSubmit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setConfirmSubmit(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/50 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileCheck2 size={22} />
                </div>
                <h2
                  id="submit-title"
                  className="text-xl font-extrabold text-slate-900"
                >
                  Submit your examination?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review your progress before finishing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfirmSubmit(false)}
                disabled={submitting}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={17} />
                    <span className="text-xs font-semibold">Answered</span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold text-emerald-700">
                    {answeredCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Circle size={16} />
                    <span className="text-xs font-semibold">
                      Unanswered
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold text-amber-700">
                    {unansweredCount}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">
                  {unansweredCount > 0
                    ? `You still have ${unansweredCount} unanswered question(s). They may receive no marks.`
                    : "Great work! You have answered every question."}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Once submitted, you cannot return to this examination or
                  change your answers.
                </p>
              </div>

              {error && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setConfirmSubmit(false)}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Continue exam
                </button>

                <button
                  type="button"
                  onClick={() => submitQuiz(false)}
                  disabled={submitting || saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Confirm submission
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
