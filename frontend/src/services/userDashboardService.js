import API from "./api";

export const getPatient = async (phone) => {
  const res = await API.get(`/queue/${phone}/patient`);
  return res.data.data;
};