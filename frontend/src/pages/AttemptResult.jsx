
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  CircleCheck,
  Clock3,
  FileCheck2,
  LoaderCircle,
  Medal,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function AttemptResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    axios
      .get(`${API_URL}/attempts/${attemptId}/result`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (!active) return;

        setResult(
          response.data?.result ??
            response.data?.attempt ??
            response.data?.data ??
            response.data
        );
      })
      .catch((err) => {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            "Unable to load your result. It may not be available yet."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attemptId, navigate]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <LoaderCircle size={27} className="animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800">
              Preparing your result
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Calculating your performance...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <FileCheck2 size={23} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Result unavailable
          </h1>

          <p role="alert" className="mt-3 text-sm leading-6 text-red-600">
            {error || "Result not found."}
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

  const score = Number(result.score ?? 0);
  const totalMarks = Number(result.totalMarks ?? 0);

  const percentage =
    totalMarks > 0
      ? Math.min(100, Math.max(0, Math.round((score / totalMarks) * 100)))
      : 0;

  const getPerformance = () => {
    if (percentage >= 90) {
      return {
        title: "Outstanding performance!",
        description: "Excellent work. You've demonstrated great mastery.",
        icon: Trophy,
        color: "emerald",
      };
    }

    if (percentage >= 75) {
      return {
        title: "Great job!",
        description: "You're doing really well. Keep up the momentum.",
        icon: Award,
        color: "blue",
      };
    }

    if (percentage >= 50) {
      return {
        title: "Good effort!",
        description: "You're making progress. Keep learning and improving.",
        icon: Medal,
        color: "amber",
      };
    }

    return {
      title: "Keep learning!",
      description: "Every attempt is a step forward. Keep practicing.",
      icon: Target,
      color: "slate",
    };
  };

  const performance = getPerformance();
  const PerformanceIcon = performance.icon;

  const quizTitle =
    result.quiz?.title ??
    result.quizTitle ??
    "Quiz examination";

  const colorClasses = {
    emerald: {
      background: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      ring: "text-emerald-500",
    },
    blue: {
      background: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      ring: "text-blue-500",
    },
    amber: {
      background: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      ring: "text-amber-500",
    },
    slate: {
      background: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
      ring: "text-slate-500",
    },
  };

  const colors = colorClasses[performance.color];

  return (
    <main className="min-h-screen bg-[#f6f8fc] pb-12">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/student"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FileCheck2 size={21} />
            </div>

            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                QuizFlow
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                Learning management system
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Exam completed
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Success heading */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-emerald-100 rotate-6" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
              <Trophy size={35} strokeWidth={1.8} />
            </div>
            <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#f6f8fc] bg-blue-600 text-white">
              <CheckCircle2 size={15} />
            </div>
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            <Sparkles size={14} />
            Quiz successfully submitted
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Your results are in!
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            You've completed your examination. Here's a breakdown of your
            performance.
          </p>
        </div>

        {/* Main result card */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
          <div className="grid lg:grid-cols-[1fr_0.85fr]">
            {/* Score section */}
            <div className="border-b border-slate-100 p-6 sm:p-9 lg:border-b-0 lg:border-r">
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                  Examination summary
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  {quizTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Your final examination score
                </p>
              </div>

              <div className="flex flex-col items-center py-3">
                {/* Circular score indicator */}
                <div className="relative flex h-52 w-52 items-center justify-center">
                  <svg
                    viewBox="0 0 200 200"
                    className="h-full w-full -rotate-90"
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="83"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="13"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="83"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="13"
                      strokeLinecap="round"
                      strokeDasharray={`${(percentage / 100) * 521.5} 521.5`}
                      className={
                        percentage >= 75
                          ? "text-emerald-500"
                          : percentage >= 50
                            ? "text-blue-500"
                            : "text-amber-500"
                      }
                    />
                  </svg>

                  <div className="absolute text-center">
                    <p className="text-5xl font-extrabold tracking-tight text-slate-900">
                      {percentage}
                      <span className="text-2xl">%</span>
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Your score
                    </p>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <h4 className={`text-xl font-extrabold ${colors.text}`}>
                    {performance.title}
                  </h4>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    {performance.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance summary */}
            <div className="flex flex-col justify-center bg-[#fbfcfe] p-6 sm:p-9">
              <div className="mb-6 flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.background} ${colors.text}`}>
                  <PerformanceIcon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    Performance overview
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Your examination breakdown
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Total score
                      </p>
                      <p className="mt-2 text-3xl font-extrabold text-slate-900">
                        {score}
                        <span className="ml-1 text-base font-semibold text-slate-400">
                          / {totalMarks}
                        </span>
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Target size={21} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Percentage achieved
                      </p>
                      <p className="mt-2 text-3xl font-extrabold text-slate-900">
                        {percentage}%
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Award size={21} />
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 ${colors.background} ${colors.border}`}>
                  <div className="flex items-center gap-3">
                    <CircleCheck className={colors.text} size={21} />
                    <div>
                      <p className={`text-sm font-bold ${colors.text}`}>
                        Submission recorded
                      </p>
                      <p className={`mt-1 text-xs ${colors.text} opacity-75`}>
                        Your examination has been submitted successfully.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom information */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Examination completed
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Your answers have been submitted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={21} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Keep improving
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Every attempt is an opportunity to learn.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            to="/student"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>

          <Link
            to="/student"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto"
          >
            Continue learning
            <ArrowRight size={17} />
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Powered by QuizFlow · Keep learning, keep growing.
        </p>
      </div>
    </main>
  );
}
