import {
  ChartBarIcon,
  CalendarCheckIcon,
  BellIcon,
  StickyNoteIcon,
  ActivityIcon,
  CircleHelpIcon,
  FileTextIcon,
  FolderIcon,
  LayoutDashboardIcon,
  HistoryIcon,
  ClipboardListIcon,
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
      { title: "Task History", url: "/task-history", icon: HistoryIcon, roles: allRoles },
      { title: "Task Management", url: "/team-pulse", icon: ClipboardListIcon, roles: adminOnly },
      { title: "Projects Management", url: "/projects", icon: FolderIcon, roles: adminOnly },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Changelog", url: "/changelogs", icon: FileTextIcon, roles: allRoles },
      { title: "Scores", url: "/scores", icon: ChartBarIcon, roles: adminOnly },
    ],
  },
  {
    label: "Administration",
    items: [{ title: "User Management", url: "/users", icon: UsersRoundIcon, roles: adminOnly }],
  },
  {
    label: "Activity",
    items: [
      { title: "Notifications", url: "/notifications", icon: BellIcon, roles: allRoles },
      { title: "Attendance", url: "/attendance", icon: CalendarCheckIcon, roles: allRoles },
      { title: "Team Wall", url: "/team-wall", icon: StickyNoteIcon, roles: allRoles },
      { title: "Activity Log", url: "/activity-logs", icon: ActivityIcon, roles: allRoles },
    ],
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
  if (isNavigationActive(pathname, "/tasks")) return allRoles.includes(role);
  const item = navigation
    .flatMap((group) => group.items)
    .filter((item) => isNavigationActive(pathname, item.url))
    .sort((a, b) => b.url.length - a.url.length)[0];
  return item?.roles.includes(role) ?? false;
}
