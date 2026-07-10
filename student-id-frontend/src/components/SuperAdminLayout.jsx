import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";
import SupSidebar from "./supSidebar";
import SupTopbar from "./TopBar";

export default function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={styles.layout}>
      <SupSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} user={user} />

      <div style={{
        ...styles.mainContent,
        marginLeft: sidebarOpen ? "260px" : "70px",
      }}>
        <SupTopbar user={user} />

        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f4f8",
  },
  mainContent: {
    flex: 1,
    transition: "margin-left 0.3s ease",
    minHeight: "100vh",
  },
  content: {
    padding: "20px",
  },
};