"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useUserStore } from "@/store/useUserStore";
import { hasConsoleAccess } from "@/types/permissions";

export function DevGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { consoleAccess, isDev: storeIsDev, isAdmin: storeIsAdmin } = useUserStore();
  const router = useRouter();

  const isAuthorized = hasConsoleAccess(
    {
      id: user?.id || '',
      email: user?.email,
      role: storeIsDev ? 'dev' : user?.role,
      is_admin: user?.isAdmin || storeIsAdmin,
      admin_role: user?.adminRole || user?.admin_role,
      dev_role: user?.devRole || user?.dev_role,
      console_access: (user?.console_access && user.console_access.length > 0) ? user.console_access : consoleAccess,
    },
    'dev'
  );

  useEffect(() => {
    if (!isLoading && user && !isAuthorized) {
      router.replace('/app');
    }
  }, [isLoading, user, isAuthorized, router]);

  if (isLoading || !user) return null;
  if (!isAuthorized) return null;

  return <>{children}</>;
}
