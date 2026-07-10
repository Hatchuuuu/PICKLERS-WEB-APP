import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "motion/react";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          className="w-10 h-10 border-4 border-accent-primary/20 border-t-accent-primary rounded-full" 
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the intent if they tried to access a specific route
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <Outlet />;
}
