import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function AdminRoute({ children, roles }) {
  const { admin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent" /></div>;
  if (!admin) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(admin.role)) return <Navigate to="/admin" replace />;
  return children;
}
