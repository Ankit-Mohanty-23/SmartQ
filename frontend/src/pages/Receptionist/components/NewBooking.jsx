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

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      // Doctor validation
      if (!form.doctorId) {
        alert("Please select a doctor");
        return;
      }

      // Patient name validation
      if (!form.name.trim()) {
        alert("Please enter patient name");
        return;
      }

      // Phone validation
      if (!form.phone.trim()) {
        alert("Please enter phone number");
        return;
      }

      // Age validation
      if (!form.age || Number(form.age) <= 0) {
        alert("Please enter a valid age");
        return;
      }

      // Date validation
      if (!form.appointmentDate) {
        alert("Please select appointment date");
        return;
      }

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        patientAge: Number(form.age),
        patientGender: "MALE",
        problem: form.problem,
        visitType: form.visitType,
        preferredDate: form.appointmentDate,
      };

      console.log("CREATE APPOINTMENT PAYLOAD:", payload);
      console.log("SELECTED DOCTOR ID:", form.doctorId);

      // Step 1: Create appointment
      const appointment = await createAppointment(payload);

      console.log("CREATED APPOINTMENT:", appointment);

      if (!appointment?.id) {
        throw new Error("Appointment ID not received from backend");
      }

      // Step 2: Convert appointment into queue token
      const token = await convertToToken(appointment.id, form.doctorId);

      console.log("CREATED TOKEN:", token);

      alert("Token created successfully");

      // Reset form
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
      console.error("FULL ERROR:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BACKEND RESPONSE:", err.response?.data);
      console.error("BACKEND MESSAGE:", err.response?.data?.message);

      const errorMessage =
        err.response?.data?.message || err.message || "Something went wrong";

      alert(errorMessage);
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
            type="text"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Phone number</label>

          <input
            type="tel"
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
            min="1"
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
