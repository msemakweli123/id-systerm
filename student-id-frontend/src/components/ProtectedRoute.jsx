import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  
  const isValidToken = token && token !== "null" && token !== "undefined";

  if (!isValidToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}