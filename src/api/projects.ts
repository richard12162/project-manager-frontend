import { apiRequest } from './client'
import type { components, operations } from '../types/api'

export type CreateProjectRequest = components['schemas']['CreateProjectRequest']
export type ProjectResponse = components['schemas']['ProjectResponse']
export type TaskResponse = components['schemas']['TaskResponse']
export type TaskStatus = NonNullable<
  operations['getTasksByProject']['parameters']['query']
>['status']
export type TaskPriority = NonNullable<
  operations['getTasksByProject']['parameters']['query']
>['priority']
export type GetTasksQuery = NonNullable<
  operations['getTasksByProject']['parameters']['query']
>
export type PagedTaskResponse = components['schemas']['PagedResponseTaskResponse']

export function getMyProjects(token: string) {
  return apiRequest<ProjectResponse[]>('/projects', {
    token,
  })
}

export function getProjectById(token: string, projectId: string) {
  return apiRequest<ProjectResponse>(`/projects/${projectId}`, {
    token,
  })
}

export function createProject(token: string, payload: CreateProjectRequest) {
  return apiRequest<ProjectResponse>('/projects', {
    method: 'POST',
    token,
    body: payload,
  })
}

export function getProjectTasks(
  token: string,
  projectId: string,
  query: Partial<GetTasksQuery> = {},
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
