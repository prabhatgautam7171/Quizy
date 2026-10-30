import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Trophy,
  Medal,
  Crown,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Users,
  Target,
  Clock3,
  Sparkles,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const PAGE_SIZE = 10;

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

const formatTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
};

const podiumStyles = {
  1: {
    card: "border-amber-200 bg-gradient-to-b from-amber-50 via-white to-white",
    avatar: "bg-amber-100 text-amber-800 ring-4 ring-amber-100",
    icon: "text-amber-500",
    label: "CHAMPION",
    points: "text-amber-700",
  },
  2: {
    card: "border-slate-200 bg-gradient-to-b from-slate-100 via-white to-white",
    avatar: "bg-slate-200 text-slate-700 ring-4 ring-slate-100",
    icon: "text-slate-500",
    label: "RUNNER-UP",
    points: "text-slate-700",
  },
  3: {
    card: "border-orange-200 bg-gradient-to-b from-orange-50 via-white to-white",
    avatar: "bg-orange-100 text-orange-800 ring-4 ring-orange-100",
    icon: "text-orange-600",
    label: "THIRD PLACE",
    points: "text-orange-700",
  },
};

function PodiumCard({ student, rank }) {
  const styles = podiumStyles[rank];
  const isFirst = rank === 1;

  return (
    <article
      className={`relative flex min-w-0 flex-col items-center rounded-3xl border p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        styles.card
      } ${isFirst ? "sm:-translate-y-4 sm:py-10" : "sm:mt-5"}`}
    >
      {isFirst && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-4 py-1.5 text-[10px] font-extrabold tracking-[0.15em] text-amber-950 shadow-md">
          TOP PERFORMER
        </div>
      )}

      <div className="mb-4 mt-2">
        {rank === 1 ? (
          <Crown size={30} className={styles.icon} />
        ) : (
          <Medal size={27} className={styles.icon} />
        )}
      </div>

      <div
        className={`flex h-[76px] w-[76px] items-center justify-center rounded-full text-xl font-extrabold ${styles.avatar}`}
      >
        {getInitials(student.student?.name)}
      </div>

      <span className="mt-5 text-[10px] font-extrabold tracking-[0.2em] text-slate-400">
        {styles.label}
      </span>

      <h3 className="mt-2 w-full truncate text-base font-extrabold text-slate-900">
        {student.student?.name || "Unknown Student"}
      </h3>

      <p className={`mt-4 text-3xl font-extrabold tracking-tight ${styles.points}`}>
        {Number(student.totalPoints || 0).toLocaleString("en-IN")}
      </p>

      <span className="mt-1 text-xs font-medium text-slate-400">
        total points
      </span>

      <div className="mt-5 flex w-full items-center justify-center gap-2 border-t border-slate-200/80 pt-4 text-xs font-semibold text-slate-500">
        <Target size={15} />
        {Number(student.averageScorePercentage || 0).toFixed(1)}% average score
      </div>
    </article>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
        <Crown size={18} />
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Medal size={18} />
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
        <Medal size={18} />
      </span>
    );
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-sm font-extrabold text-slate-500">
      {rank}
    </span>
  );
}

function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

