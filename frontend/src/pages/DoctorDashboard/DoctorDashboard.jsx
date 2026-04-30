import { useState, useEffect } from "react";
import "./DoctorDashboard.css";
import * as appointmentService from "@/services/appointmentService";
import API from "@/services/api";

export default function DoctorDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  // FETCH
  const fetchPatients = async () => {
    try {
      const data = await appointmentService.getAppointmentsByDoctor(
        user?.doctorProfileId || user?.id
      );

      const formatted = data.map((p) => ({
        id: p.id,
        name: p.name,
        token: p.tokenNumber,
        status: p.status,
        age: p.patientAge,
        issue: p.problem,
        phone: p.phone,
      }));

      setPatients(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) fetchPatients();
  }, [user]);

  const completedCount = patients.filter(p => p.status === "COMPLETED").length;
  const remainingCount = patients.filter(p => p.status === "WAITING").length;

  // START
  const startPatient = (p) => {
    setPatients(prev =>
      prev.map(pt =>
        pt.id === p.id
          ? { ...pt, status: "IN_PROGRESS", startTime: Date.now() }
          : pt
      )
    );

    setActivePatient({ ...p, mode: "ACTIVE" });
  };

  // COMPLETE (API INTEGRATED)
  const completePatient = async () => {
    try {
      const endTime = Date.now();
      const duration = Math.floor(
        (endTime - activePatient.startTime) / 1000
      );

      // send to backend
      await API.patch(`/api/v1/appointments/${activePatient.id}`, {
        status: "COMPLETED",
        startTime: activePatient.startTime,
        endTime,
        duration,
      });

      await fetchPatients(); // refresh

      setActivePatient(null);
    } catch (err) {
      console.error(err);
    }
  };

  // CLOSE
  const closePatient = () => {
    setPatients(prev =>
      prev.map(p =>
        p.id === activePatient.id
          ? { ...p, status: "WAITING" }
          : p
      )
    );
    setActivePatient(null);
  };

  // REJECT (API)
  const rejectPatient = async () => {
    try {
      await appointmentService.rejectAppointment(activePatient.id);
      await fetchPatients();
      setActivePatient(null);
    } catch (err) {
      console.error(err);
    }
  };

  const activeList = patients.filter(p => p.status === "WAITING");
  const completedList = patients.filter(p => p.status === "COMPLETED");

  return (
    <div className="doc-root">

      {/* HEADER */}
      <div className="doc-top">
        <h2> Dr. {user?.name || "Doctor"}</h2>

        <div className="doc-stats">
          <span>Remaining: {remainingCount}</span>
          <span>Completed: {completedCount}</span>
        </div>
      </div>

      {/* BODY */}
      <div className="doc-body">

        {/* ACTIVE */}
        <div className="doc-panel">
          <h3>Active Queue</h3>

          {activeList.map(p => (
            <div className="row" key={p.id}>
              <div>
                <h4>#{p.token} • {p.name}</h4>
                <p>{p.issue}</p>
              </div>

              <button onClick={() => startPatient(p)}>Start</button>
            </div>
          ))}
        </div>

        {/* COMPLETED */}
        <div className="doc-panel">
          <h3>Completed</h3>

          {completedList.map(p => (
            <div
              className="row completed clickable"
              key={p.id}
              onClick={() => setActivePatient({ ...p, mode: "VIEW" })}
            >
              #{p.token} • {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* OVERLAY */}
      <div className={`focus-overlay ${activePatient ? "show" : ""}`}>
        {activePatient && (
          <div className="focus-card">

            <h2>{activePatient.name}</h2>
            <p className="token">Token #{activePatient.token}</p>

            <div className="details">
              <p><strong>Age:</strong> {activePatient.age}</p>
              <p><strong>Phone:</strong> {activePatient.phone}</p>
              <p><strong>Issue:</strong> {activePatient.issue}</p>
            </div>

            {activePatient.mode === "ACTIVE" && (
              <>
                <button onClick={() => setConfirmOpen(true)}>
                  Finish Consultation
                </button>

                <button
                  style={{ background: "#dc2626", color: "white" }}
                  onClick={() => setRejectConfirmOpen(true)}
                >
                  Reject Patient
                </button>
              </>
            )}

            <button
              className="close-btn"
              onClick={() =>
                activePatient.mode === "ACTIVE"
                  ? setCloseConfirmOpen(true)
                  : setActivePatient(null)
              }
            >
              Close
            </button>

          </div>
        )}
      </div>

      {/* FINISH */}
      {confirmOpen && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>Complete this consultation?</p>

            <div className="confirm-actions">
              <button
                className="yes"
                onClick={() => {
                  completePatient();
                  setConfirmOpen(false);
                }}
              >
                Yes
              </button>

              <button className="no" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE */}
      {closeConfirmOpen && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>Exit consultation?</p>

            <div className="confirm-actions">
              <button
                className="yes"
                onClick={() => {
                  closePatient();
                  setCloseConfirmOpen(false);
                }}
              >
                Yes
              </button>

              <button className="no" onClick={() => setCloseConfirmOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT */}
      {rejectConfirmOpen && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>Reject this patient?</p>

            <div className="confirm-actions">
              <button
                className="yes"
                onClick={() => {
                  rejectPatient();
                  setRejectConfirmOpen(false);
                }}
              >
                Yes
              </button>

              <button className="no" onClick={() => setRejectConfirmOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}