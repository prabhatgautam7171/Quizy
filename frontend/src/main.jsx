
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./index.css";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import CreateQuiz from "./pages/CreateQuiz";
import AttemptQuiz from "./pages/AttemptQuiz";
import AttemptResult from "./pages/AttemptResult";
import GlobalLeaderboard from "./pages/Leaderboard";

function Placeholder({ title }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-3xl font-bold">{title} — Coming soon</h1>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/teacher/quizzes/new" element={<CreateQuiz />} />
        <Route path="/attempt/:attemptId" element={<AttemptQuiz />} />
        <Route path="/attempt/:attemptId/result" element={<AttemptResult />}/>
        <Route path="/leaderboard" element={<GlobalLeaderboard />}/>
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
