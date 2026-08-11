"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.isAdmin) {
      router.replace('/app');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) return null;
  if (!user.isAdmin) return null;

  return <>{children}</>;
}
