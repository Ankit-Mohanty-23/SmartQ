import axios from "axios";

const BASE_URLS = {
  local: "http://localhost:5000/api/v1",
  network: "http://10.190.36.105:5000/api/v1",
};

const API = axios.create({
  // change the BASE_URLS according to network usage
  baseURL: BASE_URLS.local,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
