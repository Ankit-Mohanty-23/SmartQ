import API from "./api";

// Queue screen (doctor-wise)
export const getAppointmentsByDoctor = async (doctorId) => {
  const res = await API.get("/api/v1/appointments", {
    params: { assignedDoctorId: doctorId },
  });

  return res.data.data;
};

// Appointment Requests (ALL + optional filter)
export const getAppointments = async (status) => {
  const res = await API.get("/api/v1/appointments", {
    params: status && status !== "ALL" ? { status } : {},
  });

  return res.data.data;
};

// Create appointment 
export const createAppointment = async (data) => {
  const res = await API.post("/api/v1/appointments", data);
  return res.data.data;
};

export const convertToToken = async (appointmentId, doctorProfileId) => {
  const res = await API.post("/api/v1/appointments/convert", {
    appointmentId,
    doctorProfileId,
  });
  return res.data.data;
};

export const rejectAppointment = async (appointmentId) => {
  const res = await API.get(
    `/api/v1/appointments/${appointmentId}/reject`
  );
  return res.data.data;
};