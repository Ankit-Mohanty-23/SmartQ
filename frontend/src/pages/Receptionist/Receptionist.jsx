import { useEffect, useState, useRef } from "react";
import Sidebar from "./components/sidebar";
import QueueView from "./components/queueView";
import "./Receptionist.css";
import AppointmentRequests from "./components/AppointmentRequests";
import NewBooking from "./components/NewBooking";
import Topbar from "./components/Topbar";
import API from "../../services/api.js"

export default function Receptionist() {
  const [view, setView] = useState("queue");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const loaded = useRef(false);

  // Fetch doctors only once
  useEffect(() => {
    if (loaded.current) return;

    loaded.current = true;

    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await API.get("/doctors",{
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const docs = res.data.data || [];

        setDoctors(docs);

        if (docs.length > 0) {
          setSelectedDoctor(docs[0].id);
        }

      } catch (err) {
        console.error(err);
        setDoctors([]);
      }
    };

    fetchDoctors();

  }, []);

  return (
    <div className="rq-container">
      <Sidebar
        view={view}
        setView={setView}
        doctors={doctors}
        selectedDoctor={selectedDoctor}
        setSelectedDoctor={setSelectedDoctor}
      />

      <div className="rq-main">
        <Topbar />

        {view === "queue" && (
          <QueueView selectedDoctor={selectedDoctor} />
        )}

        {view === "appointments" && (
          <AppointmentRequests setView={setView} />
        )}

        {view === "book" && <NewBooking />}
      </div>
    </div>
  );
}