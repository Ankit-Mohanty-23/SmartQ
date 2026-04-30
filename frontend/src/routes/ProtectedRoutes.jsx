import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { getCurrentUser } from "../services/authService";

export default function ProtectedRoute({ children, role, requireToken }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

   useEffect(() => {
    const token = localStorage.getItem("token");
    if(!token){
      return;
    }
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();

        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        localStorage.removeItem("user");
      }
    };

    loadUser();
  }, []);

  // STAFF PROTECTION
  if (role) {
    if (!token|| !user) return <Navigate to="AuthPage" replace />;

    if (user.role !== role) return <Navigate to="/" replace />;
  }

  // PATIENT DASHBOARD PROTECTION
  if (requireToken) {
    if (!token) return <Navigate to="/PatientRegister" replace />;
  }

  return children;
}
