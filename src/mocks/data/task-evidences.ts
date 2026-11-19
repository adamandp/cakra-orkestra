import type { PresignTaskEvidenceInput, TaskEvidence } from "@/interface/task.interface";
import { TASK_EVIDENCE_UPLOAD_TTL_MS } from "@/features/tasks/task.constants";

const DB_NAME = "cakra-orkestra:mock-evidence:v1";
const STORE = "uploads";

export interface MockEvidenceUpload extends PresignTaskEvidenceInput {
  id: string;
  taskId: string;
  actorId: string;
  token: string;
  objectKey: string;
  expiresAt: number;
  blob: Blob | null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, setResult: (value: T) => void) => void,
): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      let result: T;
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Evidence storage transaction aborted"));
      transaction.onerror = () => reject(transaction.error ?? new Error("Evidence storage failed"));
      try {
        run(transaction.objectStore(STORE), (value) => {
          result = value;
        });
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
  } finally {
    db.close();
  }
}

export function getMockEvidenceUpload(id: string) {
  return transact<MockEvidenceUpload | undefined>("readonly", (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => done(request.result as MockEvidenceUpload | undefined);
  });
}

export async function createMockEvidenceUpload(
  taskId: string,
  actorId: string,
  input: PresignTaskEvidenceInput,
) {
  const id = crypto.randomUUID();
  const record: MockEvidenceUpload = {
    ...input,
    id,
    taskId,
    actorId,
    token: crypto.randomUUID(),
    objectKey: `tasks/${taskId}/${id}`,
    expiresAt: Date.now() + TASK_EVIDENCE_UPLOAD_TTL_MS,
    blob: null,
  };
  await transact<void>("readwrite", (store, done) => {
    store.add(record);
    done(undefined);
  });
  return record;
}

export type UploadResult = "OK" | "FORBIDDEN" | "EXPIRED" | "INVALID" | "EXISTS";

// Read and write in the same IndexedDB transaction; a signed upload cannot overwrite bytes.
export function writeMockEvidenceUpload(id: string, token: string, blob: Blob, mime: string) {
  return transact<UploadResult>("readwrite", (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result as MockEvidenceUpload | undefined;
      if (!record || token !== record.token) return done("FORBIDDEN");
      if (Date.now() >= record.expiresAt) return done("EXPIRED");
      if (record.blob) return done("EXISTS");
      if (blob.size !== record.file_size || mime !== record.mime_type) return done("INVALID");
      store.put({ ...record, blob: new Blob([blob], { type: mime }) });
      done("OK");
    };
  });
}

export function deleteMockEvidenceUpload(id: string) {
  return transact<void>("readwrite", (store, done) => {
    store.delete(id);
    done(undefined);
  });
}

export function evidenceUploadId(taskId: string, objectKey: string) {
  const prefix = `tasks/${taskId}/`;
  if (!objectKey.startsWith(prefix)) return null;
  const id = objectKey.slice(prefix.length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
}

export function makeMockFileEvidence(
  record: MockEvidenceUpload,
  now: string,
  title?: string,
): TaskEvidence {
  return {
    id: record.id,
    task_id: record.taskId,
    type: "FILE",
    title: title ?? null,
    url: null,
    object_key: record.objectKey,
    file_name: record.file_name,
    mime_type: record.mime_type,
    file_size: record.file_size,
    created_at: now,
    updated_at: now,
  };
}
