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
        setDoctors(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadDoctors();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.age ||
      !form.gender ||
      !form.phone ||
      !problemSearch
    ) {
      setMsg("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 3000));

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
              name="name"
              placeholder="Full Name *"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="age"
              type="number"
              placeholder="Age *"
              value={form.age}
              onChange={handleChange}
            />

            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Gender *</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            <input
              name="phone"
              placeholder="Phone *"
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
              <option value="">Select Doctor *</option>

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

              <option>Regular</option>
              <option>Specific</option>
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
                setProblemSearch(e.target.value);
                setShowDropdown(true);
                setForm({
                  ...form,
                  problem: e.target.value,
                });
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

        <button className="submitBtn" disabled={loading}>
          {loading ? "Generating Token..." : "Generate Token"}
        </button>

        {msg && <p className="msg">{msg}</p>}
      </form>
    </div>
  );
}
