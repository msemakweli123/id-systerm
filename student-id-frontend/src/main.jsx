import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ================= AUTH ================= */
import Login from "./pages/login";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

/* ================= ADMIN PAGES ================= */
import Admin from "./pages/Admin";
import AddStudent from "./pages/AddStudent";
import ViewStudents from "./pages/ViewStudents";
import AmnViewId from "./pages/AmnViewId";
import AddDepartment from "./pages/AddDepartment";
import AddProgram from "./pages/AddProgram";
import AddFaculty from "./pages/AddFaculty";
import ApproveImages from "./pages/ApproveImages";
import IDGenerate from "./pages/IDgenerate";
import AdminProfile from "./pages/AdminProfile";
import AdminSettings from "./pages/AdminSettings";

/* ================= SUPER ADMIN PAGES ================= */
import SuperAdminLayout from "./components/SuperAdminLayout";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminAdmins from "./pages/SuperAdminAdmins";
import SuperAdminUsers from "./pages/SuperAdminUsers";
import SuperAdminReports from "./pages/SuperAdminReports";
import SuperAdminSettings from "./pages/SuperAdminSettings";
import SuperAdminLogs from "./pages/SuperAdminLogs";
import SuperAdminIdCards from "./pages/SuperAdminIdCards"; // ✅ ADDED

/* ================= STUDENT PAGES ================= */
import Student from "./pages/Student";
import StudentID from "./pages/StudentID";
import StudentProfile from "./pages/StudentProfile";
import ImageUp from "./pages/ImageUp";

import "@fortawesome/fontawesome-free/css/all.min.css";

console.log("🔍 App is mounting...");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* ================= ROOT ================= */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ================= LOGIN ================= */}
        <Route path="/login" element={<Login />} />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/add-student"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AddStudent />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/view-students"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <ViewStudents />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/generate-id"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <IDGenerate />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/generated-id"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AmnViewId />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/departments"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AddDepartment />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/faculties"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AddFaculty />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/programs"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AddProgram />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/approve-images"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <ApproveImages />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminProfile />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminSettings />
            </RoleProtectedRoute>
          }
        />

        {/* ================= SUPER ADMIN (MASTER LAYOUT) ================= */}
        <Route
          path="/super-admin/*"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <SuperAdminLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="admins" element={<SuperAdminAdmins />} />
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="id-cards" element={<SuperAdminIdCards />} /> {/* ✅ ADDED */}
          <Route path="reports" element={<SuperAdminReports />} />
          <Route path="settings" element={<SuperAdminSettings />} />
          <Route path="logs" element={<SuperAdminLogs />} />
        </Route>

        {/* ================= STUDENT ================= */}
        <Route
          path="/student"
          element={
            <RoleProtectedRoute allowedRoles={["student"]}>
              <Student />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/student/id"
          element={
            <RoleProtectedRoute allowedRoles={["student"]}>
              <StudentID />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <RoleProtectedRoute allowedRoles={["student"]}>
              <StudentProfile />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/student/upload-image"
          element={
            <RoleProtectedRoute allowedRoles={["student"]}>
              <ImageUp />
            </RoleProtectedRoute>
          }
        />

        {/* ================= FALLBACK - MUST BE LAST ================= */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);