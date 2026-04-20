import { apiRequest } from './client'
import type { components } from '../types/api'

export type CreateProjectRequest = components['schemas']['CreateProjectRequest']
export type ProjectResponse = components['schemas']['ProjectResponse']
export type ProjectMemberResponse = components['schemas']['ProjectMemberResponse']
export type AddProjectMemberRequest = components['schemas']['AddProjectMemberRequest']
export type ActivityLogResponse = components['schemas']['ActivityLogResponse']

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

export function getProjectMembers(token: string, projectId: string) {
  return apiRequest<ProjectMemberResponse[]>(`/projects/${projectId}/members`, {
    token,
  })
}

export function addProjectMember(
  token: string,
  projectId: string,
  payload: AddProjectMemberRequest,
) {
  return apiRequest<ProjectMemberResponse>(`/projects/${projectId}/members`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export function getProjectActivity(token: string, projectId: string) {
  return apiRequest<ActivityLogResponse[]>(`/projects/${projectId}/activity`, {
    token,
  })
}
