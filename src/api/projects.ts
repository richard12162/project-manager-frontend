import { apiRequest } from './client'
import type { components } from '../types/api'

export type CreateProjectRequest = components['schemas']['CreateProjectRequest']
export type ProjectResponse = components['schemas']['ProjectResponse']

export function getMyProjects(token: string) {
  return apiRequest<ProjectResponse[]>('/projects', {
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
