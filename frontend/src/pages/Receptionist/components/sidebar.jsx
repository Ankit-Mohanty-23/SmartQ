import logo from "@/assets/logo.png";
import { useEffect, useState } from "react";
import {
  getAppointmentsByDoctor,
  getAppointments,
} from "@/services/appointmentService";
import { Link } from "react-router-dom";

export default function Sidebar({
  view,
  setView,
  doctors,
  selectedDoctor,
  setSelectedDoctor,
}) {
  const [dateTime, setDateTime] = useState("");
  const [doctorStats, setDoctorStats] = useState({});
  const [pendingCount, setPendingCount] = useState(0);

  // Date time
  useEffect(() => {
    const update = () => {
      const now = new Date();

      const date = now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const time = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setDateTime(`${date} · ${time}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch queue stats for each doctor
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = {};

        for (let doc of doctors) {
          const appts = await getAppointmentsByDoctor(doc.id);

          const waiting = appts.filter((p) => p.status === "PENDING").length;

          const inProgress = appts.filter(
            (p) => p.status === "IN_PROGRESS",
          ).length;

          stats[doc.id] = { waiting, inProgress };
        }

        setDoctorStats(stats);
      } catch (err) {
        console.error(err);
      }
    };

    if (doctors.length) loadStats();
  }, [doctors]);

  // Fetch pending appointment count (for badge)
  useEffect(() => {
    const loadPending = async () => {
      try {
        const appts = await getAppointments("PENDING");
        setPendingCount(appts.length);
      } catch (err) {
        console.error(err);
      }
    };

    loadPending();

    // auto refresh every 5 sec
    const interval = setInterval(loadPending, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rq-sidebar">
      {/* Logo */}
      <Link to={"/"}>
        <img src={logo} className="title" />
      </Link>
      <p className="rq-date">{dateTime}</p>

      {/* Navigation */}
      <p className="rq-nav-title">Navigation</p>

      <div
        className={`rq-nav-item ${view === "queue" ? "active" : ""}`}
        onClick={() => setView("queue")}
      >
        <i className="fa-solid fa-bars-staggered"></i> Queue monitor
      </div>

      <div
        className={`rq-nav-item ${view === "appointments" ? "active" : ""}`}
        onClick={() => setView("appointments")}
      >
        <i className="fa-regular fa-envelope"></i> Appointment requests
        <span className="rq-badge">{pendingCount}</span>
      </div>

      <div
        className={`rq-nav-item ${view === "book" ? "active" : ""}`}
        onClick={() => setView("book")}
      >
        <i className="fa-solid fa-circle-plus"></i> New booking
      </div>

      {/* Doctors */}
      <p className="rq-nav-title">Doctors today</p>

      {doctors.map((doc) => {
        const stats = doctorStats[doc.id] || {
          waiting: 0,
          inProgress: 0,
        };

        return (
          <div
            key={doc.id}
            className={`rq-doc ${selectedDoctor === doc.id ? "selected" : ""}`}
            onClick={() => setSelectedDoctor(doc.id)}
          >
            <h4>{doc.name}</h4>
            <p className="rq-dept">{doc.department}</p>

            <div className="rq-status-line">
              <span
                className={`dot ${
                  stats.inProgress > 0
                    ? "orange"
                    : stats.waiting > 0
                      ? "green"
                      : "gray"
                }`}
              ></span>

              {stats.inProgress > 0 && `${stats.inProgress} in progress`}
              {stats.inProgress > 0 && stats.waiting > 0 && " · "}
              {stats.waiting > 0 && `${stats.waiting} waiting`}
              {stats.inProgress === 0 && stats.waiting === 0 && "Available"}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="rq-footer">
        <span className="dot green"></span>
        OPD open
      </div>
    </div>
  );
}
