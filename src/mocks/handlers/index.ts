import type { RequestHandler } from "msw";
import { authHandlers } from "./auth";
import { userHandlers } from "./users";
import { roleHandlers } from "./roles";

export const handlers: RequestHandler[] = [...authHandlers, ...userHandlers, ...roleHandlers];
