import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "../auth";

const normalizeRole = (user) => {
  const raw =
    user?.role ||
    user?.primaryRole ||
    user?.roles?.[0]?.name ||
    user?.roles?.[0] ||
    "";
  if (!raw) return "";
  return raw.startsWith("ROLE_") ? raw.substring(5) : raw;
};

const ProtectedRoute = ({ requiredRole, children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = getCurrentUser();
  const role = normalizeRole(user);

  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(role)) {
        return <Navigate to="/unauthorized" replace />;
      }
    } else {
      if (role !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
