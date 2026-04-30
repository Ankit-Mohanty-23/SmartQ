import API from "./api";
export const getBookingStatus = (id) => {
  return API.get(`/api/status?id=${id}`);
};