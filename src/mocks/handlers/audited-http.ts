import { getWall } from "../data/wall";
import { findMockChangelog } from "../data/changelogs";
import { snapshot, emitNotification } from "./notification-events";
import { http as base, type HttpResponseResolver, type PathParams, type DefaultBodyType } from "msw";
import { getMockUser } from "../data/auth-store";
import { getMockUsers } from "../data/users";
import { appendActivityLog } from "../data/activity-logs";
const safeFields = new Set(["name","username","avatar_url","birth_date","role_id","is_active","owner_id","member_ids","status","title","description","task_type","task_category","due_date","assignee_id","project_id","checklists","is_completed","sort_order","item_ids","reason","version","released_at","changes","commit_url","url","file_name"]);
function wrap(method: "post"|"patch"|"put"|"delete") {
  return (path: string, resolver: HttpResponseResolver<PathParams,DefaultBodyType,DefaultBodyType>) => base[method](path, async info => {
    const parts = new URL(info.request.url).pathname.split("/").filter(Boolean);
    const resource = parts[1];
    const sub = parts[3];
    const login = resource === "auth" && parts[2] === "login";
    const excluded = resource === "mock-storage" || (resource === "auth" && parts[2] === "refresh") || sub === "evidences" && parts[4] === "presign";
    if(excluded) return resolver(info);
    const actor = getMockUser(info.request);
    const raw = await info.request.clone().json().catch(()=>null);
    const body = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string,unknown> : {};
    const before = snapshot(resource, parts[2] ?? "");
    const wallBefore = resource==="wall" ? getWall().find(n=>n.id===parts[3] || n.comments.some(c=>c.id===parts[3])) : undefined;
    const previousTarget = before.task?.title ?? before.project?.name ?? (resource==="users"?getMockUsers().find(u=>u.id===parts[2])?.name:undefined) ?? (resource==="changelogs"?findMockChangelog(parts[2])?.version:undefined);
    const response = await resolver(info);
    if (!(response instanceof Response) || (!response.ok && !login)) return response;
    const data = await response.clone().json().catch(()=>null) as {message?:string;data?:Record<string,unknown>} | null;
    if(response.ok && actor) { try { emitNotification(parts,method,actor.id,before,data?.data); } catch { /* Mock notification storage failure. */ } }
    const signedIn = login && response.ok ? getMockUsers().find(u=>u.username===body.username) : undefined;
    const identity = login ? signedIn : actor;
    let action = resource === "auth" ? parts[2].toUpperCase() : sub ? [sub,parts[4] && ["link","confirm","order"].includes(parts[4]) ? parts[4] : parts[5],method].filter(Boolean).join("_").toUpperCase() : ({post:"CREATE",patch:"UPDATE",put:"UPDATE",delete:"DELETE"}[method]);
    if(resource==="wall") action=parts[2]==="comments"?"COMMENTS_DELETE":parts[4]?[parts[4],parts[5],method].filter(Boolean).join("_").toUpperCase():({post:"NOTE_CREATE",patch:"NOTE_UPDATE",put:"NOTE_UPDATE",delete:"NOTE_DELETE"}[method]);
    const target = data?.data?.name ?? data?.data?.title ?? data?.data?.version ?? wallBefore?.title ?? previousTarget ?? null;
    try { appendActivityLog({
      actor_id: identity?.id ?? null, actor_name: identity?.name ?? (login && typeof body.username==="string" ? body.username.slice(0,100) : "Unknown"), actor_role: identity?.role ?? null,
      action, resource, resource_id: resource==="wall" ? (wallBefore?.id ?? (typeof data?.data?.id==="string"?data.data.id:null)) : resource==="auth" ? identity?.id ?? null : parts[2] ?? (typeof data?.data?.id==="string"?data.data.id:null),
      target: typeof target==="string"?target:null, changed_fields: resource==="auth"?[]:Object.keys(body).filter(k=>safeFields.has(k)),
      message: data?.message ?? action, outcome:response.ok?"SUCCESS":"FAILED"
    }); } catch { /* Audit storage failure must not replay a mutation. */ }
    return response;
  });
}
export const http = { ...base, get:base.get, post:wrap("post"),patch:wrap("patch"),put:wrap("put"),delete:wrap("delete") };
