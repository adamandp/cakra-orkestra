import type { RequestHandler } from "msw";
import { authHandlers } from "./auth";
import { userHandlers } from "./users";
import { roleHandlers } from "./roles";
import { projectHandlers } from "./projects";
import { taskHandlers } from "./tasks";

export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...userHandlers,
  ...roleHandlers,
  ...projectHandlers,
  ...taskHandlers,
];
