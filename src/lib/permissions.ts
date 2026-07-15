import { Role } from "@prisma/client";

const rank: Record<Role, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3
};

export function hasRoleAccess(role: Role, minimumRole: Role) {
  return rank[role] >= rank[minimumRole];
}

export function canManageContent(role: Role) {
  return hasRoleAccess(role, Role.EDITOR);
}

export function canManageApps(role: Role) {
  return hasRoleAccess(role, Role.ADMIN);
}

export function canManageUsers(role: Role) {
  return hasRoleAccess(role, Role.SUPER_ADMIN);
}

export function canManageSettings(role: Role) {
  return hasRoleAccess(role, Role.SUPER_ADMIN);
}
