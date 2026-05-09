import axios from "axios";

const BASE_URLS = {
  local: "http://localhost:5000/api/v1",
  network: "http://10.190.37.111:5000/api/v1",
};

const API = axios.create({
  // change the BASE_URLS according to network usage
  baseURL: BASE_URLS.network,
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
