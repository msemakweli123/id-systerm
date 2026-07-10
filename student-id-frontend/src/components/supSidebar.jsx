// supSidebar.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function supSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const [open, setOpen] = useState(false);

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const getDashboardPath = () => {
    const roleLower = role?.toLowerCase();
    if (roleLower === "super_admin") return "/super-admin";
    if (roleLower === "admin") return "/admin";
    return "/login";
  };

  const isDashboardActive = () => {
    const path = location.pathname;
    const roleLower = role?.toLowerCase();
    if (roleLower === "super_admin") return path === "/super-admin" || path.startsWith("/super-admin/");
    if (roleLower === "admin") return path === "/admin" || path.startsWith("/admin/");
    return false;
  };

  return (
    <>
      <button className="hamburger" onClick={() => setOpen(true)}>
        <i className="fa fa-bars"></i>
      </button>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "show" : ""}`}>
        <button className="closeBtn" onClick={() => setOpen(false)}>
          <i className="fa fa-times"></i>
        </button>

        <div className="logo">
          <h2>🎓 ID System</h2>
          <p>Super Admin Panel</p>
        </div>

        <button 
          className={`item ${isDashboardActive() ? "active" : ""}`} 
          onClick={() => go(getDashboardPath())}
        >
          <i className="fa fa-home"></i> Dashboard
        </button>

        <div className="section">
          <p className="sectionTitle">Management</p>

          <button 
            className={`item ${isActive("/super-admin/admins") ? "active" : ""}`} 
            onClick={() => go("/super-admin/admins")}
          >
            <i className="fa fa-user-shield"></i> Manage Admins
          </button>

          <button 
            className={`item ${isActive("/super-admin/users") ? "active" : ""}`} 
            onClick={() => go("/super-admin/users")}
          >
            <i className="fa fa-users"></i> All Users
          </button>
        </div>

        <div className="section">
          <p className="sectionTitle">System</p>

          <button 
            className={`item ${isActive("/super-admin/id-cards") ? "active" : ""}`} 
            onClick={() => go("/super-admin/id-cards")}
          >
            <i className="fa fa-id-card"></i> ID Cards
          </button>

          <button 
            className={`item ${isActive("/super-admin/reports") ? "active" : ""}`} 
            onClick={() => go("/super-admin/reports")}
          >
            <i className="fa fa-chart-line"></i> Reports
          </button>

          <button 
            className={`item ${isActive("/super-admin/logs") ? "active" : ""}`} 
            onClick={() => go("/super-admin/logs")}
          >
            <i className="fa fa-list"></i> Activity Logs
          </button>
        </div>

        <div className="section" style={{ marginTop: "auto", paddingTop: "15px", borderTop: "1px solid #334155" }}>
          
        </div>
      </aside>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
        }

        .hamburger {
          display: none;
          position: fixed;
          top: 15px;
          left: 15px;
          z-index: 1100;
          background: #0f172a;
          color: white;
          border: none;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 998;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 290px;
          height: 100vh;
          background: linear-gradient(to bottom, #020617, #0f172a);
          color: white;
          padding: 8px;
          overflow-y: auto;
          z-index: 999;
          transition: 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .sidebar::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }

        .sidebar.show {
          left: 0;
        }

        .closeBtn {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          margin-bottom: 10px;
          cursor: pointer;
        }

        .logo {
          padding-bottom: 15px;
          border-bottom: 1px solid #1e293b;
          margin-bottom: 15px;
        }

        .logo h2 {
          margin: 0;
          font-size: 20px;
          color: #38bdf8;
        }

        .logo p {
          margin: 3px 0 0;
          font-size: 12px;
          color: #94a3b8;
        }

        .section {
          margin-bottom: 10px;
        }

        .sectionTitle {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          padding: 8px 12px 4px;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          margin-bottom: 4px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          background: transparent;
          color: #e2e8f0;
          text-align: left;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .item:hover {
          background: rgba(56, 189, 248, 0.1);
          transform: translateX(4px);
        }

        .item.active {
          background: rgba(56, 189, 248, 0.15);
          border-left: 3px solid #38bdf8;
          color: #38bdf8;
        }

        .item i {
          width: 20px;
          text-align: center;
          font-size: 16px;
        }

        @media (max-width: 900px) {
          .hamburger {
            display: block;
          }

          .sidebar {
            left: -100%;
            width: 280px;
          }

          .sidebar.show {
            left: 0;
          }

          .closeBtn {
            display: block;
          }
        }

        @media (min-width: 901px) {
          .sidebar {
            left: 0 !important;
          }
        }
      `}</style>
    </>
  );
}