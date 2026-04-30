import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./UserDashboard.css";
import logo from "@/assets/logo.png";
import { getPatient } from "@/services/userDashboardService";

export default function UserDashboard() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatient()
      .then((res) => {
        setPatient(res.data); // adjust if needed: res.data.data
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  // Loading state
  if (loading) {
    return <div className="UserDashboard-container">Loading...</div>;
  }

  // No data fallback
  if (!patient) {
  return (
    <div className="UserDashboard-container">
      <div className="card empty-card">
        <h2>No Active Appointment</h2>
        <p>Please book an appointment first</p>

        <Link to="/" className="home-btn">
          Book Appointment
        </Link>
      </div>
    </div>
  );
}

  const urgent = Number(patient.queueNumber) < 5;

  return (
    <div className="UserDashboard-container">
      <div className="card">

        {/* Top Row */}
        <div className="top-row">
          <div className="left-info">
            <img src={logo} className="title" alt="logo" />
            <h2 className="name">{patient.patientName}</h2>
          </div>

          <div className={`queue-box small ${urgent ? "urgent-box" : ""}`}>
            <p>Your Queue Number</p>
            <h3>
              {patient.queueNumber === 1
                ? "You are next"
                : patient.queueNumber}
            </h3>
          </div>
        </div>

        {/* Waiting Time */}
        <div className={`queue-box time-box ${urgent ? "urgent-box" : ""}`}>
          <p>Estimated Waiting Time</p>
          <h3>
            {patient.queueNumber === 1
              ? "0 Minutes"
              : patient.estimatedTime + " Minutes"}
          </h3>
        </div>

        {/* Info */}
        <div className="info">
          <span>Doctor</span>
          <strong>{patient.doctorName}</strong>
        </div>

        <div className="info">
          <span>Status</span>
          <span className="status waiting">
            {patient.queueNumber === 1
              ? "Next in queue"
              : patient.status}
          </span>
        </div>

        <button className="leave-btn">Leave Queue</button>

        <Link to="/" className="home-btn">
          Back to Home
        </Link>

      </div>
    </div>
  );
}