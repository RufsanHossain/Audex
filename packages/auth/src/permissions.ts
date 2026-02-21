import { Permission, UserRole } from "@audex/types";

const FREE_PERMISSIONS: Permission[] = [
  Permission.AuditCreate,
  Permission.AuditRead,
  Permission.ReportRead,
  Permission.ProjectCreate,
  Permission.ProjectRead,
  Permission.ProjectUpdate,
  Permission.ProjectDelete,
];

const PRO_PERMISSIONS: Permission[] = [
  ...FREE_PERMISSIONS,
  Permission.ReportExportPdf,
  Permission.ReportExportJson,
  Permission.ReportExportCsv,
  Permission.ReportShare,
  Permission.AuditCancel,
];

const TEAM_PERMISSIONS: Permission[] = [
  ...PRO_PERMISSIONS,
  Permission.ApiAccess,
  Permission.WebhookCreate,
  Permission.WebhookRead,
  Permission.WebhookDelete,
  Permission.TeamManage,
  Permission.TeamInvite,
  Permission.ScheduledAuditCreate,
  Permission.ScheduledAuditRead,
];

const ENTERPRISE_PERMISSIONS: Permission[] = [...TEAM_PERMISSIONS];

const ADMIN_PERMISSIONS: Permission[] = [
  ...ENTERPRISE_PERMISSIONS,
  Permission.AdminPanel,
  Permission.AdminUserManage,
  Permission.AdminSystemHealth,
];

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  [UserRole.Free]: new Set(FREE_PERMISSIONS),
  [UserRole.Pro]: new Set(PRO_PERMISSIONS),
  [UserRole.Team]: new Set(TEAM_PERMISSIONS),
  [UserRole.Enterprise]: new Set(ENTERPRISE_PERMISSIONS),
  [UserRole.Admin]: new Set(ADMIN_PERMISSIONS),
};

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.Free]: 0,
  [UserRole.Pro]: 1,
  [UserRole.Team]: 2,
  [UserRole.Enterprise]: 3,
  [UserRole.Admin]: 4,
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return permissions.every((p) => rolePerms.has(p));
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  return permissions.some((p) => rolePerms.has(p));
}

export function isMinRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

export function getPermissions(role: UserRole): ReadonlySet<Permission> {
  return ROLE_PERMISSIONS[role];
}
