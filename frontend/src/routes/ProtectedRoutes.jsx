import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  role,
  requireToken
}) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (role) {
    if (!token || !user) {
      return <Navigate to="/authpage" replace />;
    }

    if (user.role !== role) {
      return <Navigate to="/" replace />;
    }
  }

  if (requireToken) {
    if (!token) {
      return <Navigate to="/patientregister" replace />;
    }
  }

  return children;
}