import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role, requireToken }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("patientToken");

  // STAFF PROTECTION
  if (role) {
    if (!user) return <Navigate to="/AuthPage" />;
    if (user.role !== role) return <Navigate to="/" />;
  }

  // PATIENT DASHBOARD PROTECTION
  if (requireToken) {
    if (!token) return <Navigate to="/PatientRegister" replace />;
  }

  return children;
}