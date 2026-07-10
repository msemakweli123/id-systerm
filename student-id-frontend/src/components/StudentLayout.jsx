import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function StudentLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Student navigation items
  const navItems = [
    { path: "/student/dashboard", icon: "fa-home", label: "Dashboard" },
    { path: "/student/id-card", icon: "fa-id-card", label: "My ID Card" },
    { path: "/student/upload-photo", icon: "fa-camera", label: "Upload Photo" },
    { path: "/student/profile", icon: "fa-user", label: "Profile" },
    { path: "/student/notifications", icon: "fa-bell", label: "Notifications" },
  ];

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        width: sidebarOpen ? "260px" : "70px",
      }}>
        <div style={styles.sidebarHeader}>
          <h2 style={{
            ...styles.logo,
            display: sidebarOpen ? "block" : "none"
          }}>
            <i className="fas fa-id-card" style={{ color: "#ffd700" }}></i> Student
          </h2>
          <h2 style={{
            ...styles.logoSmall,
            display: sidebarOpen ? "none" : "block"
          }}>
            <i className="fas fa-id-card" style={{ color: "#ffd700" }}></i>
          </h2>
          <button onClick={toggleSidebar} style={styles.toggleBtn}>
            <i className={`fas ${sidebarOpen ? "fa-chevron-left" : "fa-chevron-right"}`}></i>
          </button>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? "#2d6a4f" : "transparent",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                padding: sidebarOpen ? "12px 20px" : "12px",
              })}
            >
              <i className={`fas ${item.icon}`} style={styles.navIcon}></i>
              <span style={{
                ...styles.navLabel,
                display: sidebarOpen ? "inline" : "none",
                marginLeft: "12px"
              }}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              <i className="fas fa-user-graduate"></i>
            </div>
            {sidebarOpen && (
              <div style={styles.userDetails}>
                <p style={styles.userName}>{user?.name || "Student"}</p>
                <p style={styles.userRole}>Student</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <i className="fas fa-sign-out-alt"></i>
            {sidebarOpen && <span style={{ marginLeft: "10px" }}>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        ...styles.mainContent,
        marginLeft: sidebarOpen ? "260px" : "70px",
      }}>
        <div style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <h3 style={styles.pageTitle}>Student Portal</h3>
          </div>
          <div style={styles.topbarRight}>
            <span style={styles.welcomeText}>
              Welcome, {user?.name || "Student"}
            </span>
          </div>
        </div>
        <div style={styles.content}>
          {children}
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
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    background: "linear-gradient(180deg, #1a472a, #2d6a4f)",
    color: "white",
    transition: "width 0.3s ease",
    overflow: "hidden",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
  },
  sidebarHeader: {
    padding: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: "20px",
    margin: 0,
    color: "white",
  },
  logoSmall: {
    fontSize: "24px",
    margin: 0,
    color: "white",
  },
  toggleBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "14px",
  },
  nav: {
    flex: 1,
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    color: "rgba(255,255,255,0.8)",
    textDecoration: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
    margin: "0 10px",
    fontSize: "14px",
  },
  navIcon: {
    fontSize: "18px",
    minWidth: "24px",
    textAlign: "center",
  },
  navLabel: {
    fontSize: "14px",
    fontWeight: "500",
  },
  sidebarFooter: {
    padding: "20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
  },
  userRole: {
    margin: 0,
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
  },
  logoutBtn: {
    width: "100%",
    padding: "10px",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mainContent: {
    flex: 1,
    transition: "margin-left 0.3s ease",
    minHeight: "100vh",
  },
  topbar: {
    background: "white",
    padding: "15px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#1a472a",
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  welcomeText: {
    fontSize: "14px",
    color: "#666",
  },
  content: {
    padding: "30px",
  },
};