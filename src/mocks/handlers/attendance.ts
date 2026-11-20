import { HttpResponse } from "msw";
import { http } from "./audited-http";
import { z } from "zod";
import { getMockUser } from "../data/auth-store";
import { getMockUsers, demoTeamUsers } from "../data/users";
import { notify } from "../data/notifications";
import {
  absenceStatuses,
  attendanceToday,
  type AttendanceRecord,
  type AttendanceMember,
} from "@/interface/attendance.interface";
const key = "cakra-orkestra:attendance:v1";
const dateSchema = z.iso.date();
const read = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = JSON.parse(localStorage.getItem(key) ?? "[]");
  const marker = key + ":examples";
  if (!localStorage.getItem(marker)) {
    const ids = new Set(
      getMockUsers()
        .filter((u) => u.is_active)
        .map((u) => u.id),
    );
    absenceStatuses.forEach((status, i) => {
      const user = demoTeamUsers[i];
      const date = attendanceToday();
      if (
        user &&
        ids.has(user.id) &&
        !records.some((r) => r.user_id === user.id && r.date === date)
      )
        records.push({ id: crypto.randomUUID(), user_id: user.id, date, status, reason: null });
    });
    localStorage.setItem(key, JSON.stringify(records));
    localStorage.setItem(marker, "1");
  }
  return records;
};
const save = (records: AttendanceRecord[]) => localStorage.setItem(key, JSON.stringify(records));
const fail = (status: number, message: string) => HttpResponse.json({ message }, { status });
const ok = (data: unknown) => HttpResponse.json({ data });
function birthdayDays(birth: string | null, date: string) {
  if (!birth) return null;
  const current = new Date(date + "T00:00:00Z");
  const next = new Date(
    Date.UTC(current.getUTCFullYear(), Number(birth.slice(5, 7)) - 1, Number(birth.slice(8, 10))),
  );
  if (next < current) next.setUTCFullYear(next.getUTCFullYear() + 1);
  return Math.round((next.getTime() - current.getTime()) / 86400000);
}
export const attendanceHandlers = [
  http.get("*/api/attendance", ({ request }) => {
    if (!getMockUser(request)) return fail(401, "Unauthorized");
    const p = z
      .object({
        date: dateSchema.default(attendanceToday()),
        q: z.string().max(100).default(""),
        status: z.enum(["ALL", "PRESENT", ...absenceStatuses]).default("ALL"),
        limit: z.coerce.number().int().min(1).max(100).default(12),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!p.success) return fail(400, "Invalid filters");
    const { date, q, status, limit, offset } = p.data;
    const records = read().filter((r) => r.date === date);
    const members: AttendanceMember[] = getMockUsers()
      .filter((u) => u.is_active)
      .map((u) => {
        const r = records.find((r) => r.user_id === u.id);
        return {
          id: u.id,
          name: u.name,
          username: u.username,
          birthday_days: birthdayDays(u.birth_date, date),
          avatar_url: u.avatar_url,
          status: r?.status ?? "PRESENT",
          reason: null,
        };
      });
    const actor = getMockUser(request);
    for (const member of members)
      if (actor?.id === member.id || actor?.role === "ADMIN")
        member.reason = records.find((r) => r.user_id === member.id)?.reason ?? null;
    const summary = {
      total: members.length,
      present: members.filter((u) => u.status === "PRESENT").length,
      wfh: members.filter((u) => u.status === "WFH").length,
      absent: members.filter((u) => !["PRESENT", "WFH"].includes(u.status)).length,
    };
    const items = members
      .filter(
        (u) =>
          (status === "ALL" || u.status === status) &&
          [u.name, u.username].join(" ").toLowerCase().includes(q.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    return ok({
      birthdays_today: members.filter((u) => u.birthday_days === 0),
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
      summary,
    });
  }),
  http.get("*/api/attendance/me", ({ request }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    return ok(
      read()
        .filter((r) => r.user_id === u.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    );
  }),
  http.put("*/api/attendance/me", async ({ request }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const p = z
      .object({
        start_date: dateSchema,
        end_date: dateSchema,
        status: z.enum(["PRESENT", ...absenceStatuses]),
        reason: z.string().trim().max(500).nullable().optional(),
      })
      .safeParse(await request.json().catch(() => null));
    if (!p.success) return fail(400, "Invalid attendance");
    const { start_date, end_date, status, reason } = p.data;
    const start = Date.parse(start_date),
      end = Date.parse(end_date);
    if (end < start || end - start > 90 * 86400000 || start_date < attendanceToday())
      return fail(400, "Select today or a future range of up to 91 days");
    const records = read();
    let changed = false;
    for (let time = start; time <= end; time += 86400000) {
      const date = new Date(time).toISOString().slice(0, 10);
      const index = records.findIndex((r) => r.user_id === u.id && r.date === date);
      const old = records[index];
      if (status === "PRESENT") {
        if (index >= 0) {
          records.splice(index, 1);
          changed = true;
        }
        continue;
      }
      if (old?.status === status && old.reason === (reason ?? null)) continue;
      if (index >= 0) records.splice(index, 1);
      records.push({
        id: crypto.randomUUID(),
        user_id: u.id,
        date,
        status,
        reason: reason ?? null,
      });
      changed = true;
    }
    save(records);
    if (changed)
      notify(
        getMockUsers()
          .filter((x) => x.is_active && x.role === "ADMIN")
          .map((x) => x.id),
        u.id,
        "ATTENDANCE_UPDATED",
        "Attendance updated",
        u.name + " — " + status + " (" + start_date + " to " + end_date + ")",
        "attendance",
        start_date,
      );
    return ok({ changed });
  }),
];
