import { useEffect, useState } from "react";
import { getAppointmentsByDoctor } from "@/services/appointmentService";
import { getDoctorById } from "@/services/doctorService";

export default function QueueView({ selectedDoctor }) {
  const [patients, setPatients] = useState([]);
  const [doctor, setDoctor] = useState(null);

  // 🔥 Load data
  const loadData = async () => {
    if (!selectedDoctor) return;
    console.log("Fetching data...", new Date().toLocaleTimeString());

    try {
      const [doc, appts] = await Promise.all([
        getDoctorById(selectedDoctor),
        getAppointmentsByDoctor(selectedDoctor),
      ]);

      setDoctor(doc || null);
      setPatients(appts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedDoctor]);

  // ✅ Stats
  const waiting = patients.filter((p) => p.status === "PENDING").length;
  const inProgress = patients.filter((p) => p.status === "IN_PROGRESS").length;
  const completed = patients.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="rq-right">
      {/* Header */}
      <div className="rq-header">
        <div>
          <h2>{doctor?.name || "Queue Monitor"}</h2>

          {/* 🔥 NEW: dept + opd */}
          <p style={{ fontSize: "14px", color: "#666" }}>
            {doctor?.department || "Department"} ·{" "}
            {doctor?.opdTime || "OPD Time"}
          </p>
        </div>

        <button className="rq-refresh" onClick={loadData}>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="rq-stats">
        <div className="rq-stat-card">
          <p>Total Patients</p>
          <h3>{patients.length}</h3>
        </div>

        <div className="rq-stat-card">
          <p>Waiting</p>
          <h3>{waiting}</h3>
        </div>

        <div className="rq-stat-card">
          <p>In Progress</p>
          <h3>{inProgress}</h3>
        </div>

        <div className="rq-stat-card">
          <p>Completed</p>
          <h3>{completed}</h3>
        </div>
      </div>

      {/* Table */}
      <div className="rq-table-card">
        <table className="rq-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Patient</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {patients.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{p.name}</td>
                <td>{p.preferredDate}</td>
                <td>
                  <span className={`rq-status ${p.status}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}