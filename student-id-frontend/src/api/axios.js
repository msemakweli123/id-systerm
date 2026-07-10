import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// ================= REQUEST INTERCEPTOR =================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log("=================================");
    console.log("REQUEST URL:", config.url);
    console.log("TOKEN:", token);

    if (
      token &&
      token !== "undefined" &&
      token !== "null" &&
      token.trim() !== ""
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    console.log("HEADERS:", config.headers);
    console.log("=================================");

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
api.interceptors.response.use(
  (response) => {
    console.log("SUCCESS URL:", response.config.url);
    console.log("STATUS:", response.status);
    return response;
  },
  (error) => {
    console.log("=================================");
    console.log("FAILED URL:", error.config?.url);
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);
    console.log("=================================");

    // TEMPORARILY DISABLE AUTO LOGOUT
    /*
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    */

    if (error.message === "Network Error") {
      console.error(
        "Laravel backend is not running. Start with: php artisan serve"
      );
    }

    return Promise.reject(error);
  }
);

export default api;