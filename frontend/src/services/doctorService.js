import API from "./api";

export const getAllDoctors = async () => {
  const res = await API.get("/api/v1/doctors");
  return res.data.data;
};

export const getDoctorById = async (id) => {
  const res = await API.get(`/api/v1/doctors/${id}`);
  return res.data.data;
};