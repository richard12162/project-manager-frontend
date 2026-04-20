import type { ReactNode } from 'react'
import { startTransition, useEffect, useState } from 'react'
import {
  getCurrentUser,
  loginUser,
  registerUser,
  type CurrentUserResponse,
  type LoginRequest,
  type RegisterRequest,
} from '../../api/auth'
import { ApiError } from '../../api/client'
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  storeAuthToken,
} from './auth-storage'
import { AuthContext } from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Auth state is kept here so routing and pages can stay mostly unaware of
  // token persistence and session bootstrap details.
  const [token, setToken] = useState<string | null>(getStoredAuthToken())
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    const sessionToken = token
    // Prevents stale requests from updating state after logout or token changes.
    let cancelled = false

    async function bootstrapSession() {
      setIsBootstrapping(true)

      try {
        const user = await getCurrentUser(sessionToken)

        if (cancelled) {
          return
        }

        startTransition(() => {
          setCurrentUser(user)
        })
      } catch {
        if (cancelled) {
          return
        }

        // An invalid or expired token should clear the persisted session immediately.
        clearStoredAuthToken()
        setToken(null)
        setCurrentUser(null)
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [token])

  async function login(payload: LoginRequest) {
    const auth = await loginUser(payload)

    if (!auth.token) {
      throw new ApiError('Der Login hat kein gueltiges Token geliefert.', 500)
    }

    storeAuthToken(auth.token)
    setToken(auth.token)

    // Load the user profile immediately after login so the app does not have to
    // wait for the bootstrap effect.
    const user = await getCurrentUser(auth.token)
    setCurrentUser(user)
  }

  async function register(payload: RegisterRequest) {
    await registerUser(payload)
    await login(payload)
  }

  function logout() {
    // Logout is purely local because the backend uses stateless JWT authentication.
    clearStoredAuthToken()
    setToken(null)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: Boolean(token && currentUser),
        isBootstrapping,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
