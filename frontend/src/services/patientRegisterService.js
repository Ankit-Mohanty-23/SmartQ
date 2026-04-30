import API from "./api";

export const bookAppointment = (data) => {
  return API.post("/api/appointment/book", data);
};