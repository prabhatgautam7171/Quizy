
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const token = localStorage.getItem("accessToken");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "TEACHER") {
      return <Navigate to="/teacher" replace />;
    }

    if (user.role === "STUDENT") {
      return <Navigate to="/student" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
