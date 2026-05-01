import { useEffect, useState, useRef } from "react";
import { getAppointmentsByDoctor } from "@/services/appointmentService";
import { getDoctorById } from "@/services/doctorService";

export default function QueueView({ selectedDoctor }) {
  const [patients, setPatients] = useState([]);
  const [doctor, setDoctor] = useState(null);

  const called = useRef(false);

  const loadData = async () => {
    if (!selectedDoctor) return;

    try {
      const [doc, appts] = await Promise.all([
        getDoctorById(selectedDoctor),
        getAppointmentsByDoctor(selectedDoctor),
      ]);

      setDoctor(doc || null);
      setPatients(appts || []);
    } catch (err) {
      console.error(err);
      setDoctor(null);
      setPatients([]);
    }
  };

  useEffect(() => {
    called.current = false;
  }, [selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctor) return;
    if (called.current) return;

    called.current = true;

    loadData();
  }, [selectedDoctor]);

  const waiting = patients.filter((p) => p.status === "PENDING").length;
  const inProgress = patients.filter((p) => p.status === "IN_PROGRESS").length;
  const completed = patients.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="rq-right">
      <div className="rq-header">
        <div>
          <h2>{doctor?.name || "Queue Monitor"}</h2>

          <p style={{ fontSize: "14px", color: "#666" }}>
            {doctor?.department || "Department"} ·{" "}
            {doctor?.opdTime || "OPD Time"}
          </p>
        </div>

        <button className="rq-refresh" onClick={loadData}>
          Refresh
        </button>
      </div>

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
            {(patients || []).map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{p.name}</td>
                <td>{p.preferredDate}</td>
                <td>
                  <span className={`rq-status ${p.status}`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
