import type { RequestHandler } from "msw";
import { authHandlers } from "./auth";
import { userHandlers } from "./users";
import { roleHandlers } from "./roles";
import { projectHandlers } from "./projects";
import { taskHandlers } from "./tasks";
import { taskEvidenceHandlers } from "./task-evidences";
import { taskAIResultHandlers } from "./task-ai-results";
import { changelogHandlers } from "./changelogs";
import { scoreHandlers } from "./scores";

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...userHandlers,
  ...roleHandlers,
  ...projectHandlers,
  ...taskHandlers,
  ...taskEvidenceHandlers,
  ...taskAIResultHandlers,
  ...changelogHandlers,
  ...scoreHandlers,
];
