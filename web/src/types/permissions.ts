export type ConsoleType = 'player' | 'admin' | 'dev';

export type AdminPermissionScope =
  | 'applications.view'
  | 'applications.approve'
  | 'applications.reject'
  | 'users.view'
  | 'users.suspend'
  | 'users.promote'
  | 'promotions.view'
  | 'promotions.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'analytics.view'
  | 'audit.view'
  | 'settings.manage';

export type DevPermissionScope =
  | 'health.view'
  | 'logs.view'
  | 'errors.view'
  | 'api_explorer.execute'
  | 'webhooks.view'
  | 'webhooks.retry'
  | 'feature_flags.view'
  | 'feature_flags.manage'
  | 'entity_inspector.view'
  | 'diagnostics.execute'
  | 'dev_audit.view'
  | 'accounts.manage'
  | 'threats.view'
  | 'threats.mitigate';

export type PermissionScope = AdminPermissionScope | DevPermissionScope;

export interface UserRBACProfile {
  id?: string;
  email?: string;
  role?: string;
  is_admin?: boolean;
  admin_role?: string;
  dev_role?: string;
  account_status?: 'active' | 'suspended' | 'deactivated';
  console_access?: string[];
  permissions?: string[];
}

export const ADMIN_ROLE_PERMISSIONS: Record<string, AdminPermissionScope[]> = {
  super_admin: [
    'applications.view', 'applications.approve', 'applications.reject',
    'users.view', 'users.suspend', 'users.promote',
    'promotions.view', 'promotions.manage',
    'finance.view', 'finance.manage',
    'analytics.view', 'audit.view', 'settings.manage'
  ],
  platform_admin: [
    'applications.view', 'applications.approve', 'applications.reject',
    'users.view', 'users.suspend',
    'promotions.view', 'promotions.manage',
    'finance.view', 'finance.manage',
    'analytics.view', 'audit.view', 'settings.manage'
  ],
  operations_admin: [
    'applications.view', 'users.view',
    'promotions.view', 'finance.view', 'analytics.view', 'audit.view'
  ],
  moderator: [
    'users.view', 'users.suspend', 'audit.view'
  ],
  finance_admin: [
    'finance.view', 'finance.manage', 'promotions.view', 'promotions.manage', 'analytics.view', 'audit.view'
  ]
};

export const DEV_ROLE_PERMISSIONS: Record<string, DevPermissionScope[]> = {
  super_developer: [
    'health.view', 'logs.view', 'errors.view', 'api_explorer.execute',
    'webhooks.view', 'webhooks.retry', 'feature_flags.view', 'feature_flags.manage',
    'entity_inspector.view', 'diagnostics.execute', 'dev_audit.view', 'accounts.manage',
    'threats.view', 'threats.mitigate'
  ],
  platform_engineer: [
    'health.view', 'logs.view', 'errors.view', 'api_explorer.execute',
    'webhooks.view', 'webhooks.retry', 'feature_flags.view', 'feature_flags.manage',
    'entity_inspector.view', 'diagnostics.execute', 'dev_audit.view',
    'threats.view', 'threats.mitigate'
  ],
  sre_devops: [
    'health.view', 'logs.view', 'errors.view', 'webhooks.view', 'webhooks.retry',
    'feature_flags.view', 'entity_inspector.view', 'dev_audit.view',
    'threats.view', 'threats.mitigate'
  ],
  backend_engineer: [
    'health.view', 'logs.view', 'errors.view', 'api_explorer.execute',
    'webhooks.view', 'feature_flags.view', 'entity_inspector.view', 'diagnostics.execute',
    'threats.view'
  ],
  frontend_engineer: [
    'health.view', 'logs.view', 'errors.view', 'feature_flags.view', 'diagnostics.execute',
    'threats.view'
  ],
  security_engineer: [
    'health.view', 'logs.view', 'errors.view', 'dev_audit.view', 'accounts.manage',
    'entity_inspector.view', 'diagnostics.execute', 'threats.view', 'threats.mitigate'
  ],
  developer_viewer: [
    'health.view', 'logs.view', 'errors.view', 'webhooks.view', 'feature_flags.view', 'dev_audit.view',
    'threats.view'
  ]
};

const PRIVILEGED_EMAILS = new Set([
  'dev@picklers.com',
  'admin@picklers.com',
  'picklersdev@gmail.com',
  'ricdarrylzernacielo@gmail.com',
]);

