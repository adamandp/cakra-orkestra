import { HttpResponse } from "msw";
import { http } from "./audited-http";
import {
  createTaskLinkSchema,
  updateTaskEvidenceSchema,
  presignTaskEvidenceSchema,
  confirmTaskEvidenceSchema,
} from "@/features/tasks/task.schema";
import { TASK_EVIDENCE_MAX_BYTES } from "@/features/tasks/task.constants";
import type { TaskEvidence } from "@/interface/task.interface";
import { updateMockTask } from "../data/tasks";
import {
  createMockEvidenceUpload,
  getMockEvidenceUpload,
  writeMockEvidenceUpload,
  deleteMockEvidenceUpload,
  evidenceUploadId,
  makeMockFileEvidence,
} from "../data/task-evidences";
import { failure, requireTask, taskResponse } from "./tasks";

function canonicalUrl(value: string) {
  return new URL(value).href;
}
async function hashBlob(blob: Blob) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}
export const taskEvidenceHandlers = [
  http.get("*/api/tasks/:id/evidences", ({ request, params }) => {
    const result = requireTask(request, String(params.id));
    if (result.error) return result.error;
    return HttpResponse.json({ data: result.task.evidences });
  }),

  http.post("*/api/tasks/:id/evidences/link", async ({ request, params }) => {
    const body = createTaskLinkSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (result.task.task_status === "BLOCKED")
      return failure("Resume the task before adding evidence", 409);
    if (!body.success) return failure(body.error.issues[0].message, 400);
    if (
      result.task.evidences.some(
        (item) =>
          item.type === "LINK" &&
          item.url &&
          canonicalUrl(item.url) === canonicalUrl(body.data.url),
      )
    )
      return failure("This link is already attached", 409);
    return taskResponse(
      updateMockTask(id, (task, now) => {
        const evidence: TaskEvidence = {
          id: crypto.randomUUID(),
          task_id: id,
          type: "LINK",
          title: body.data.title ?? null,
          url: body.data.url,
          object_key: null,
          file_name: null,
          mime_type: null,
          file_size: null,
          created_at: now,
          updated_at: now,
        };
        return { ...task, evidences: [...task.evidences, evidence] };
      }),
      "Link added",
      201,
    );
  }),

  http.post("*/api/tasks/:id/evidences/presign", async ({ request, params }) => {
    const body = presignTaskEvidenceSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (result.task.task_status === "BLOCKED")
      return failure("Resume the task before adding evidence", 409);
    if (!body.success) return failure(body.error.issues[0].message, 400);
    try {
      const record = await createMockEvidenceUpload(id, result.user.id, body.data);
      const url = new URL(`/api/mock-storage/evidence/${record.id}`, request.url);
      url.searchParams.set("token", record.token);
      return HttpResponse.json({
        data: {
          upload_url: url.toString(),
          object_key: record.objectKey,
          expires_at: new Date(record.expiresAt).toISOString(),
        },
      });
    } catch {
      return failure("Unable to prepare evidence storage", 500);
    }
  }),

  // Simulated object-storage endpoint. No API Authorization header is required.
  http.put("*/api/mock-storage/evidence/:uploadId", async ({ request, params }) => {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return failure("Invalid upload token", 403);
    const mime = request.headers.get("content-type") ?? "";
    try {
      const blob = await request.blob();
      if (blob.size > TASK_EVIDENCE_MAX_BYTES) return failure("File too large", 413);
      const result = await writeMockEvidenceUpload(String(params.uploadId), token, blob, mime);
      if (result === "FORBIDDEN" || result === "EXPIRED")
        return failure("Invalid or expired upload URL", 403);
      if (result === "INVALID") return failure("Upload size or type does not match", 400);
      if (result === "EXISTS") return failure("Object already uploaded", 409);
      return new HttpResponse(null, { status: 200 });
    } catch {
      return failure("Unable to store evidence file", 500);
    }
  }),

  http.post("*/api/tasks/:id/evidences/confirm", async ({ request, params }) => {
    const body = confirmTaskEvidenceSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (!body.success) return failure(body.error.issues[0].message, 400);
    const uploadId = evidenceUploadId(id, body.data.object_key);
    if (!uploadId) return failure("Invalid object key", 400);
    try {
      const upload = await getMockEvidenceUpload(uploadId);
      // Re-read auth and task after async I/O. No await between validation and metadata write.
      const current = requireTask(request, id, true);
      if (current.error) return current.error;
      if (
        !upload ||
        upload.taskId !== id ||
        upload.actorId !== current.user.id ||
        upload.objectKey !== body.data.object_key
      ) {
        return failure("Upload not found", 404);
      }
      if (current.task.retired_evidence_ids?.includes(uploadId))
        return failure("Evidence was removed", 409);
      if (current.task.evidences.some((item) => item.id === uploadId)) {
        return taskResponse(current.task, "Evidence already confirmed");
      }
      if (current.task.task_status === "BLOCKED")
        return failure("Resume the task before adding evidence", 409);
      if (Date.now() >= upload.expiresAt) return failure("Upload expired", 409);
      if (
        !upload.blob ||
        upload.blob.size !== upload.file_size ||
        upload.blob.type !== upload.mime_type.toLowerCase()
      ) {
        return failure("Uploaded file not verified", 409);
      }
      const hash = await hashBlob(upload.blob);
      // Compare older uploads that predate content hashes as well.
      const legacyMatches = new Set<string>();
      for (const item of current.task.evidences) {
        if (item.type !== "FILE" || item.sha256_hash || item.file_size !== upload.blob.size)
          continue;
        const prior = await getMockEvidenceUpload(item.id);
        if (prior?.blob && (await hashBlob(prior.blob)) === hash) legacyMatches.add(item.id);
      }
      const latest = requireTask(request, id, true);
      if (latest.error) return latest.error;
      if (latest.task.retired_evidence_ids?.includes(uploadId))
        return failure("Evidence was removed", 409);
      if (latest.task.evidences.some((item) => item.id === uploadId))
        return taskResponse(latest.task, "Evidence already confirmed");
      if (latest.task.task_status === "BLOCKED")
        return failure("Resume the task before adding evidence", 409);
      if (Date.now() >= upload.expiresAt) return failure("Upload expired", 409);
      if (
        latest.task.evidences.some(
          (item) =>
            item.type === "FILE" && (item.sha256_hash === hash || legacyMatches.has(item.id)),
        )
      ) {
        try {
          await deleteMockEvidenceUpload(uploadId);
        } catch {
          /* Best-effort cleanup. */
        }
        return failure("This file is already attached", 409);
      }
      return taskResponse(
        updateMockTask(id, (task, now) => ({
          ...task,
          evidences: [
            ...task.evidences,
            { ...makeMockFileEvidence(upload, now, body.data.title), sha256_hash: hash },
          ],
        })),
        "File added",
        201,
      );
    } catch {
      return failure("Unable to verify evidence upload", 500);
    }
  }),

  http.get("*/api/tasks/:id/evidences/:evidenceId/download", async ({ request, params }) => {
    const id = String(params.id);
    const evidenceId = String(params.evidenceId);
    const result = requireTask(request, id);
    if (result.error) return result.error;
    const evidence = result.task.evidences.find(
      (item) => item.id === evidenceId && item.type === "FILE",
    );
    if (!evidence) return failure("File evidence not found", 404);
    try {
      const upload = await getMockEvidenceUpload(evidenceId);
      const current = requireTask(request, id);
      if (current.error) return current.error;
      if (
        !current.task.evidences.some(
          (item) => item.id === evidenceId && item.object_key === evidence.object_key,
        )
      )
        return failure("Evidence not found", 404);
      if (!upload?.blob || upload.taskId !== id || upload.objectKey !== evidence.object_key)
        return failure("File unavailable", 404);
      return new HttpResponse(upload.blob, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": "attachment",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return failure("Unable to read evidence file", 500);
    }
  }),

  http.patch("*/api/tasks/:id/evidences/:evidenceId", async ({ request, params }) => {
    const body = updateTaskEvidenceSchema.safeParse(await request.json().catch(() => null));
    const id = String(params.id);
    const evidenceId = String(params.evidenceId);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    if (!body.success) return failure(body.error.issues[0].message, 400);
    const item = result.task.evidences.find((item) => item.id === evidenceId);
    if (!item) return failure("Evidence not found", 404);
    const url = body.data.url;
    if (item.type === "FILE" && url !== undefined)
      return failure("File evidence cannot have a URL", 400);
    if (
      url &&
      result.task.evidences.some(
        (other) =>
          other.id !== evidenceId &&
          other.type === "LINK" &&
          other.url &&
          canonicalUrl(other.url) === canonicalUrl(url),
      )
    )
      return failure("This link is already attached", 409);
    return taskResponse(
      updateMockTask(id, (task, now) => ({
        ...task,
        evidences: task.evidences.map((evidence) =>
          evidence.id === evidenceId
            ? { ...evidence, title: body.data.title, url: url ?? evidence.url, updated_at: now }
            : evidence,
        ),
      })),
      "Evidence updated",
    );
  }),

  http.delete("*/api/tasks/:id/evidences/:evidenceId", async ({ request, params }) => {
    const id = String(params.id);
    const evidenceId = String(params.evidenceId);
    const result = requireTask(request, id, true);
    if (result.error) return result.error;
    const evidence = result.task.evidences.find((item) => item.id === evidenceId);
    if (!evidence) return failure("Evidence not found", 404);
    const updated = updateMockTask(id, (task) => ({
      ...task,
      evidences: task.evidences.filter((item) => item.id !== evidenceId),
      retired_evidence_ids:
        evidence.type === "FILE"
          ? [...(task.retired_evidence_ids ?? []), evidenceId]
          : task.retired_evidence_ids,
    }));
    if (evidence.type === "FILE") {
      // Metadata is the authority for access. Storage cleanup is best-effort in the mock.
      try {
        await deleteMockEvidenceUpload(evidenceId);
      } catch (error) {
        console.warn("Mock evidence cleanup failed", error);
      }
    }
    // Do not return a stale snapshot if another request changed the task during cleanup.
    const current = requireTask(request, id);
    if (current.error) return current.error;
    return taskResponse(updated ? current.task : null, "Evidence removed");
  }),
];
