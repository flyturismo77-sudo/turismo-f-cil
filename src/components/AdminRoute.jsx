import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";

/**
 * Wraps a page component and redirects non-admin users to the Dashboard.
 * Usage: <AdminRoute><SomePage /></AdminRoute>
 */
export default function AdminRoute({ children }) {
  const { isAdmin, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return null;

  if (!isAdmin) {
    return <Navigate to={createPageUrl("Dashboard")} replace />;
  }

  return children;
}
