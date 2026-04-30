import { useState } from "react";
import "./PatientRegister.css";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { bookAppointment } from "../../services/patientRegisterService";

export default function PatientRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    doctor: "",
    checkupType: "",
    problem: "",
    customProblem: "",
  });

  const [msg, setMsg] = useState("");

  // 🔍 Problem search states
  const [problemSearch, setProblemSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const problemsList = [
    "Fever",
    "Cold & Cough",
    "Headache",
    "Body Pain",
    "Heart Issue",
    "Stomach Pain",
    "Skin Allergy",
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // REAL BACKEND SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.doctor) {
      setMsg("Fill required fields");
      return;
    }

    try {
      const dataToSend = {
        ...form,
        problem: problemSearch || form.problem,
      };

      const res = await bookAppointment(dataToSend);

      localStorage.setItem("patientToken", res.data.tokenNumber);

      navigate("/BookingSuccess", {
        state: {
          bookingId: res.data.bookingId,
        },
      });
    } catch (err) {
      console.log(err);
      setMsg("❌ Server error");
    }
  };

  return (
    <div className="page">
      <div className="header">
        <Link to="/">
          {" "}
          <img src={logo} className="title" alt="logo" />
        </Link>
        <p>Patient Registration & Queue</p>
      </div>

      <form className="formContainer" onSubmit={handleSubmit}>
        {/* Patient Details */}
        <div className="section">
          <h3>Patient Details</h3>

          <div className="grid">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
            />
            <input
              name="age"
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={handleChange}
            />

            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Appointment */}
        <div className="section">
          <h3>Appointment</h3>

          <div className="grid">
            <select name="doctor" value={form.doctor} onChange={handleChange}>
              <option value="">Doctor</option>
              <option>Dr. Sharma (General)</option>
              <option>Dr. Reddy (Cardio)</option>
              <option>Dr. Khan (Ortho)</option>
            </select>

            <select
              name="checkupType"
              value={form.checkupType}
              onChange={handleChange}
            >
              <option value="">Checkup Type</option>
              <option>Regular</option>
              <option>Specific</option>
            </select>
          </div>
        </div>

        {/* Problem */}
        <div className="section">
          <h3>Problem</h3>

          <div className="searchDropdown">
            <input
              type="text"
              placeholder="Search or type problem..."
              value={problemSearch}
              onChange={(e) => {
                setProblemSearch(e.target.value);
                setShowDropdown(true);
                setForm({ ...form, problem: e.target.value });
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />

            {showDropdown && (
              <div className="dropdown">
                {problemsList
                  .filter((p) =>
                    p.toLowerCase().includes(problemSearch.toLowerCase()),
                  )
                  .map((p, i) => (
                    <div
                      key={i}
                      className="dropdownItem"
                      onClick={() => {
                        setProblemSearch(p);
                        setForm({ ...form, problem: p });
                        setShowDropdown(false);
                      }}
                    >
                      {p}
                    </div>
                  ))}

                {problemsList.filter((p) =>
                  p.toLowerCase().includes(problemSearch.toLowerCase()),
                ).length === 0 && (
                  <div className="dropdownItem custom">
                    Use: "{problemSearch}"
                  </div>
                )}
              </div>
            )}
          </div>

          <textarea
            name="customProblem"
            placeholder="Additional details (optional)"
            value={form.customProblem}
            onChange={handleChange}
          />
        </div>

        <button className="submitBtn">Generate Token</button>

        {msg && <p className="msg">{msg}</p>}
      </form>
    </div>
  );
}
