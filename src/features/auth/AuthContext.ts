import { createContext } from 'react'
import type {
  CurrentUserResponse,
  LoginRequest,
  RegisterRequest,
} from '../../api/auth'

export type AuthContextValue = {
  currentUser: CurrentUserResponse | null
  token: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
