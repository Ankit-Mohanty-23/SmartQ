import { useState, useEffect } from "react";
import "./PatientRegister.css";
import logo from "../../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { bookAppointment } from "../../services/patientRegisterService";
import { getAllDoctors } from "../../services/doctorService";

export default function PatientRegister() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    doctor: "",
    checkupType: "",
    preferredDate: "",
    preferredTime: "",
    problem: "",
    customProblem: "",
  });

  const [msg, setMsg] = useState("");

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

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await getAllDoctors();

        console.log("DOCTORS:", data);

        setDoctors(data || []);
      } catch (err) {
        console.error("DOCTOR LOAD ERROR:", err);
        console.error("BACKEND RESPONSE:", err.response?.data);
      }
    };

    loadDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMsg("");

    // Only original required fields
    if (
      !form.name.trim() ||
      !form.age ||
      !form.gender ||
      !form.phone.trim() ||
      !problemSearch.trim()
    ) {
      setMsg("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const problemDetails = form.customProblem.trim()
        ? `${problemSearch.trim()} - ${form.customProblem.trim()}`
        : problemSearch.trim();

      const dataToSend = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        patientAge: Number(form.age),
        patientGender: form.gender.toUpperCase(),
        problem: problemDetails,
        visitType: "NEW",
        preferredDate:
          form.preferredDate || new Date().toISOString().split("T")[0],
        requestedDoctorId: form.doctor || null,
      };
      
      console.log("APPOINTMENT PAYLOAD:", dataToSend);

      const appointment = await bookAppointment(dataToSend);

      console.log("CREATED APPOINTMENT:", appointment);

      navigate("/BookingSuccess", {
        state: {
          bookingId: appointment.id,
        },
      });
    } catch (err) {
      console.error("FULL ERROR:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BACKEND RESPONSE:", err.response?.data);
      console.error("VALIDATION ERRORS:", err.response?.data?.errors);

      const errors = err.response?.data?.errors;

      if (errors && errors.length > 0) {
        const firstError = errors[0];

        setMsg(
          firstError?.message || firstError?.msg || JSON.stringify(firstError),
        );

        return;
      }

      setMsg(
        err.response?.data?.message ||
          "Unable to book appointment. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="header">
        <Link to="/">
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
              type="text"
              name="name"
              placeholder="Full Name *"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="age"
              type="number"
              min="1"
              placeholder="Age *"
              value={form.age}
              onChange={handleChange}
            />

            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Gender *</option>

              <option value="Male">Male</option>

              <option value="Female">Female</option>
            </select>

            <input
              type="tel"
              name="phone"
              placeholder="Phone *"
              value={form.phone}
              onChange={handleChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />

            <input
              type="text"
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
              <option value="">Select Doctor</option>

              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.user?.name} ({doc.specialization})
                </option>
              ))}
            </select>

            <input
              type="date"
              name="preferredDate"
              value={form.preferredDate}
              onChange={handleChange}
            />

            <input
              type="time"
              name="preferredTime"
              value={form.preferredTime}
              onChange={handleChange}
            />

            <select
              name="checkupType"
              value={form.checkupType}
              onChange={handleChange}
            >
              <option value="">Checkup Type</option>

              <option value="Regular">Regular</option>

              <option value="Specific">Specific</option>
            </select>
          </div>
        </div>

        {/* Problem */}

        <div className="section">
          <h3>Problem *</h3>

          <div className="searchDropdown">
            <input
              type="text"
              placeholder="Search or type problem..."
              value={problemSearch}
              onChange={(e) => {
                const value = e.target.value;

                setProblemSearch(value);

                setShowDropdown(true);

                setForm((prev) => ({
                  ...prev,
                  problem: value,
                }));
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
                      onMouseDown={() => {
                        setProblemSearch(p);

                        setForm((prev) => ({
                          ...prev,
                          problem: p,
                        }));

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

        <button type="submit" className="submitBtn" disabled={loading}>
          {loading ? "Booking Appointment..." : "Book Appointment"}
        </button>

        {msg && <p className="msg">{msg}</p>}
      </form>
    </div>
  );
}
