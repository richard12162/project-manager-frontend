import { apiRequest } from "./client";
import type { TaskResponse } from "./projects";

export function getMyTasks(token: string) {
  const response = apiRequest<TaskResponse[]>("/tasks/my", {
    token,
  });
  return response;
}
