import { Navigate, useLocation } from "react-router-dom";

export default function RoleProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const location = useLocation();

  // Get from multiple possible keys
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || localStorage.getItem("userRole");
  
  console.log("=== RoleProtectedRoute Debug ===");
  console.log("Path:", location.pathname);
  console.log("Token:", token ? `✅ ${token.substring(0, 20)}...` : "❌ Missing");
  console.log("Role:", role || "❌ Missing");
  console.log("Allowed Roles:", allowedRoles);
  console.log("Is role allowed?", allowedRoles.includes(role));
  console.log("================================");

  // Check if token exists and is valid
  if (!token || token === "null" || token === "undefined" || token === "") {
    console.log("❌ Redirecting to login: Invalid token");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if role exists
  if (!role || role === "null" || role === "undefined" || role === "") {
    console.log("❌ Redirecting to login: No role");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if role is allowed
  if (!allowedRoles.includes(role)) {
    console.log(`❌ Role "${role}" not allowed. Redirecting...`);
    
    // Redirect to appropriate dashboard based on role
    if (role === "super_admin") {
      return <Navigate to="/super-admin" replace />;
    }
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (role === "student") {
      return <Navigate to="/student" replace />;
    }
    
    return <Navigate to="/login" replace />;
  }

  console.log("✅ Access granted!");
  return children;
}