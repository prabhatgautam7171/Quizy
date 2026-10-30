import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  Clock3,
  Search,
  Trophy,
  ArrowRight,
  LogOut,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  GraduationCap,
  Sparkles,
  Target,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function getQuizId(quiz) {
  return quiz._id || quiz.id;
}

function getQuizState(quiz, now = Date.now()) {
  const start = new Date(quiz.startTime).getTime();
  const end = new Date(quiz.endTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) return "invalid";
  if (now < start) return "upcoming";
  if (now > end) return "closed";
  return "available";
}

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return "Date unavailable";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getInitials(name = "Student") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [now, setNow] = useState(Date.now());

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  // Frontend role guard. The backend must enforce the same restriction.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "STUDENT") {
      navigate(
        user.role === "TEACHER" ? "/teacher" : "/login",
        { replace: true }
      );
    }
  }, [navigate, user.role]);

  const fetchQuizzes = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      clearSession();
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/quizzes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : payload.quizzes || payload.data || [];

      setQuizzes(list);
    } catch (err) {
      if (err.response?.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (err.response?.status === 403) {
        navigate("/teacher", { replace: true });
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("accessToken") || user.role !== "STUDENT") {
      return;
    }

    fetchQuizzes();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const filteredQuizzes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      const matchesSearch =
        !normalizedSearch ||
        `${quiz.title || ""} ${quiz.description || ""}`
          .toLowerCase()
          .includes(normalizedSearch);

      const state = getQuizState(quiz, now);

      const matchesFilter =
        filter === "all" ||
        (filter === "available" && state === "available") ||
        (filter === "upcoming" && state === "upcoming") ||
        (filter === "closed" && state === "closed");

      return matchesSearch && matchesFilter;
    });
  }, [quizzes, search, filter, now]);

  const availableCount = quizzes.filter(
    (quiz) => getQuizState(quiz, now) === "available"
  ).length;

  const upcomingCount = quizzes.filter(
    (quiz) => getQuizState(quiz, now) === "upcoming"
  ).length;

  const closedCount = quizzes.filter(
    (quiz) => getQuizState(quiz, now) === "closed"
  ).length;

  const handleStartQuiz = async (quiz) => {
    const quizId = getQuizId(quiz);

    if (!quizId) {
      setActionError("This quiz has an invalid ID. Refresh and try again.");
      return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
      clearSession();
      navigate("/login", { replace: true });
      return;
    }

    setStartingId(quizId);
    setActionError("");

    try {
      const response = await axios.post(
        `${API_URL}/quizzes/${quizId}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      const attempt =
        data?.attempt ??
        data?.data?.attempt ??
        data?.data ??
        data;

      const attemptId =
        attempt?._id ??
        attempt?.id ??
        data?.attemptId ??
        data?.data?.attemptId;

      if (!attemptId) {
        throw new Error(
          "The server did not return an attempt ID. Please try again."
        );
      }

      navigate(`/attempt/${attemptId}`);
    } catch (err) {
      if (err.response?.status === 401) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (err.response?.status === 403) {
        navigate("/teacher", { replace: true });
        return;
      }

      setActionError(getErrorMessage(err));
      await fetchQuizzes();
    } finally {
      setStartingId(null);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  // Prevent rendering student content while redirecting an unauthorized user.
  if (!localStorage.getItem("accessToken") || user.role !== "STUDENT") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button
            onClick={() => navigate("/student")}
            className="group flex items-center gap-3"
            aria-label="Go to student dashboard"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition group-hover:rotate-[-5deg]">
              <BookOpen size={21} />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Quiz<span className="text-blue-600">Flow</span>
            </span>
          </button>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Student workspace
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-800">
                {user.name || "Student"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Student account</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
              {getInitials(user.name)}
            </div>

            <button
              onClick={handleLogout}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label="Log out"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pt-10">
        {/* Welcome section */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#111D35] px-7 py-9 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full border border-white/[0.06]" />
          <div className="pointer-events-none absolute -right-8 -top-16 h-[290px] w-[290px] rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute -bottom-32 right-[20%] h-72 w-72 rounded-full bg-blue-500/20 blur-[90px]" />
          <div className="pointer-events-none absolute right-12 top-10 hidden h-56 w-56 items-center justify-center rounded-full border border-white/10 lg:flex">
            <div className="flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <GraduationCap size={75} strokeWidth={1} className="text-blue-200/80" />
            </div>
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-100">
              <Sparkles size={14} />
              YOUR PERSONAL LEARNING SPACE
            </div>

            <p className="mb-2 text-sm font-medium text-blue-200">
              Good to see you again
            </p>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[46px]">
              Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}.
              <br />
              <span className="text-blue-300">Ready for a new challenge?</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Your next learning milestone starts here. Explore assessments,
              test what you know, and keep moving forward with every attempt.
            </p>

            <button
              onClick={() =>
                document
                  .getElementById("available-quizzes")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Explore assessments
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="relative z-10 mt-9 flex flex-wrap gap-5 border-t border-white/10 pt-6 text-xs font-medium text-slate-300 sm:mt-11 sm:gap-8">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-300" />
              Your own learning space
            </span>
            <span className="flex items-center gap-2">
              <Target size={15} className="text-blue-300" />
              Learn at your pace
            </span>
          </div>
        </section>

        {/* Overview */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Total assessments"
            value={loading ? "—" : quizzes.length}
            description="Published quizzes"
            iconClass="bg-blue-50 text-blue-700"
          />
          <StatCard
            icon={CheckCircle2}
            label="Available now"
            value={loading ? "—" : availableCount}
            description="Ready to attempt"
            iconClass="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            icon={CalendarDays}
            label="Coming up"
            value={loading ? "—" : upcomingCount}
            description="Scheduled assessments"
            iconClass="bg-violet-50 text-violet-700"
          />
          <StatCard
            icon={Clock3}
            label="Closed"
            value={loading ? "—" : closedCount}
            description="Assessment windows ended"
            iconClass="bg-amber-50 text-amber-700"
          />
        </section>

        {/* Quiz explorer */}
        <section id="available-quizzes" className="mt-12 scroll-mt-28">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-blue-600">
                <LayoutDashboard size={15} />
                LEARNING LIBRARY
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Explore assessments
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Find your next challenge. Choose an available quiz and put
                your knowledge to the test.
              </p>
            </div>

            <button
              onClick={fetchQuizzes}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 lg:self-auto"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh library
            </button>
          </div>

          {/* Search and filters */}
          <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by assessment title or description..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All quizzes" },
                { value: "available", label: "Available" },
                { value: "upcoming", label: "Upcoming" },
                { value: "closed", label: "Closed" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`rounded-xl px-4 py-3 text-xs font-bold transition sm:text-sm ${
                    filter === item.value
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {actionError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <CircleAlert size={19} className="mt-0.5 shrink-0" />
              <p>{actionError}</p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-white p-5"
            >
              <p className="font-bold text-red-800">
                Couldn't load assessments
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchQuizzes}
                className="mt-3 text-sm font-bold text-red-700 underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-200" />
                  <div className="mt-6 h-5 w-2/3 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                  <div className="mt-7 h-11 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : !error && filteredQuizzes.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Search size={27} />
              </div>
              <h3 className="mt-5 text-xl font-bold">
                {search || filter !== "all"
                  ? "No matching assessments"
                  : "Your learning library is waiting"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search || filter !== "all"
                  ? "Try changing your search or filters to find what you are looking for."
                  : "Published assessments will appear here. Check back when your teacher schedules a new quiz."}
              </p>
              {(search || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  className="mt-5 text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredQuizzes.map((quiz) => (
                <QuizCard
                  key={getQuizId(quiz)}
                  quiz={quiz}
                  now={now}
                  starting={startingId === getQuizId(quiz)}
                  onStart={() => handleStartQuiz(quiz)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard CTA */}
        <section className="relative mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-50" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Trophy size={25} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-amber-600">
                  YOUR NEXT MILESTONE
                </p>
                <h3 className="mt-2 text-xl font-extrabold tracking-tight">
                  Make your progress count.
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Complete assessments, collect points, and see where you stand
                  among students across QuizFlow.
                </p>
                <p className="mt-3 text-xs font-semibold text-slate-400">
                  Global rankings · Total points · Performance
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/leaderboard")}
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <Trophy size={17} />
              View leaderboard
              <ChevronRight size={17} />
            </button>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 py-9 text-xs font-medium text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} QuizFlow</span>
          <span>Learn with purpose. Improve with every attempt.</span>
        </footer>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, description, iconClass }) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-400">{description}</p>
    </div>
  );
}

function QuizCard({ quiz, now, starting, onStart }) {
  const state = getQuizState(quiz, now);

  const statusConfig = {
    available: {
      label: "Available now",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      dot: "bg-emerald-500",
    },
    upcoming: {
      label: "Upcoming",
      className: "bg-blue-50 text-blue-700 ring-blue-100",
      dot: "bg-blue-500",
    },
    closed: {
      label: "Closed",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
      dot: "bg-slate-400",
    },
    invalid: {
      label: "Schedule unavailable",
      className: "bg-amber-50 text-amber-700 ring-amber-100",
      dot: "bg-amber-500",
    },
  };

  const attemptLabels = {
    IN_PROGRESS: "Quiz already started",
    SUBMITTED: "Quiz submitted",
    AUTO_SUBMITTED: "Quiz auto-submitted",
  };

  const status = statusConfig[state];
  const questionCount = Array.isArray(quiz.questions)
    ? quiz.questions.length
    : quiz.questionCount;

  const attemptStatus = quiz.attemptStatus ?? null;
  const alreadyAttempted = Boolean(attemptStatus);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/60">
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 opacity-80" />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
            <GraduationCap size={23} />
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ring-inset ${status.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <h3 className="mt-6 line-clamp-2 text-lg font-extrabold leading-7 tracking-tight text-slate-900">
          {quiz.title || "Untitled quiz"}
        </h3>

        <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">
          {quiz.description || "Test your knowledge with this assessment."}
        </p>

        <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
              <Clock3 size={16} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                TIME LIMIT
              </p>
              <p className="mt-0.5 font-semibold text-slate-700">
                {quiz.durationMinutes
                  ? `${quiz.durationMinutes} minutes`
                  : "Set by teacher"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
              <BookOpen size={16} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                QUESTIONS
              </p>
              <p className="mt-0.5 font-semibold text-slate-700">
                {questionCount != null
                  ? `${questionCount} questions`
                  : "Available when started"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
              <CalendarDays size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400">
                {state === "upcoming" ? "STARTS" : "ENDS"}
              </p>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-700">
                {state === "upcoming"
                  ? formatDate(quiz.startTime)
                  : formatDate(quiz.endTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button
            onClick={onStart}
            disabled={
              state !== "available" || starting || alreadyAttempted
            }
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition ${
              state === "available" && !starting && !alreadyAttempted
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15 hover:-translate-y-0.5 hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            }`}
          >
            {starting ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                Starting assessment...
              </>
            ) : attemptLabels[attemptStatus] ? (
              attemptLabels[attemptStatus]
            ) : state === "available" ? (
              <>
                Start assessment
                <ArrowRight size={17} />
              </>
            ) : state === "upcoming" ? (
              "Not open yet"
            ) : state === "closed" ? (
              "Assessment closed"
            ) : (
              "Schedule unavailable"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
