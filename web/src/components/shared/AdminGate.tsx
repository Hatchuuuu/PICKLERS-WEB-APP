"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin' || user?.role === 'dev');

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      router.replace('/app');
    }
  }, [isLoading, user, isAdmin, router]);

  if (isLoading || !user) return null;
  if (!isAdmin) return null;

  return <>{children}</>;
}
