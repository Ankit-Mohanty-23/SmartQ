import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar";
import QueueView from "./components/queueView";
import "./Receptionist.css";
import AppointmentRequests from "./components/AppointmentRequests"; 
import NewBooking from "./components/NewBooking";
import Topbar from "./components/Topbar";

export default function Receptionist() {
  const [view, setView] = useState("queue");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);

  // ✅ Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/v1/doctors");
        const data = await res.json();
        setDoctors(data.data);

        // auto select first doctor
        if (data.data.length > 0) {
          setSelectedDoctor(data.data[0].id);
        }
      } catch (err) {
        console.error(err);
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
        <Topbar/>
        {view === "queue" && <QueueView selectedDoctor={selectedDoctor} />}
        {view === "appointments" && <AppointmentRequests setView={setView} />}
        {view === "book" && <NewBooking />}
      </div>
    </div>
  );
}
