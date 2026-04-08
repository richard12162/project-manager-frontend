import { apiRequest } from './client'
import type { components } from '../types/api'

export type ProjectResponse = components['schemas']['ProjectResponse']

export function getMyProjects(token: string) {
  return apiRequest<ProjectResponse[]>('/projects', {
    token,
  })
}
