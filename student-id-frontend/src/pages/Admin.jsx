import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./Dashboard";
import AddStudent from "./AddStudent";
import ViewStudents from "./ViewStudents";

const Placeholder = ({ title }) => <h2>{title}</h2>;

export default function Admin() {
  return (
    <div className="admin-container">
      <Sidebar />

      <div className="admin-main">
        <TopBar />

        <div className="admin-content">
          <Routes>
            <Route index element={<Dashboard />} />

            {/* STUDENTS */}
            <Route path="add-student" element={<AddStudent />} />
            <Route path="view-students" element={<ViewStudents />} />

            {/* PLACEHOLDERS */}
            <Route path="pending-students" element={<Placeholder title="Pending Students" />} />
            <Route path="upload-photo" element={<Placeholder title="Upload Photo" />} />
            <Route path="sign-id" element={<Placeholder title="Sign ID" />} />
            <Route path="generate-id" element={<Placeholder title="Generate ID" />} />
            <Route path="generated-id" element={<Placeholder title="Generated IDs" />} />
            <Route path="failed-id" element={<Placeholder title="Failed IDs" />} />
            <Route path="notifications" element={<Placeholder title="Notifications" />} />
            <Route path="logs" element={<Placeholder title="Activity Logs" />} />
          </Routes>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
/* ===== LAYOUT ===== */
.admin-container {
  display: flex;
  background: #f1f5f9;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

/* MAIN AREA */
.admin-main {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  transition: 0.3s;
}

/* CONTENT */
.admin-content {
  padding: 20px;
  background: #f8fafc;
  min-height: calc(100vh - 60px);
}

/* ===== TOP BAR ===== */
.topbar {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #e2e8f0;
}

.topbar h3 {
  margin: 0;
}

.topbar .right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* ===== SIDEBAR ===== */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 260px;
  height: 100vh;
  background: #0f172a;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

/* LOGO */
.sidebar-logo {
  font-size: 18px;
  font-weight: bold;
  padding: 15px;
  border-bottom: 1px solid #334155;
}

/* MENU */
.sidebar-menu {
  flex: 1;
  margin-top: 10px;
}

/* ITEM */
.sidebar-item {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 5px;
  transition: 0.2s;
}

.sidebar-item:hover {
  background: #1e293b;
}

.sidebar-item.active {
  background: #2563eb;
}

/* SUB MENU */
.sidebar-sub {
  margin-left: 20px;
}

.sidebar-sub-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.sidebar-sub-item:hover {
  background: rgba(37,99,235,0.3);
}

.sidebar-sub-item.active {
  background: rgba(37,99,235,0.2);
}

/* LOGOUT */
.sidebar-logout {
  padding: 12px;
  background: #ef4444;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  margin-top: 10px;
}

/* ===== MOBILE ===== */
@media (max-width: 768px) {
  .admin-main {
    margin-left: 0;
  }

  .sidebar {
    transform: translateX(-100%);
  }
}
`;