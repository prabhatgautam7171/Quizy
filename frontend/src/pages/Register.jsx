
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  LockKeyhole,
  UserRound,
  GraduationCap,
  Presentation,
  CheckCircle2,
  CircleAlert,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  ChartNoAxesColumnIncreasing,
  Users,
} from "lucide-react";
import axios from "axios";

const roles = [
  {
    value: "STUDENT",
    title: "Student",
    description: "Take quizzes and track your progress.",
    detail: "Learn at your own pace",
    icon: GraduationCap,
  },
  {
    value: "TEACHER",
    title: "Teacher",
    description: "Create and manage assessments.",
    detail: "Build learning experiences",
    icon: Presentation,
  },
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
  };

  const handleRoleChange = (role) => {
    setForm((current) => ({
      ...current,
      role,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        form
      );

      setSuccess("Your account has been created. Redirecting to login...");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F8FC] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.07)] sm:min-h-[calc(100vh-40px)] lg:grid-cols-[0.95fr_1.05fr] lg:rounded-[32px]">

        {/* LEFT PANEL */}
        <section className="relative hidden overflow-hidden bg-[#101B35] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full border border-white/[0.07]" />
            <div className="absolute -right-20 -top-20 h-[380px] w-[380px] rounded-full border border-white/[0.07]" />
            <div className="absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
            <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-[90px]" />

            <svg
              className="absolute inset-0 h-full w-full opacity-[0.08]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="register-grid"
                  width="42"
                  height="42"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 42 0 L 0 0 0 42"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.7"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#register-grid)" />
            </svg>
          </div>

          {/* Brand */}
          <Link
            to="/"
            className="relative z-10 flex w-fit items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
              <BookOpen size={22} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Quiz<span className="text-blue-400">Flow</span>
            </span>
          </Link>

          {/* Main message */}
          <div className="relative z-10 my-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3.5 py-2 text-xs font-semibold text-blue-200">
              <Sparkles size={14} />
              Start something meaningful
            </div>

            <h1 className="max-w-xl text-5xl font-bold leading-[1.12] tracking-[-0.04em] xl:text-[58px]">
              One platform.
              <br />
              <span className="text-blue-400">Two ways</span>
              <br />
              to grow.
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
              Whether you're here to learn or teach, QuizFlow gives you a
              focused space to create, participate, and make progress.
            </p>

            {/* Role showcase */}
            <div className="mt-12 max-w-[470px] space-y-3">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300">
                  <GraduationCap size={23} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white">For students</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Participate in assessments and monitor your performance.
                  </p>
                </div>
                <ArrowRight size={17} className="ml-auto text-slate-500" />
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300">
                  <Presentation size={22} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white">For teachers</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Build quizzes, manage assessments, and evaluate results.
                  </p>
                </div>
                <ArrowRight size={17} className="ml-auto text-slate-500" />
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6">
            <p className="text-xs text-slate-400">
              Learn. Practice. Improve.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} className="text-emerald-400" />
              Secure registration
            </div>
          </div>
        </section>

        {/* RIGHT REGISTRATION PANEL */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-[490px]">

            {/* Mobile brand */}
            <Link
              to="/"
              className="mb-10 flex w-fit items-center gap-3 lg:hidden"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BookOpen size={21} />
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Quiz<span className="text-blue-600">Flow</span>
              </span>
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Sparkles size={25} strokeWidth={1.8} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Create your account
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-[42px]">
                Join QuizFlow.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Set up your account and get started with a better way to
                assess, learn, and improve.
              </p>
            </div>

            {/* Feedback */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <CircleAlert size={18} className="mt-0.5 shrink-0" />
                <p className="leading-6">{error}</p>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <p className="leading-6">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Role selection */}
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-800">
                  How will you use QuizFlow?
                </legend>

                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const selected = form.role === role.value;

                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleChange(role.value)}
                        aria-pressed={selected}
                        className={`relative rounded-2xl border p-4 text-left transition duration-200 ${
                          selected
                            ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/10"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              selected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon size={21} />
                          </span>

                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selected && <CheckCircle2 size={14} />}
                          </span>
                        </div>

                        <p className="mt-4 text-sm font-bold text-slate-900">
                          {role.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {role.description}
                        </p>
                        <p
                          className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${
                            selected ? "text-blue-700" : "text-slate-400"
                          }`}
                        >
                          {role.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Full name
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <UserRound
                      size={19}
                      className="text-slate-400 transition group-focus-within:text-blue-600"
                    />
                  </div>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                    className="h-[54px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Email address
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail
                      size={19}
                      className="text-slate-400 transition group-focus-within:text-blue-600"
                    />
                  </div>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="h-[54px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Create password
                </label>

                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <LockKeyhole
                      size={19}
                      className="text-slate-400 transition group-focus-within:text-blue-600"
                    />
                  </div>

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a secure password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="h-[54px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-800"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck size={13} />
                  Use at least 8 characters for your password.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || Boolean(success)}
                className="group flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    Create your account
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Login link */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-blue-600 transition hover:text-blue-700"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Users size={14} />
              Built for learners and educators
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

