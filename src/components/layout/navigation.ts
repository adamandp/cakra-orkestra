import {
  ChartBarIcon,
  CircleHelpIcon,
  FileTextIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListIcon,
  UsersIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/interface/auth.interface";

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const allRoles: Role[] = ["ADMIN", "MEMBER"];
const adminOnly: Role[] = ["ADMIN"];

export const navigation: NavigationGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "My Focus", url: "/my-focus", icon: LayoutDashboardIcon, roles: allRoles },
      { title: "PM & Team Pulse", url: "/team-pulse", icon: UsersIcon, roles: adminOnly },
      { title: "Projects", url: "/projects", icon: FolderIcon, roles: allRoles },
      { title: "Manage Tasks", url: "/tasks", icon: ListIcon, roles: allRoles },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Changelog", url: "/changelogs", icon: FileTextIcon, roles: allRoles },
      { title: "Scores", url: "/scores", icon: ChartBarIcon, roles: allRoles },
    ],
  },
  {
    label: "Administration",
    items: [{ title: "User Management", url: "/users", icon: UsersRoundIcon, roles: adminOnly }],
  },
  {
    label: "Resources",
    items: [
      { title: "Guideline & Flow", url: "/guidelines", icon: CircleHelpIcon, roles: allRoles },
    ],
  },
];

export function isNavigationActive(pathname: string, url: string): boolean {
  return pathname === url || pathname.startsWith(url + "/");
}

export function getNavigationForRole(role: Role): NavigationGroup[] {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

export function canAccessRoute(pathname: string, role: Role): boolean {
  const item = navigation
    .flatMap((group) => group.items)
    .filter((item) => isNavigationActive(pathname, item.url))
    .sort((a, b) => b.url.length - a.url.length)[0];
  return item?.roles.includes(role) ?? false;
}
