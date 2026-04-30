import { useEffect, useState } from "react";
import { getAppointments } from "@/services/appointmentService";
import { getAllDoctors } from "@/services/doctorService";
import {
  convertToToken,
  rejectAppointment,
} from "@/services/appointmentService";

export default function AppointmentRequests({ setView }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");

  const loadData = async () => {
    try {
      const [appts, docs] = await Promise.all([
        getAppointments(),
        getAllDoctors(),
      ]);

      setAppointments(appts || []);
      setDoctors(docs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Assign doctor (local state)
  const handleDoctorChange = (appointmentId, doctorId) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId ? { ...a, assignedDoctorId: doctorId } : a,
      ),
    );
  };

  // 🔹 Accept → convert to token
  const handleConfirm = async (a) => {
    try {
      if (!a.assignedDoctorId) {
        alert("Please assign a doctor first");
        return;
      }

      await convertToToken(a.id, a.assignedDoctorId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Reject
  const handleReject = async (appointmentId) => {
    try {
      await rejectAppointment(appointmentId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Filter tabs
  const filteredAppointments =
    activeTab === "PENDING"
      ? appointments.filter((a) => a.status === "PENDING")
      : appointments;

  return (
    <div className="rq-right">
      {/* Header */}
      <div className="rq-header">
        <div>
          <h2>Appointment requests</h2>
          <p className="rq-sub">
            Review and process pre-bookings from patients
          </p>
        </div>

        <button className="rq-new-btn" onClick={() => setView("book")}>
          + New token
        </button>
      </div>

      {/* Tabs */}
      <div className="rq-tabs">
        <button
          className={activeTab === "PENDING" ? "active-tab" : ""}
          onClick={() => setActiveTab("PENDING")}
        >
          Pending ({appointments.filter((a) => a.status === "PENDING").length})
        </button>

        <button
          className={activeTab === "ALL" ? "active-tab" : ""}
          onClick={() => setActiveTab("ALL")}
        >
          All requests
        </button>
      </div>

      {/* List */}
      {filteredAppointments.map((a) => {
        const requestedDoc = doctors.find((d) => d.id === a.requestedDoctorId);

        const assignedDoc = doctors.find((d) => d.id === a.assignedDoctorId);

        return (
          <div key={a.id} className="appt-card">
            <div className="appt-top">
              <div>
                <h4>{a.name}</h4>
                <p>{a.phone}</p>
                <p>{a.problem}</p>

                <p className="appt-meta">
                  Requested: {a.preferredDate} ·{" "}
                  {requestedDoc
                    ? `Prefers: ${requestedDoc.name}`
                    : "No preference"}{" "}
                  ·{" "}
                  {assignedDoc
                    ? `Assigned: ${assignedDoc.name}`
                    : "Not assigned"}
                </p>
              </div>

              <span className={`appt-status ${a.status}`}>{a.status}</span>
            </div>

            {/* Only PENDING actions */}
            {a.status === "PENDING" && (
              <div className="appt-actions">
                <select
                  className="appt-select"
                  value={a.assignedDoctorId || ""}
                  onChange={(e) =>
                    handleDoctorChange(a.id, Number(e.target.value))
                  }
                >
                  <option value="">Assign doctor...</option>

                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}{" "}
                      {d.id === a.requestedDoctorId ? "(Preferred)" : ""}
                    </option>
                  ))}
                </select>

                <button
                  className="confirm-btn"
                  onClick={() => handleConfirm(a)}
                >
                  Confirm + convert to token
                </button>

                <button
                  className="reject-btn"
                  onClick={() => handleReject(a.id)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
