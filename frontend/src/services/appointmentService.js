import API from "./api";

// Queue screen (doctor-wise)
export const getAppointmentsByDoctor = async (doctorId) => {
  const res = await API.get("/appointments", {
    params: { assignedDoctorId: doctorId },
  });

  return res.data.data;
};

// Appointment Requests (ALL + optional filter)
export const getAppointments = async (status) => {
  const res = await API.get("/appointments", {
    params: status && status !== "ALL" ? { status } : {},
  });

  return res.data.data;
};

// Create appointment 
export const createAppointment = async (data) => {
  const res = await API.post("/appointments", data);
  return res.data.data;
};

export const convertToToken = async (appointmentId, doctorProfileId) => {
  const res = await API.post("/appointments/convert", {
    appointmentId,
    doctorProfileId,
  });
  return res.data.data;
};

export const rejectAppointment = async (appointmentId) => {
  const res = await API.get(
    `/appointments/${appointmentId}/reject`
  );
  return res.data.data;
};