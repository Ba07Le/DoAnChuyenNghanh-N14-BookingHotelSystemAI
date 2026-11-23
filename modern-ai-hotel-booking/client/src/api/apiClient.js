import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")?.trim();
  if (token && token !== "undefined" && token !== "null") {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers.delete("Authorization");
  }
  return config;
});

export default api;
