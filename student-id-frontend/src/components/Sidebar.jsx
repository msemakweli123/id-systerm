import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faUserGraduate,
  faSchool,
  faBookOpen,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  const menu = [
    {
      key: "/admin",
      label: "Dashboard",
      icon: faHouse,
      path: "/admin",
    },

    {
      key: "students",
      label: "Students",
      icon: faUserGraduate,
      children: [
        { key: "/admin/add-student", label: "Add Student", icon: faUserGraduate, path: "/admin/add-student" },
        { key: "/admin/view-students", label: "View Students", icon: faUserGraduate, path: "/admin/view-students" },
        { key: "/admin/approve-images", label: "Approve Images", icon: faUserGraduate, path: "/admin/approve-images" },
      ],
    },

    {
      key: "academic",
      label: "Academic Setup",
      icon: faSchool,
      children: [
        { key: "/admin/departments", label: "Departments", icon: faSchool, path: "/admin/departments" },
        { key: "/admin/programs", label: "Programs", icon: faBookOpen, path: "/admin/programs" },
        { key: "/admin/faculties", label: "Faculties", icon: faSchool, path: "/admin/faculties" },
      ],
    },

    {
      key: "idcards",
      label: "ID Cards",
      icon: faIdCard,
      children: [
        { key: "/admin/generate-id", label: "Generate ID", icon: faIdCard, path: "/admin/generate-id" },
        { key: "/admin/generated-id", label: "Generated IDs", icon: faIdCard, path: "/admin/generated-id" },
      ],
    },
  ];

  const goTo = (path) => {
    if (path) {
      navigate(path);
      setMobileOpen(false);
    }
  };

  const toggleMenu = (key) => {
    setOpenMenu(openMenu === key ? null : key);
  };

  const isActive = (path) => location.pathname === path;

  const isParentActive = (item) =>
    item.children?.some((c) => c.path === location.pathname);

  return (
    <>
      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={styles.backdrop} />
      )}

      <div
        style={{
          ...styles.sidebar,
          width: collapsed ? "80px" : "260px",
          transform:
            isMobile && !mobileOpen ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        {/* Logo */}
        <div style={styles.logo}>
          🎓 {!collapsed && <span>Admin Panel</span>}
        </div>

        {/* Toggle */}
        <button
          style={styles.toggleBtn}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>

        {/* Menu */}
        <div style={styles.menu}>
          {menu.map((item) => (
            <div key={item.key}>
              <div
                onClick={() =>
                  item.children ? toggleMenu(item.key) : goTo(item.path)
                }
                style={{
                  ...styles.item,
                  background:
                    isActive(item.path) || isParentActive(item)
                      ? "#2563eb"
                      : "transparent",
                }}
              >
                <FontAwesomeIcon icon={item.icon} />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {item.children && openMenu === item.key && !collapsed && (
                <div style={styles.subMenu}>
                  {item.children.map((sub) => (
                    <div
                      key={sub.key}
                      onClick={() => goTo(sub.path)}
                      style={{
                        ...styles.subItem,
                        background: isActive(sub.path)
                          ? "rgba(37,99,235,0.3)"
                          : "transparent",
                      }}
                    >
                      <FontAwesomeIcon icon={sub.icon} />
                      <span>{sub.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isMobile && (
        <button
          style={styles.mobileBtn}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>
      )}
    </>
  );
}

const styles = {
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    height: "100vh",
    background: "#0f172a",
    color: "white",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    transition: "0.3s",
  },

  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
  },

  logo: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },

  toggleBtn: {
    background: "#1e293b",
    border: "none",
    color: "white",
    padding: "8px",
    cursor: "pointer",
  },

  menu: { flex: 1, marginTop: "10px" },

  item: {
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  subMenu: { marginLeft: "20px" },

  subItem: {
    padding: "8px",
    cursor: "pointer",
    borderRadius: "6px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  mobileBtn: {
    position: "fixed",
    top: 10,
    left: 10,
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px",
    fontSize: "18px",
  },
};