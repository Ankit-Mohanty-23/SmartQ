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
    appointmentDate: new Date().toISOString().split("T")[0],
  });

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
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

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
        preferredDate: form.appointmentDate,
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
        appointmentDate: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="rq-right">
      <div className="rq-header">
        <div>
          <h2>New token</h2>
          <p className="rq-sub">Book a walk-in or pre-booked patient</p>
        </div>
      </div>

      <div className="nb-form-grid">
        <div>
          <label>Doctor</label>

          <select name="doctorId" value={form.doctorId} onChange={handleChange}>
            <option value="">Select doctor</option>

            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.user?.name} ({d.specialization})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Date</label>

          <input
            type="date"
            name="appointmentDate"
            value={form.appointmentDate}
            onChange={handleChange}
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

      <button className="nb-confirm-btn" onClick={handleSubmit}>
        Confirm booking
      </button>
    </div>
  );
}
