import { apiRequest } from './client'
import type { components, operations } from '../types/api'

export type CreateTaskRequest = components['schemas']['CreateTaskRequest']
export type TaskResponse = components['schemas']['TaskResponse'] & {
  projectName?: string
}
export type CreateCommentRequest = components['schemas']['CreateCommentRequest']
export type CommentResponse = components['schemas']['CommentResponse']
export type UpdateTaskRequest = components['schemas']['UpdateTaskRequest']
export type UpdateTaskStatusRequest = components['schemas']['UpdateTaskStatusRequest']
export type UpdateTaskAssignmentRequest =
  components['schemas']['UpdateTaskAssignmentRequest']
export type UpdateCommentRequest = components['schemas']['UpdateCommentRequest']
export type TaskStatus = UpdateTaskStatusRequest['status']
export type TaskPriority = NonNullable<
  operations['getTasksByProject']['parameters']['query']
>['priority']
export type GetProjectTasksQuery = NonNullable<
  operations['getTasksByProject']['parameters']['query']
>
export type PagedTaskResponse = components['schemas']['PagedResponseTaskResponse']

export function getMyTasks(token: string) {
  return apiRequest<TaskResponse[]>('/tasks/my', {
    token,
  })
}

export function getProjectTasks(
  token: string,
  projectId: string,
  query: Partial<GetProjectTasksQuery> = {},
) {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const search = searchParams.toString()

  return apiRequest<PagedTaskResponse>(
    `/projects/${projectId}/tasks${search ? `?${search}` : ''}`,
    {
      token,
    },
  )
}

export function createProjectTask(
  token: string,
  projectId: string,
  payload: CreateTaskRequest,
) {
  return apiRequest<TaskResponse>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateProjectTask(
  token: string,
  taskId: string,
  payload: UpdateTaskRequest,
) {
  return apiRequest<TaskResponse>(`/tasks/${taskId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function updateProjectTaskStatus(
  token: string,
  taskId: string,
  payload: UpdateTaskStatusRequest,
) {
  return apiRequest<TaskResponse>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function updateProjectTaskAssignment(
  token: string,
  taskId: string,
  payload: UpdateTaskAssignmentRequest,
) {
  return apiRequest<TaskResponse>(`/tasks/${taskId}/assignment`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function getTaskComments(token: string, taskId: string) {
  return apiRequest<CommentResponse[]>(`/tasks/${taskId}/comments`, {
    token,
  })
}

export function createTaskComment(
  token: string,
  taskId: string,
  payload: CreateCommentRequest,
) {
  return apiRequest<CommentResponse>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateTaskComment(
  token: string,
  commentId: string,
  payload: UpdateCommentRequest,
) {
  return apiRequest<CommentResponse>(`/comments/${commentId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export function deleteTaskComment(token: string, commentId: string) {
  return apiRequest<void>(`/comments/${commentId}`, {
    method: 'DELETE',
    token,
  })
}
