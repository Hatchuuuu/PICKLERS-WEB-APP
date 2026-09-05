"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import { hasConsoleAccess, type UserRBACProfile } from "@/types/permissions";

/**
 * RoleGate — gates a tree by UserRole.
 *
 * SECURITY: prior versions matched `user.email.includes('dev')` /
 * `user.email.includes('admin')` (F-558). That granted admin/dev access to
 * anyone with "devops@external.com" or "administrator@gmail.com" in their
 * address. We now route through `hasConsoleAccess` which uses the centralized
 * allowlist (`checkIsPrivilegedEmail`) plus the database `console_access`
 * array. The allowlist is the single source of truth.
 */
export function RoleGate({ role, children }: { role: UserRole, children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // For owner-style gates, admin/dev are also allowed.
      const ownerGate = role === 'owner';
      const allowedForOwner = ['owner', 'demo', 'admin', 'dev'];
      const profile: UserRBACProfile = {
        id: user.id,
        email: user.email,
        role: user.role,
        is_admin: user.isAdmin,
        // console_access comes from AuthContext; if missing we fall through
        // to the role+is_admin checks. This is fail-safe, not fail-open.
        console_access: user.console_access,
      };

      const isAdmin = hasConsoleAccess(profile, 'admin');
      const isDev = hasConsoleAccess(profile, 'dev');

      const allowed = ownerGate
        ? allowedForOwner.includes(user.role) || isAdmin || isDev
        : user.role === role || isAdmin || isDev;

      if (!allowed) {
        router.replace('/app');
      }
    }
  }, [isLoading, user, role, router]);

  if (isLoading || !user) return null;

  const profile: UserRBACProfile = {
    id: user.id,
    email: user.email,
    role: user.role,
    is_admin: user.isAdmin,
    console_access: user.console_access,
  };
  const isAdmin = hasConsoleAccess(profile, 'admin');
  const isDev = hasConsoleAccess(profile, 'dev');

  const ownerGate = role === 'owner';
  const allowedForOwner = ['owner', 'demo', 'admin', 'dev'];
  const allowed = ownerGate
    ? allowedForOwner.includes(user.role) || isAdmin || isDev
    : user.role === role || isAdmin || isDev;

  if (!allowed) return null;

  return <>{children}</>;
}
