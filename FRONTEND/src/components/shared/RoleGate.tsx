import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";

export function RoleGate({ role }: { role: UserRole }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // Let ProtectedRoute handle the loading spinner

  if (user?.role !== role) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
