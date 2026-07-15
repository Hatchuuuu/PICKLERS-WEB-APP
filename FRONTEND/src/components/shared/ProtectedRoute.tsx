"use client";
import React from "react";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "motion/react";

function ProtectedRouteInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
      router.replace(`/auth?redirect=${encodeURIComponent(pathname + search)}`);
    }
  }, [isLoading, isAuthenticated, pathname, searchParams, router]);

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

  if (!isAuthenticated) return null;

  return <>{children}</>;
}


export function ProtectedRoute(props: { children: React.ReactNode }) {
  return <React.Suspense fallback={<div className="bg-background h-screen w-full" />}><ProtectedRouteInner {...props} /></React.Suspense>;
}