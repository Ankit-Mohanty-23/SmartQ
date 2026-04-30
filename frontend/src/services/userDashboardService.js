import API from "./api";

export const getPatient = () => {
  return API.get("/api/patient");
};