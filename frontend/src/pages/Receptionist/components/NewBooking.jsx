import { useEffect, useState } from "react";
import { getAllDoctors } from "@/services/doctorService";
import {
  createAppointment,
  convertToToken,
} from "@/services/appointmentService";

export default function NewBooking() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    doctorId: "",
    name: "",
    phone: "",
    age: "",
    visitType: "NEW",
    problem: "Walk-in",
  });

  // 🔹 load doctors
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

  // 🔹 handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 MAIN LOGIC
  const handleSubmit = async () => {
    try {
      if (!form.doctorId) {
        alert("Please select a doctor");
        return;
      }

      const appointment = await createAppointment({
        name: form.name,
        phone: form.phone,
        patientAge: Number(form.age),
        patientGender: "MALE",
        problem: form.problem,
        visitType: form.visitType,
        preferredDate: new Date().toISOString(),
      });

      await convertToToken(appointment.id, form.doctorId);

      alert("Token created successfully");

      setForm({
        doctorId: "",
        name: "",
        phone: "",
        age: "",
        visitType: "NEW",
        problem: "Walk-in",
      });

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="rq-right">
      {/* Header */}
      <div className="rq-header">
        <div>
          <h2>New token</h2>
          <p className="rq-sub">
            Book a walk-in or pre-booked patient
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="nb-form-grid">

        <div>
          <label>Doctor</label>
          <select
            name="doctorId"
            value={form.doctorId}
            onChange={handleChange}
          >
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Date</label>
          <input
            type="date"
            disabled
            value={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label>Patient name</label>
          <input
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Phone number</label>
          <input
            name="phone"
            placeholder="+91..."
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Age</label>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Visit type</label>
          <select
            name="visitType"
            value={form.visitType}
            onChange={handleChange}
          >
            <option value="NEW">New</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>
      </div>

      {/* ✅ FIXED BUTTON CLASS */}
      <button className="nb-confirm-btn" onClick={handleSubmit}>
        Confirm booking
      </button>
    </div>
  );
}