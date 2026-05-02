import { authHandlers } from "./auth.handlers";
import { databaseHandlers } from "./database.handlers";

export const handlers = [...authHandlers, ...databaseHandlers];
