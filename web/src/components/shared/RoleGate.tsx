"use client";


import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";

export function RoleGate({ role, children }: { role: UserRole, children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.role !== role) {
      router.replace('/app');
    }
  }, [isLoading, user, role, router]);

  if (isLoading || user?.role !== role) return null;

  return <>{children}</>;
}
