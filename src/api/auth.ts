import { apiRequest } from './client'
import type { components } from '../types/api'

export type LoginRequest = components['schemas']['LoginRequest']
export type AuthResponse = components['schemas']['AuthResponse']
export type RegisterRequest = components['schemas']['RegisterRequest']
export type RegisterResponse = components['schemas']['RegisterResponse']
export type CurrentUserResponse = components['schemas']['CurrentUserResponse']

export function loginUser(payload: LoginRequest) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function registerUser(payload: RegisterRequest) {
  return apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export function getCurrentUser(token: string) {
  return apiRequest<CurrentUserResponse>('/auth/me', {
    token,
  })
}
