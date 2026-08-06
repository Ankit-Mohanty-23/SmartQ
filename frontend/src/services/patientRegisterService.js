import API from "./api";

export const bookAppointment = (data) => {
  return API.post("/appointments", data);
};