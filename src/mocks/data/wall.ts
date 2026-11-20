import type { WallNote } from "@/interface/wall.interface";
import { getMockUsers } from "./users";
const key = "cakra-orkestra:wall:v1";
export function saveWall(notes: WallNote[]) {
  localStorage.setItem(key, JSON.stringify(notes));
}
export function getWall(): WallNote[] {
  const raw = localStorage.getItem(key);
  if (raw) return JSON.parse(raw);
  const users = getMockUsers();
  const now = new Date().toISOString();
  const examples = [
    ["Daily reminder", "Update your tasks before the daily meeting.", "yellow"],
    ["Design ideas", "What if we build a shared component library?", "pink"],
    ["Small wins", "Our latest release is live! Great work, team.", "green"],
    ["Knowledge sharing", "Share useful resources and documentation here.", "blue"],
    ["Team lunch", "Anyone up for lunch together on Friday?", "purple"],
    ["Feedback corner", "What could make our workflow smoother?", "orange"],
  ] as const;
  const notes = examples.map(([title, content, color], i): WallNote => ({
    id: crypto.randomUUID(),
    author_id: users[i % users.length].id,
    author_name: users[i % users.length].name,
    title,
    content,
    color,
    pinned: i === 0,
    created_at: now,
    updated_at: now,
    reactions: [],
    comments: [],
  }));
  saveWall(notes);
  return notes;
}
