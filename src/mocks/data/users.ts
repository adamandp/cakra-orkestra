import { attendanceToday } from "@/interface/attendance.interface";
import type { AuthUser } from "@/interface/auth.interface";
import type { CreateUserInput, User } from "@/interface/user.interface";
import type { UserRole } from "@/interface/role.interface";
import { mockRoles } from "./roles";

const USERS_KEY = "cakra-orkestra:mock-users:v1";
const createdAt = "2026-11-19T00:00:00.000Z";

export interface MockUser extends User {
  password_hash: string | null;
}

const seedUsers: MockUser[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    username: "admin",
    name: "Administrator",
    role: "ADMIN",
    role_id: mockRoles[0].id,
    avatar_url: null,
    birth_date: null,
    is_active: true,
    password_hash: null,
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    username: "member",
    name: "Member",
    role: "MEMBER",
    role_id: mockRoles[1].id,
    avatar_url: null,
    birth_date: null,
    is_active: true,
    password_hash: null,
    created_at: createdAt,
    updated_at: createdAt,
  },
];

export const demoTeamUsers: MockUser[] = ["Raka Pratama", "Nadia Putri", "Kevin Wijaya", "Sarah Ananda", "Dimas Saputra", "Alya Rahma", "Fajar Nugroho", "Maya Sari", "Rizky Ramadhan", "Dewi Lestari", "Andi Firmansyah", "Sinta Amelia", "Bima Arya", "Nina Kartika", "Arif Hidayat", "Tiara Safitri", "Reza Maulana", "Vina Aprilia", "Dani Kurniawan"].map((name, i) => ({
  ...seedUsers[1], id: `00000000-0000-4000-8000-000000000${601 + i}`,
  name, username: name.toLowerCase().replace(/ /g, "."),
}));

export function getMockUsers(): MockUser[] {
  const stored = localStorage.getItem(USERS_KEY);
  const users: MockUser[] = stored === null ? seedUsers.map((user) => ({ ...user })) : JSON.parse(stored);
  if (!localStorage.getItem("cakra-orkestra:demo-team-users:v1")) {
    users.push(...demoTeamUsers.filter((user) => !users.some((item) => item.id === user.id || item.username === user.username)));
    saveMockUsers(users);
    localStorage.setItem("cakra-orkestra:demo-team-users:v1", "1");
  }
  if (!localStorage.getItem("cakra-orkestra:demo-birthdays:v1")) {
    const today=attendanceToday();
    const upcoming=new Date(today+"T00:00:00Z"); upcoming.setUTCDate(upcoming.getUTCDate()+3);
    [today.slice(5),upcoming.toISOString().slice(5,10)].forEach((md,i)=>{
      const user=users.find(u=>u.id===demoTeamUsers[5+i]?.id);
      if(user&&!user.birth_date)user.birth_date="2000-"+md;
    });
    saveMockUsers(users);
    localStorage.setItem("cakra-orkestra:demo-birthdays:v1","1");
  }
  return users;
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findMockUser(id: string) {
  return getMockUsers().find((user) => user.id === id);
}

export function toPublicUser(user: MockUser): User {
  return {
    ...toAuthUser(user),
    role_id: user.role_id,
    birth_date: user.birth_date,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export function toAuthUser(user: MockUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar_url: user.avatar_url,
    is_active: user.is_active,
  };
}

// SHA-256 is only used for the mock server, not production password storage.
async function hashDemoPassword(password: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createMockUser(input: CreateUserInput, role: UserRole) {
  const password_hash = await hashDemoPassword(input.password);
  const users = getMockUsers();
  if (users.some((user) => user.username === input.username)) return null;

  const now = new Date().toISOString();
  const user: MockUser = {
    id: crypto.randomUUID(),
    username: input.username,
    name: input.name,
    role: role.name,
    role_id: role.id,
    avatar_url: input.avatar_url,
    birth_date: input.birth_date,
    is_active: true,
    password_hash,
    created_at: now,
    updated_at: now,
  };

  saveMockUsers([user, ...users]);
  return user;
}

type MockUserPatch = Partial<
  Pick<
    MockUser,
    | "username"
    | "name"
    | "avatar_url"
    | "birth_date"
    | "is_active"
    | "role"
    | "role_id"
    | "password_hash"
  >
>;

export function updateMockUser(id: string, patch: MockUserPatch) {
  const users = getMockUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;
  const user = { ...users[index], ...patch, updated_at: new Date().toISOString() };
  users[index] = user;
  saveMockUsers(users);
  return user;
}

export async function matchesMockPassword(userId: string, password: string) {
  const user = findMockUser(userId);
  if (!user) return false;
  if (user.password_hash) return user.password_hash === (await hashDemoPassword(password));

  // Keep compatible with password changes made before Commit 4.
  const legacyHash = localStorage.getItem("cakra-orkestra:mock-password:v1:" + userId);
  if (legacyHash) return legacyHash === (await hashDemoPassword(password));

  const seedPassword =
    userId === seedUsers[0].id ? "admin" : userId === seedUsers[1].id ? "member" : null;
  return seedPassword !== null && password === seedPassword;
}

export async function updateMockPassword(userId: string, password: string) {
  const password_hash = await hashDemoPassword(password);
  updateMockUser(userId, { password_hash });
}