export function checkIsPrivilegedEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return PRIVILEGED_EMAILS.has(lower) || lower.endsWith('@picklers.com');
}

export function hasConsoleAccess(profile: UserRBACProfile | null | undefined, consoleType: ConsoleType): boolean {
  if (!profile) return false;

  // Account status check
  if (profile.account_status === 'suspended' || profile.account_status === 'deactivated') {
    return false;
  }

  if (checkIsPrivilegedEmail(profile.email)) {
    return true;
  }

  // Check explicit console_access array
  if (Array.isArray(profile.console_access) && profile.console_access.includes(consoleType)) {
    return true;
  }

  // Fallback compatibility checks
  if (consoleType === 'admin') {
    // F-558-fix: an admin must NOT be granted access to the dev console via
    // this path. Only an explicit dev_role (or an email on the privileged
    // allowlist above) qualifies for dev access. The cross-grant was a
    // security hole: any promoted admin could access the developer console.
    return Boolean(profile.is_admin)
      || profile.role === 'admin'
      || Boolean(profile.admin_role);
  }

  if (consoleType === 'dev') {
    return profile.role === 'dev' || Boolean(profile.dev_role);
  }

  return consoleType === 'player';
}

export function hasPermission(profile: UserRBACProfile | null | undefined, permission: PermissionScope): boolean {
  if (!profile) return false;

  // Account status check
  if (profile.account_status === 'suspended' || profile.account_status === 'deactivated') {
    return false;
  }

  if (checkIsPrivilegedEmail(profile.email)) {
    return true;
  }

  // Super admins and super developers have implicit full permissions
  if (profile.admin_role === 'super_admin' || profile.dev_role === 'super_developer') {
    return true;
  }

  // Check explicit permissions array
  if (Array.isArray(profile.permissions) && profile.permissions.includes(permission)) {
    return true;
  }

  // Check admin role permissions
  if (profile.admin_role && isAdminScope(permission) && ADMIN_ROLE_PERMISSIONS[profile.admin_role]?.includes(permission)) {
    return true;
  }

  // Check dev role permissions
  if (profile.dev_role && isDevScope(permission) && DEV_ROLE_PERMISSIONS[profile.dev_role]?.includes(permission)) {
    return true;
  }

  // Default fallback for legacy role='admin' / is_admin (defaulting to standard platform_admin permissions without promotion rights)
  // SECURITY: only treat the permission as admin-scoped if it is actually an
  // AdminPermissionScope. The previous version cast any PermissionScope to
  // AdminPermissionScope, which let an admin pass the type system when
  // checking a dev permission (e.g. 'feature_flags.manage') and then
  // match against platform_admin's list — granting dev powers to admins.
  if (Boolean(profile.is_admin) || profile.role === 'admin') {
    if (!isAdminScope(permission)) return false;
    return ADMIN_ROLE_PERMISSIONS.platform_admin.includes(permission);
  }

  // Default fallback for legacy role='dev' (defaulting to platform_engineer permissions)
  if (profile.role === 'dev') {
    if (!isDevScope(permission)) return false;
    return DEV_ROLE_PERMISSIONS.platform_engineer.includes(permission);
  }

  return false;
}

/**
 * Type guards — narrow a `PermissionScope` union to its concrete side.
 * Used in `hasPermission` so an admin cannot satisfy a dev permission and
 * vice versa via unchecked `as` casts.
 */
export function isAdminScope(permission: PermissionScope): permission is AdminPermissionScope {
  return (ADMIN_PERMISSION_VALUES as readonly string[]).includes(permission);
}

export function isDevScope(permission: PermissionScope): permission is DevPermissionScope {
  return (DEV_PERMISSION_VALUES as readonly string[]).includes(permission);
}

const ADMIN_PERMISSION_VALUES: readonly AdminPermissionScope[] = [
  'applications.view', 'applications.approve', 'applications.reject',
  'users.view', 'users.suspend', 'users.promote',
  'promotions.view', 'promotions.manage',
  'finance.view', 'finance.manage',
  'analytics.view', 'audit.view', 'settings.manage',
] as const;

const DEV_PERMISSION_VALUES: readonly DevPermissionScope[] = [
  'health.view', 'logs.view', 'errors.view', 'api_explorer.execute',
  'webhooks.view', 'webhooks.retry', 'feature_flags.view', 'feature_flags.manage',
  'entity_inspector.view', 'diagnostics.execute', 'dev_audit.view', 'accounts.manage',
  'threats.view', 'threats.mitigate',
] as const;
