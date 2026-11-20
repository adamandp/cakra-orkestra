export const absenceStatuses = ["ABSENT", "SICK", "LEAVE", "PERMISSION", "WFH"] as const;
export type AbsenceStatus = (typeof absenceStatuses)[number];
export type AttendanceStatus = "PRESENT" | AbsenceStatus;
export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  status: AbsenceStatus;
  reason: string | null;
}
export interface AttendanceMember {
  id: string;
  name: string;
  username: string;
  birthday_days: number | null;
  avatar_url: string | null;
  status: AttendanceStatus;
  reason: string | null;
}
export interface AttendanceList {
  items: AttendanceMember[];
  birthdays_today: AttendanceMember[];
  total: number;
  limit: number;
  offset: number;
  summary: { total: number; present: number; absent: number; wfh: number };
}
export const attendanceToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
