import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage/LandingPage";
import UserDashboard from "../pages/UserDashboard/UserDashboard";
import AuthPage from "../pages/AuthPage/AuthPage";
import PatientRegister from "../pages/PatientRegister/PatientRegister";
import BookingSuccess from "../pages/BookingSuccess/BookingSucess";
import ReceptionistDashboard from "../pages/Receptionist/Receptionist";
import DoctorDashboard from "../pages/DoctorDashboard/DoctorDashboard";
import ProtectedRoute from "../routes/ProtectedRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="AuthPage" element={<AuthPage />} />
      <Route path="PatientRegister" element={<PatientRegister />} />
      <Route path="BookingSuccess" element={<BookingSuccess />} />

      {/* PATIENT */}
      <Route
        path="UserDashboard"
        element={
          <ProtectedRoute requireToken={true}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      {/* STAFF */}
      <Route
        path="Receptionist"
        element={
          <ProtectedRoute role="RECEPTIONIST">
            <ReceptionistDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="Doctor"
        element={
          <ProtectedRoute role="DOCTOR">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
