// Layout.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Topbar from "./TopBar";
import Sidebar from "./Sidebar";
import StuTopbar from "./StuTopbar";
import StuSidebar from "./StuSidebar";
import SupSidebar from "./supSidebar"; // Import with capital 'S' (file name stays small)
import Footer from "./Footer";

export default function Layout({ children }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = user?.role || localStorage.getItem("role") || "student";
      setUserRole(role);
    } catch (error) {
      console.error("Error parsing user:", error);
      setUserRole("student");
    } finally {
      setLoading(false);
    }
  }, []);

  const isStudentRoute = location.pathname.includes("/student");
  const isSuperAdminRoute = location.pathname.includes("/super-admin");

  const isStudent = userRole === "student" || isStudentRoute;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Student Layout
  if (isStudent) {
    return (
      <div style={styles.layoutWrapper}>
        <StuSidebar />
        <div style={styles.mainArea}>
          <StuTopbar />
          <div style={styles.contentArea}>
            {children}
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  // Super Admin Layout
  if (isSuperAdminRoute || userRole === "super_admin") {
    return (
      <div style={styles.layoutWrapper}>
        <SupSidebar /> {/* Use with capital 'S' */}
        <div style={styles.mainArea}>
          <Topbar title="Super Admin" />
          <div style={styles.contentArea}>
            {children}
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  // Admin Layout (Default)
  return (
    <div style={styles.layoutWrapper}>
      <Sidebar />
      <div style={styles.mainArea}>
        <Topbar title="Admin" />
        <div style={styles.contentArea}>
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}

const styles = {
  layoutWrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#f0f4f8",
  },

  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    marginLeft: "260px",
    minHeight: "100vh",
    width: "calc(100% - 260px)",
  },

  contentArea: {
    flex: 1,
    padding: "24px",
    marginTop: "70px",
    background: "#f8fafc",
    minHeight: "calc(100vh - 70px)",
    overflowY: "auto",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#f0f4f8",
    gap: "20px",
  },

  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #e0e0e0",
    borderTop: "5px solid #111827",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .mainArea {
        margin-left: 0 !important;
        width: 100% !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}