export default function GlobalLeaderboard() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  // Student-only page guard.
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

  const fetchLeaderboard = useCallback(async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      clearSession();
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/leaderboard/global`, {
        params: { page, limit: PAGE_SIZE },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = response.data;

      setData(result.leaderboard || []);
      setPagination(
        result.pagination || {
          page,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 0,
        }
      );
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

      setData([]);
      setError(
        err.response?.data?.message ||
          "We couldn't load the leaderboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, navigate]);

  useEffect(() => {
    if (user.role === "STUDENT" && localStorage.getItem("accessToken")) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard, user.role]);

  // The first page contains the podium and the complete paginated list.
  const podium =
    page === 1
      ? [
          data.find((item) => item.rank === 2),
          data.find((item) => item.rank === 1),
          data.find((item) => item.rank === 3),
        ].filter(Boolean)
      : [];

  // Keep all rows, including ranks 1–3, in the ranking list.
  const rankedStudents = data;

  const totalPages = pagination.totalPages || 0;
  const startEntry =
    pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, pagination.total);

  if (!localStorage.getItem("accessToken") || user.role !== "STUDENT") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F6F8FC] pb-16 text-slate-900">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/student")}
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </button>

            <div className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-[0.18em] text-blue-600">
              <Sparkles size={15} />
              QUIZFLOW COMMUNITY
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[42px]">
              Global leaderboard
              <span className="text-blue-600">.</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Every quiz counts. Explore the rankings, celebrate top
              performers, and keep pushing your limits.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLeaderboard}
            disabled={loading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh rankings
          </button>
        </div>

        {/* Intro banner */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] bg-[#111D35] p-7 text-white shadow-xl shadow-slate-900/10 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/[0.06]" />
          <div className="pointer-events-none absolute -right-5 -top-12 h-64 w-64 rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-500/20 blur-[90px]" />

          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-200">
                <Trophy size={18} />
                YOUR NEXT MILESTONE
              </div>

              <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Learn more.
                <br className="hidden sm:block" />
                Score higher. Rise together.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Your hard work deserves recognition. Complete assessments,
                earn points, and see how you rank among students across QuizFlow.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200">
                <GraduationCap size={26} />
              </div>
              <div>
                <p className="text-3xl font-extrabold tabular-nums">
                  {loading
                    ? "—"
                    : pagination.total.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Ranked students
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Summary cards */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={Users}
            label="Ranked students"
            value={
              loading ? "—" : pagination.total.toLocaleString("en-IN")
            }
            description="Students with eligible results"
            iconClass="bg-blue-50 text-blue-700"
          />

          <SummaryCard
            icon={Trophy}
            label="Top performers"
            value="01–03"
            description="The three highest-ranked students"
            iconClass="bg-amber-50 text-amber-700"
          />

          <SummaryCard
            icon={TrendingUp}
            label="Ranking criteria"
            value="Points first"
            description="Score, average percentage, then time"
            iconClass="bg-emerald-50 text-emerald-700"
          />
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-8 flex flex-col gap-4 rounded-2xl border border-red-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />
              <div>
                <p className="font-bold text-red-900">
                  Unable to load rankings
                </p>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchLeaderboard}
              className="w-fit rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Podium */}
        {!error && page === 1 && !loading && podium.length > 0 && (
          <section className="mb-12">
            <div className="mb-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
                The leaders
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                The podium
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Celebrating the highest-ranked students.
              </p>
            </div>

            <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-3 sm:gap-6">
              {podium.map((student) => (
                <PodiumCard
                  key={student.student?.id || student.rank}
                  student={student}
                  rank={student.rank}
                />
              ))}
            </div>
          </section>
        )}

        {/* Rankings */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <div>
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-blue-600" />
                <h2 className="text-lg font-extrabold">
                  Student rankings
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {loading
                  ? "Loading student results..."
                  : pagination.total > 0
                    ? `Showing ${startEntry}–${endEntry} of ${pagination.total} students`
                    : "Rankings will appear here when results are available."}
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-500">
              <ShieldCheck size={15} className="text-emerald-600" />
              Verified quiz results
            </div>
          </div>

          {/* Column labels */}
          <div className="hidden grid-cols-12 gap-4 bg-slate-50/80 px-7 py-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 md:grid">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Student</div>
            <div className="col-span-2 text-right">Total points</div>
            <div className="col-span-2 text-right">Avg. score</div>
            <div className="col-span-1 text-right">Quizzes</div>
            <div className="col-span-2 text-right">Time taken</div>
          </div>

          {loading ? (
            <div className="space-y-5 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse items-center gap-4 py-2"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-4 w-36 rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                  </div>
                  <div className="h-5 w-16 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : !error && rankedStudents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Trophy size={29} />
              </div>

              <h3 className="mt-5 text-lg font-extrabold">
                No rankings just yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Once students submit quizzes, their results will appear on
                the global leaderboard.
              </p>

              <button
                type="button"
                onClick={fetchLeaderboard}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <RefreshCw size={15} />
                Refresh rankings
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rankedStudents.map((student) => (
                <RankingRow
                  key={student.student?.id || student.rank}
                  student={student}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-sm text-slate-500">
                Page{" "}
                <span className="font-bold text-slate-900">{page}</span>
                {" "}of{" "}
                <span className="font-bold text-slate-900">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={15} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Ranking information */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-5">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0 text-slate-400"
          />
          <p className="text-xs leading-6 text-slate-500">
            Rankings are calculated using total points first, average score
            percentage second, and total time taken third. Submitted quiz
            attempts are included as soon as they qualify under the
            leaderboard rules.
          </p>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 py-9 text-xs font-medium text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} QuizFlow</span>
          <button
            onClick={() => navigate("/student")}
            className="inline-flex items-center gap-2 transition hover:text-blue-600"
          >
            Return to your dashboard
            <ChevronRight size={14} />
          </button>
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({ icon: Icon, label, value, description, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">
          {label}
        </span>
        <div className={`rounded-xl p-2.5 ${iconClass}`}>
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs font-medium text-slate-400">
        {description}
      </p>
    </div>
  );
}

function RankingRow({ student }) {
  const average = Math.min(
    100,
    Math.max(0, Number(student.averageScorePercentage) || 0)
  );

  return (
    <div className="grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-slate-50/80 sm:px-7 md:grid-cols-12 md:items-center md:gap-4">
      <div className="flex items-center gap-3 md:col-span-1">
        <RankBadge rank={student.rank} />
        <span className="text-xs font-semibold text-slate-400 md:hidden">
          Rank #{student.rank}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-3 md:col-span-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-extrabold text-blue-700">
          {getInitials(student.student?.name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">
            {student.student?.name || "Unknown Student"}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            QuizFlow student
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between md:col-span-2 md:block md:text-right">
        <span className="text-xs text-slate-400 md:hidden">
          Total points
        </span>
        <span className="text-sm font-extrabold tabular-nums text-slate-900">
          {Number(student.totalPoints || 0).toLocaleString("en-IN")}
        </span>
      </div>

      <div className="flex items-center justify-between md:col-span-2 md:block md:text-right">
        <span className="text-xs text-slate-400 md:hidden">
          Average score
        </span>

        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-blue-600"
              style={{ width: `${average}%` }}
            />
          </span>
          {average.toFixed(1)}%
        </span>
      </div>

      <div className="flex items-center justify-between md:col-span-1 md:block md:text-right">
        <span className="text-xs text-slate-400 md:hidden">
          Quizzes completed
        </span>
        <span className="text-sm font-semibold text-slate-700">
          {student.quizzesCompleted ?? 0}
        </span>
      </div>

      <div className="flex items-center justify-between md:col-span-2 md:block md:text-right">
        <span className="text-xs text-slate-400 md:hidden">
          Time taken
        </span>
        <span className="text-sm font-semibold tabular-nums text-slate-500">
          {formatTime(student.totalTimeSeconds)}
        </span>
      </div>
    </div>
  );
}
