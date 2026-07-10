import { Link, useLocation } from "react-router-dom";

export default function StuSidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menu = [
    {
      path: "/student",
      label: "Dashboard",
      icon: "fas fa-home",
    },
    {
      path: "/student/upload-image",  // ✅ Changed to match route
      label: "Upload Image",
      icon: "fas fa-upload",
    },
    {
      path: "/student/id",
      label: "ID Card",
      icon: "fas fa-id-card",
    },
    {
      path: "/student/profile",
      label: "Profile",
      icon: "fas fa-user",
    },
  ];

  const handleNavigation = (path) => {
    console.log("=== Sidebar Navigation ===");
    console.log("Navigating to:", path);
    console.log("Token:", localStorage.getItem("token") ? "✅ Present" : "❌ Missing");
    console.log("Role:", localStorage.getItem("role") || "❌ Missing");
    console.log("===========================");
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <i className="fas fa-user-graduate"></i>
        <span>Student Panel</span>
      </div>

      <div style={styles.menu}>
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => handleNavigation(item.path)}
            style={{
              ...styles.link,
              ...(isActive(item.path) ? styles.active : {}),
            }}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    height: "100vh",
    background: "#0f172a",
    position: "fixed",
    left: 0,
    top: 0,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 10px rgba(0,0,0,0.3)",
  },
  header: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "25px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingBottom: "15px",
    borderBottom: "1px solid #1f2937",
  },
  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  link: {
    textDecoration: "none",
    color: "#cbd5e1",
    padding: "12px 14px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "15px",
    transition: "all 0.25s ease",
  },
  active: {
    background: "#2563eb",
    color: "#fff",
    fontWeight: "600",
    transform: "translateX(4px)",
    boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
  },
};