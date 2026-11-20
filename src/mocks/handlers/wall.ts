import { HttpResponse } from "msw";
import { http } from "./audited-http";
import { z } from "zod";
import { getMockUser } from "../data/auth-store";
import { getWall, saveWall } from "../data/wall";
import { noteColors, type WallNote } from "@/interface/wall.interface";
const schema = z.object({
  title: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(1500),
  color: z.enum(noteColors),
});
const fail = (status: number, message: string) => HttpResponse.json({ message }, { status });
const ok = (data: unknown) => HttpResponse.json({ data });
const root = "*/api/wall/notes";
const stamp = () => new Date().toISOString();
function update(id: string, change: (note: WallNote) => WallNote) {
  const notes = getWall();
  const next = notes.map((n) => (n.id === id ? change(n) : n));
  saveWall(next);
  return ok(next.find((n) => n.id === id));
}
export const wallHandlers = [
  http.get(root, ({ request }) =>
    getMockUser(request) ? ok(getWall()) : fail(401, "Unauthorized"),
  ),
  http.post(root, async ({ request }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const p = schema.safeParse(await request.json().catch(() => null));
    if (!p.success) return fail(400, "Invalid note");
    const note: WallNote = {
      ...p.data,
      id: crypto.randomUUID(),
      author_id: u.id,
      author_name: u.name,
      pinned: false,
      created_at: stamp(),
      updated_at: stamp(),
      likes: [],
      reactions: [],
      comments: [],
    };
    saveWall([note, ...getWall()]);
    return HttpResponse.json({ data: note }, { status: 201 });
  }),
  http.patch(root + "/:id", async ({ request, params }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.id === params.id);
    if (!n) return fail(404, "Note not found");
    if (n.author_id !== u.id) return fail(403, "Forbidden");
    const p = schema.partial().safeParse(await request.json().catch(() => null));
    if (!p.success) return fail(400, "Invalid note");
    return update(n.id, (n) => ({ ...n, ...p.data, updated_at: stamp() }));
  }),
  http.delete(root + "/:id", ({ request, params }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.id === params.id);
    if (!n) return fail(404, "Note not found");
    if (n.author_id !== u.id && u.role !== "ADMIN") return fail(403, "Forbidden");
    saveWall(getWall().filter((x) => x.id !== n.id));
    return ok(null);
  }),
  http.patch(root + "/:id/pin", ({ request, params }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.id === params.id);
    if (!n) return fail(404, "Note not found");
    if (n.author_id !== u.id && u.role !== "ADMIN") return fail(403, "Forbidden");
    return update(n.id, (n) => ({ ...n, pinned: !n.pinned }));
  }),
  http.patch(root + "/:id/like", ({ request, params }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.id === params.id);
    if (!n) return fail(404, "Note not found");
    return update(n.id, n => ({ ...n, likes: (n.likes ?? []).includes(u.id) ? (n.likes ?? []).filter(id => id !== u.id) : [...(n.likes ?? []), u.id] }));
  }),
  http.post(root + "/:id/reactions", async ({ request, params }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.id === params.id);
    if (!n) return fail(404, "Note not found");
    const p = z
      .object({ emoji: z.string().trim().max(32).refine(value => /^[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0F\u200D\u20E3]+$/u.test(value) && [...new Intl.Segmenter().segment(value)].length === 1) })
      .safeParse(await request.json().catch(() => null));
    if (!p.success) return fail(400, "Invalid reaction");
    return update(n.id, (n) => ({
      ...n,
      reactions: [
        ...n.reactions.filter((r) => r.user_id !== u.id),
        { user_id: u.id, emoji: p.data.emoji },
      ],
    }));
  }),
  http.delete(root + "/:id/reactions/me", ({ request, params }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.id === params.id);
    if (!n) return fail(404, "Note not found");
    return update(n.id, (n) => ({
      ...n,
      reactions: n.reactions.filter((r) => r.user_id !== u.id),
    }));
  }),
  http.get(root + "/:id/comments", ({ request, params }) => {
    if (!getMockUser(request)) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.id === params.id);
    return n ? ok(n.comments) : fail(404, "Note not found");
  }),
  http.post(root + "/:id/comments", async ({ request, params }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.id === params.id);
    if (!n) return fail(404, "Note not found");
    const p = z
      .object({ content: z.string().trim().min(1).max(500) })
      .safeParse(await request.json().catch(() => null));
    if (!p.success) return fail(400, "Invalid comment");
    return update(n.id, (n) => ({
      ...n,
      comments: [
        ...n.comments,
        {
          id: crypto.randomUUID(),
          author_id: u.id,
          author_name: u.name,
          content: p.data.content,
          created_at: stamp(),
        },
      ],
    }));
  }),
  http.delete("*/api/wall/comments/:id", ({ request, params }) => {
    const u = getMockUser(request);
    if (!u) return fail(401, "Unauthorized");
    const n = getWall().find((n) => n.comments.some((c) => c.id === params.id));
    const c = n?.comments.find((c) => c.id === params.id);
    if (!n || !c) return fail(404, "Comment not found");
    if (c.author_id !== u.id && u.role !== "ADMIN") return fail(403, "Forbidden");
    return update(n.id, (n) => ({ ...n, comments: n.comments.filter((c) => c.id !== params.id) }));
  }),
];
