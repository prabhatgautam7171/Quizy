
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Clock3,
  CalendarDays,
  FileQuestion,
  Users,
  Pencil,
  Trash2,
  Send,
  MoreHorizontal,
  LogOut,
  CircleAlert,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  X,
  LayoutDashboard,
  ClipboardList,
  ChevronRight,
  ArrowUpRight,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function getQuizId(quiz) {
  return quiz._id || quiz.id;
}

function formatDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getInitials(name = "Teacher") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function errorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState("");
  const [menuId, setMenuId] = useState("");

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  // Frontend role guard. Backend authorization is also required.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

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
  }, [navigate, user.role]);

  const fetchQuizzes = useCallback(async () => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setPageError("");

    try {
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      });

      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : payload.quizzes || payload.data || [];

      setQuizzes(list);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (error.response?.status === 403) {
        navigate("/student", { replace: true });
        return;
      }

      setPageError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (authorized) {
      fetchQuizzes();
    }
  }, [authorized, fetchQuizzes]);

  const publishedCount = quizzes.filter(
    (quiz) => quiz.status === "PUBLISHED"
  ).length;

  const draftCount = quizzes.filter(
    (quiz) => quiz.status === "DRAFT"
  ).length;

  const filteredQuizzes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return quizzes.filter((quiz) => {
      const matchesSearch =
        !query ||
        `${quiz.title || ""} ${quiz.description || ""}`
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "ALL" || quiz.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [quizzes, search, filter]);

  const handlePublish = async (quiz) => {
    const id = getQuizId(quiz);

    if (!id) return;

    if (
      !window.confirm(
        `Publish "${quiz.title}"? Make sure its schedule and questions are correct.`
      )
    ) {
      return;
    }

    setBusyId(id);
    setActionError("");
    setNotice("");
    setMenuId("");

    try {
      const token = localStorage.getItem("accessToken");

      await axios.patch(
        `${API_URL}/quizzes/${id}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotice(`"${quiz.title}" was published successfully.`);
      await fetchQuizzes();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (quiz) => {
    const id = getQuizId(quiz);

    if (!id) return;

    if (
      !window.confirm(
        `Delete "${quiz.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setBusyId(id);
    setActionError("");
    setNotice("");
    setMenuId("");

    try {
      const token = localStorage.getItem("accessToken");

      await axios.delete(`${API_URL}/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setQuizzes((current) =>
        current.filter((item) => getQuizId(item) !== id)
      );

      setNotice(`"${quiz.title}" was deleted.`);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleCreate = () => navigate("/teacher/quizzes/new");

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 lg:flex">
      {/* Sidebar */}
      <aside className="relative z-30 flex w-full shrink-0 flex-col bg-[#111b31] text-white lg:sticky lg:top-0 lg:h-screen lg:w-[250px]">
        <div className="flex items-center justify-between px-6 py-5 lg:justify-start lg:border-b lg:border-white/10 lg:px-6 lg:py-7">
          <button
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-950/30">
              <BookOpen size={21} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              QuizFlow
            </span>
          </button>

          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-widest text-blue-200 lg:hidden">
            TEACHER
          </span>
        </div>

        <div className="hidden flex-1 px-4 py-7 lg:block">
          <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-500">
            WORKSPACE
          </p>

          <nav className="space-y-1">
            <button
              onClick={() => navigate("/teacher")}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-500/15 px-3 py-3 text-left text-sm font-semibold text-blue-300"
            >
              <LayoutDashboard size={18} />
              Dashboard
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
            </button>

            <button
              onClick={() => {
                setFilter("ALL");
                document
                  .getElementById("quiz-library")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <ClipboardList size={18} />
              Quiz library
            </button>

            <button
              onClick={handleCreate}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <Plus size={18} />
              Create a quiz
            </button>
          </nav>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <ShieldCheck size={18} />
            </div>
            <p className="mt-4 text-sm font-semibold text-white">
              Your classroom, organized.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Manage your assessments and keep your quiz content in one place.
            </p>
          </div>
        </div>

        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="flex items-center gap-3 rounded-xl px-2 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user.name || "Teacher"}
              </p>
              <p className="text-xs text-slate-500">Teacher account</p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>Workspace</span>
                <ChevronRight size={13} />
                <span className="text-slate-600">Dashboard</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                Teacher dashboard
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Teacher workspace
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 lg:hidden">
                {getInitials(user.name)}
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 lg:hidden"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          {/* Welcome section */}
          <section className="relative overflow-hidden rounded-[26px] bg-[#172641] px-6 py-8 text-white shadow-xl shadow-slate-900/5 sm:px-9 sm:py-10">
            <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[45px] border-blue-400/10" />
            <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
                  <Sparkles size={14} />
                  YOUR TEACHING WORKSPACE
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-[38px]">
                  Good to see you, {user.name?.split(" ")[0] || "Teacher"}.
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                  Build meaningful assessments, organize your quizzes, and
                  prepare your classroom for the next challenge.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-400"
                  >
                    <Plus size={18} />
                    Create new quiz
                  </button>

                  <button
                    onClick={() =>
                      document
                        .getElementById("quiz-library")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    View quiz library
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>

              <div className="hidden w-[230px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] p-5 md:block">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200">
                  <GraduationCap size={23} />
                </div>
                <p className="mt-5 text-sm font-semibold">Your classroom</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Every great learning experience starts with a good question.
                </p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-blue-400" />
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Keep creating and improving
                </p>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={FileQuestion}
              label="Total quizzes"
              value={loading ? "—" : quizzes.length}
              description="Your assessment library"
              iconClass="bg-blue-50 text-blue-700"
            />

            <StatCard
              icon={CheckCircle2}
              label="Published quizzes"
              value={loading ? "—" : publishedCount}
              description="Available to students"
              iconClass="bg-emerald-50 text-emerald-700"
            />

            <StatCard
              icon={Pencil}
              label="Drafts"
              value={loading ? "—" : draftCount}
              description="Waiting to be published"
              iconClass="bg-amber-50 text-amber-700"
            />
          </section>

          {/* Notifications */}
          {notice && (
            <div
              role="status"
              className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} />
                {notice}
              </div>
              <button onClick={() => setNotice("")} aria-label="Dismiss">
                <X size={17} />
              </button>
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <CircleAlert size={19} className="mt-0.5 shrink-0" />
              <span>{actionError}</span>
              <button
                onClick={() => setActionError("")}
                className="ml-auto"
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Quiz library */}
          <section id="quiz-library" className="mt-11 scroll-mt-24">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-blue-600">
                  CONTENT MANAGEMENT
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  Quiz library
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Create, review, and manage your assessments.
                </p>
              </div>

              <button
                onClick={fetchQuizzes}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {/* Search and filters */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search quizzes by title or description..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <SlidersHorizontal
                    size={17}
                    className="ml-1 text-slate-400"
                  />
                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    aria-label="Filter quizzes by status"
                    className="min-w-[145px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="ALL">All quizzes</option>
                    <option value="DRAFT">Drafts</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {loading ? "—" : filteredQuizzes.length}
                  </span>{" "}
                  {filteredQuizzes.length === 1 ? "quiz" : "quizzes"}
                </p>

                {(search || filter !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilter("ALL");
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Load error */}
            {pageError && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
              >
                <div className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 text-red-600" size={20} />
                  <div>
                    <p className="font-semibold text-red-800">
                      Could not load your quizzes
                    </p>
                    <p className="mt-1 text-sm text-red-700">{pageError}</p>
                    <button
                      onClick={fetchQuizzes}
                      className="mt-3 text-sm font-semibold text-red-800 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex justify-between">
                      <div className="h-10 w-10 rounded-xl bg-slate-200" />
                      <div className="h-6 w-20 rounded-full bg-slate-100" />
                    </div>
                    <div className="mt-6 h-5 w-2/3 rounded bg-slate-200" />
                    <div className="mt-3 h-3 rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
                    <div className="mt-7 h-24 rounded-xl bg-slate-100" />
                    <div className="mt-5 h-11 rounded-xl bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : !pageError && filteredQuizzes.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <GraduationCap size={30} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {quizzes.length === 0
                    ? "Your quiz library starts here"
                    : "No matching quizzes"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {quizzes.length === 0
                    ? "Create your first assessment, add questions, and publish it when everything is ready."
                    : "We couldn't find a quiz matching your search. Try changing your search or filter."}
                </p>

                {quizzes.length === 0 ? (
                  <button
                    onClick={handleCreate}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Plus size={18} />
                    Create your first quiz
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilter("ALL");
                    }}
                    className="mt-5 text-sm font-semibold text-blue-600"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredQuizzes.map((quiz) => (
                  <QuizCard
                    key={getQuizId(quiz)}
                    quiz={quiz}
                    busy={busyId === getQuizId(quiz)}
                    menuOpen={menuId === getQuizId(quiz)}
                    onMenu={() =>
                      setMenuId((current) =>
                        current === getQuizId(quiz) ? "" : getQuizId(quiz)
                      )
                    }
                    onPublish={() => handlePublish(quiz)}
                    onDelete={() => handleDelete(quiz)}
                    onEdit={() =>
                      navigate(`/teacher/quizzes/${getQuizId(quiz)}/edit`)
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Future analytics note */}
          <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Users size={23} />
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-slate-900">
                  Student performance
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Performance reports, completion rates, and question-level
                  analytics can be added here as the reporting features become
                  available.
                </p>
              </div>

              <span className="w-fit rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                Coming later
              </span>
            </div>
          </section>

          <footer className="flex flex-col items-center justify-between gap-2 py-8 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} QuizFlow</p>
            <p>Designed for better learning experiences.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, description, iconClass }) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500">{description}</p>
        <ArrowUpRight
          size={16}
          className="text-slate-300 transition group-hover:text-blue-500"
        />
      </div>
    </div>
  );
}

function QuizCard({
  quiz,
  busy,
  menuOpen,
  onMenu,
  onPublish,
  onDelete,
  onEdit,
}) {
  const isDraft = quiz.status === "DRAFT";
  const questionCount = Array.isArray(quiz.questions)
    ? quiz.questions.length
    : quiz.questionCount;

  return (
    <article className="group relative flex h-full flex-col overflow-visible rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            isDraft
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <FileQuestion size={21} />
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
              isDraft
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                isDraft ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            {isDraft ? "DRAFT" : "PUBLISHED"}
          </span>

          <button
            onClick={onMenu}
            disabled={busy}
            aria-label={`Actions for ${quiz.title}`}
            aria-expanded={menuOpen}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default"
            onClick={onMenu}
            aria-label="Close quiz actions"
          />

          <div className="absolute right-5 top-16 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
            {isDraft ? (
              <>
                <button
                  onClick={onEdit}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil size={16} />
                  Edit quiz
                </button>

                <button
                  onClick={onPublish}
                  disabled={busy}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                >
                  <Send size={16} />
                  Publish quiz
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={onDelete}
                  disabled={busy}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete quiz
                </button>
              </>
            ) : (
              <p className="px-3 py-2 text-xs leading-5 text-slate-500">
                Published quizzes cannot be edited or deleted using the
                current backend rules.
              </p>
            )}
          </div>
        </>
      )}

      <div className="mt-5">
        <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-7 text-slate-900">
          {quiz.title || "Untitled quiz"}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-6 text-slate-500">
          {quiz.description || "No description added."}
        </p>
      </div>

      <div className="mt-5 space-y-3 rounded-xl bg-slate-50/80 p-4 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <FileQuestion size={16} className="shrink-0 text-slate-400" />
          <span>
            {questionCount != null
              ? `${questionCount} questions`
              : "Question count unavailable"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Clock3 size={16} className="shrink-0 text-slate-400" />
          <span>
            {quiz.durationMinutes
              ? `${quiz.durationMinutes} minutes`
              : "Duration not set"}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <CalendarDays
            size={16}
            className="mt-0.5 shrink-0 text-slate-400"
          />
          <span className="text-xs leading-5">
            <span className="block text-slate-400">Schedule</span>
            {formatDate(quiz.startTime)}
            <span className="mx-1 text-slate-300">→</span>
            {formatDate(quiz.endTime)}
          </span>
        </div>
      </div>

      <div className="mt-auto pt-5">
        {isDraft ? (
          <button
            onClick={onEdit}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
          >
            <Pencil size={16} />
            {busy ? "Processing..." : "Edit draft"}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={17} />
            Published to students
          </div>
        )}
      </div>
    </article>
  );
}

