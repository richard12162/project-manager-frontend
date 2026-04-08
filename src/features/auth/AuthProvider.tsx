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
  const [token, setToken] = useState<string | null>(getStoredAuthToken())
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    const sessionToken = token
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

    const user = await getCurrentUser(auth.token)
    setCurrentUser(user)
  }

  async function register(payload: RegisterRequest) {
    await registerUser(payload)
    await login(payload)
  }

  function logout() {
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
