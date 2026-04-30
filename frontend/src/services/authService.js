import API from "./api";

// LOGIN
export const loginUser = async (data) => {
  const res = await API.post("/users/login", data);
  return res.data.data;
};

// REGISTER
export const registerUser = async (data) => {
  const res = await API.post("/users/register", data);
  return res.data.data;
};

// GET CURRENT USER
export const getCurrentUser = async () => {
  const res = await API.get("/users/me");
  return res.data.data;
};

// LOGOUT
export const logoutUser = async () => {
  const res = await API.post("/users/logout");
  return res.data;
};