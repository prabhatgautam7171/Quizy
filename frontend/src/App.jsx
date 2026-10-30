
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Trophy,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  Users,
  Sparkles,
  Zap,
  Target,
  ClipboardCheck,
  ChevronRight,
} from "lucide-react";
import api from "./api/client";

const features = [
  {
    icon: ClipboardCheck,
    title: "Structured assessments",
    description:
      "Take thoughtfully organized quizzes designed to help you test understanding and strengthen what you've learned.",
  },
  {
    icon: Clock3,
    title: "Timed quiz sessions",
    description:
      "Work within clear time limits, track your progress, and submit your answers with server-enforced deadlines.",
  },
  {
    icon: Trophy,
    title: "Performance rankings",
    description:
      "Compare results on the global leaderboard and see how your performance develops over time.",
  },
  {
    icon: BarChart3,
    title: "Meaningful results",
    description:
      "Review your scores, completed assessments, and performance to identify areas for improvement.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable assessments",
    description:
      "Experience controlled quiz sessions with protected answers and consistent assessment rules.",
  },
  {
    icon: Users,
    title: "Built for learners and teachers",
    description:
      "Teachers can create and manage assessments while students can participate and review their results.",
  },
];

const steps = [
  {
    number: "01",
    title: "Find your next quiz",
    description:
      "Explore published assessments and choose a topic you want to practice.",
  },
  {
    number: "02",
    title: "Put your knowledge to work",
    description:
      "Answer questions in a focused session and complete the assessment within its time limit.",
  },
  {
    number: "03",
    title: "Review and improve",
    description:
      "Check your results, follow your progress, and see where you stand on the leaderboard.",
  },
];

export default function App() {
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    api
      .get("/health")
      .then(() => {
        if (active) setBackendStatus("connected");
      })
      .catch(() => {
        if (active) setBackendStatus("disconnected");
      });

    return () => {
      active = false;
    };
  }, []);

  const statusLabel = {
    checking: "Checking platform status",
    connected: "All systems operational",
    disconnected: "Unable to reach the API",
  }[backendStatus];

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition group-hover:bg-blue-700">
              <BookOpen size={21} strokeWidth={2.2} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Quiz<span className="text-blue-600">Flow</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              About
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 sm:px-5"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-40 -top-32 h-[520px] w-[520px] rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute -left-40 top-48 h-[360px] w-[360px] rounded-full bg-indigo-50/70 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700">
              <Sparkles size={14} />
              A smarter way to assess and learn
            </div>

            <h1 className="text-5xl font-bold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[68px]">
              Learning gets better when you{" "}
              <span className="text-blue-600">know your progress.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Create assessments, take timed quizzes, and understand your
              performance. QuizFlow brings learning, evaluation, and progress
              together in one simple platform.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Get started for free
                <ArrowRight size={17} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Sign in to QuizFlow
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Student and teacher accounts
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Timed assessments
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-[570px] lg:ml-auto">
            <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-br from-blue-100/80 via-indigo-50/50 to-transparent blur-2xl" />

            <div className="relative overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/[0.08]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <GraduationCap size={19} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Learning overview
                    </p>
                    <p className="text-xs text-slate-400">
                      Your learning workspace
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Preview
                </span>
              </div>

              <div className="p-5 sm:p-7">
                <div>
                  <p className="text-sm text-slate-500">Ready to learn?</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    Make every attempt count.
                  </h2>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <BookOpen size={18} />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                      Quizzes
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Explore assessments
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Trophy size={18} />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                      Rankings
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Track performance
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Your learning journey
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        A simple three-step process
                      </p>
                    </div>
                    <Target size={20} className="text-blue-600" />
                  </div>

                  <div className="mt-5 space-y-4">
                    {[
                      ["Explore assessments", "Find a quiz that interests you"],
                      ["Complete your quiz", "Answer questions within the time"],
                      ["Review your results", "Understand your performance"],
                    ].map(([title, description], index) => (
                      <div key={title} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                          0{index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800">
                            {title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {description}
                          </p>
                        </div>
                        <CheckCircle2
                          size={17}
                          className="shrink-0 text-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl bg-blue-50/80 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Zap size={17} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-900">
                      Ready when you are
                    </span>
                  </div>
                  <ChevronRight size={17} className="text-blue-600" />
                </div>
              </div>
            </div>

           
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              The platform
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything you need to learn with purpose.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              From creating assessments to understanding results, QuizFlow
              gives learners and teachers the tools to make every quiz count.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/[0.04]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={21} />
                  </div>
                  <p className="mt-6 text-xs font-bold tracking-wider text-slate-400">
                    FEATURE 0{index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="max-w-lg">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Simple by design
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                From your first quiz to your next achievement.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                A straightforward experience that keeps the focus where it
                belongs: on learning, practicing, and improving.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition hover:gap-3"
              >
                Create your account
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 sm:gap-6 sm:p-7"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-slate-950 px-6 py-14 text-center sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <Sparkles size={13} />
              Your next step starts here
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to put your knowledge to the test?
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Join QuizFlow and make every assessment an opportunity to learn
              something new.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Get started
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BookOpen size={17} />
            </span>
            <span className="font-bold tracking-tight text-slate-900">
              Quiz<span className="text-blue-600">Flow</span>
            </span>
          </Link>

          <p className="text-sm text-slate-500">
            Learn. Practice. Improve.
          </p>

          <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:gap-5">
            <span className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === "connected"
                    ? "bg-emerald-500"
                    : backendStatus === "disconnected"
                      ? "bg-red-500"
                      : "animate-pulse bg-amber-400"
                }`}
              />
              {statusLabel}
            </span>
            <span>© {new Date().getFullYear()} QuizFlow</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

