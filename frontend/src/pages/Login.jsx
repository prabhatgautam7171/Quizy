
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
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ChartNoAxesColumnIncreasing,
  Trophy,
  CircleAlert,
} from "lucide-react";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        form
      );

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("The server returned an invalid login response.");
      }

      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate(user.role === "TEACHER" ? "/teacher" : "/student");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F8FC] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.07)] sm:min-h-[calc(100vh-40px)] lg:grid-cols-[1.02fr_0.98fr] lg:rounded-[32px]">

        {/* LEFT VISUAL PANEL */}
        <section className="relative hidden overflow-hidden bg-[#101B35] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          {/* Background decoration */}
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
                  id="login-grid"
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
              <rect width="100%" height="100%" fill="url(#login-grid)" />
            </svg>
          </div>

          {/* Brand */}
          <Link
            to="/"
            className="relative z-10 flex w-fit items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-lg">
              <BookOpen size={22} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Quiz<span className="text-blue-400">Flow</span>
            </span>
          </Link>

          {/* Main content */}
          <div className="relative z-10 my-5">


            <h1 className="max-w-xl text-5xl font-bold leading-[1.12] tracking-[-0.04em] xl:text-[58px]">
              Make progress.
              <br />
              <span className="text-blue-400">One question</span>
              <br />
              at a time.
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
              Sign in to access your assessments, measure your performance,
              and keep moving towards your learning goals.
            </p>

            {/* Dashboard illustration */}
            <div className="mt-12 max-w-[470px] rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl xl:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    YOUR LEARNING SPACE
                  </p>
                  <h3 className="mt-1.5 text-lg font-bold text-white">
                    Keep building momentum
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300">
                  <ChartNoAxesColumnIncreasing size={21} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center gap-2 text-blue-300">
                    <BookOpen size={16} />
                    <span className="text-xs font-medium text-slate-300">
                      Assessments
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-bold">Learn</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Test your knowledge
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Trophy size={16} />
                    <span className="text-xs font-medium text-slate-300">
                      Achievements
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-bold">Improve</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Track your results
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Your next step
                  </span>
                  <span className="text-xs text-blue-300">
                    Keep going
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Sign in to your account
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Pick up where you left off
                    </p>
                  </div>
                  <ArrowRight size={17} className="ml-auto text-slate-400" />
                </div>
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
              Secure account access
            </div>
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-[430px]">

            {/* Mobile brand */}
            <Link
              to="/"
              className="mb-12 flex w-fit items-center gap-3 lg:hidden"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BookOpen size={21} />
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Quiz<span className="text-blue-600">Flow</span>
              </span>
            </Link>

            <div className="mb-10">
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <LockKeyhole size={25} strokeWidth={1.8} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Account access
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-[42px]">
                Welcome back.
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Enter your account details to continue to your QuizFlow
                workspace.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <CircleAlert size={18} className="mt-0.5 shrink-0" />
                <p className="leading-6">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2.5 block text-sm font-semibold text-slate-800"
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
                    className="h-[56px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    Forgot password?
                  </Link>
                </div>

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
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="h-[56px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
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
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    Continue to QuizFlow
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Register */}
            <div className="mt-9 border-t border-slate-100 pt-7">
              <p className="text-center text-sm text-slate-500">
                New to QuizFlow?{" "}
                <Link
                  to="/register"
                  className="font-bold text-blue-600 transition hover:text-blue-700"
                >
                  Create an account
                </Link>
              </p>
            </div>

            {/* Trust note */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              Your account information is handled securely.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

