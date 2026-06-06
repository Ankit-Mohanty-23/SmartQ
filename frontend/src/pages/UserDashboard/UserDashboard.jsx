import { Link } from "react-router-dom";
import { useState } from "react";
import "./UserDashboard.css";
import logo from "@/assets/logo.png";
import { getPatient } from "@/services/userDashboardService";

export default function UserDashboard() {
  const [phone, setPhone] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!phone) {
      alert("Please enter phone number");
      return;
    }

    try {
      setLoading(true);

      const data = await getPatient(phone);

      setPatient(data);
      setSearched(true);
    } catch (err) {
      console.log(err);
      setPatient(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="UserDashboard-container">Loading...</div>;
  }

  if (searched && !patient) {
    return (
      <div className="UserDashboard-container">
        <div className="card empty-card">
          <h2>No Active Appointment</h2>

          <p>Please book an appointment first</p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <input
              type="text"
              placeholder="Enter Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button className="home-btn" onClick={handleSearch}>
              Search
            </button>
          </div>

          <Link to="/patientregister" className="home-btn">
            Book Appointment
          </Link>
        </div>
      </div>
    );
  }

  const urgent = patient && Number(patient.patientsAhead) < 5;

  return (
    <div className="UserDashboard-container">
      {!searched ? (
        <div className="card">
          <img src={logo} className="title" alt="logo" />

          <h2 className="titleh2">Track Appointment</h2>

          <input
            type="text"
            placeholder="Enter Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button className="home-btn" onClick={handleSearch}>
            Search Appointment
          </button>

          <Link to="/patientregister" className="home-btn">
            Book Appointment
          </Link>
        </div>
      ) : (
        patient && (
          <div className="card">
            <div className="top-row">
              <div className="left-info">
                <img src={logo} className="title" alt="logo" />

                <h2 className="name">{patient.patientName || "Patient"}</h2>
              </div>

              <div className={`queue-box small ${urgent ? "urgent-box" : ""}`}>
                <p>Your Token Number</p>

                <h3>
                  {patient.patientsAhead === 0
                    ? "You are next"
                    : patient.tokenNumber}
                </h3>
              </div>
            </div>

            <div className={`queue-box time-box ${urgent ? "urgent-box" : ""}`}>
              <p>Estimated Waiting Time</p>

              <h3>{patient.estimatedWaitMinutes} Minutes</h3>
            </div>

            <div className="info">
              <span>Doctor</span>

              <strong>{patient.doctorName}</strong>
            </div>

            <div className="info">
              <span>Specialization</span>

              <strong>{patient.specialization}</strong>
            </div>

            <div className="info">
              <span>Status</span>

              <span className="status waiting">
                {patient.patientsAhead === 0 ? "Next in queue" : patient.status}
              </span>
            </div>

            <div className="info">
              <span>Patients Ahead</span>

              <strong>{patient.patientsAhead}</strong>
            </div>

            <Link to="/" className="home-btn">
              Back to Home
            </Link>
          </div>
        )
      )}
    </div>
  );
}
