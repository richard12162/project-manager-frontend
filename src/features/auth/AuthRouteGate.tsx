import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <AuthScreenState message="Sitzung wird geladen..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <AuthScreenState message="Sitzung wird geladen..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/projects" replace />
  }

  return <Outlet />
}

function AuthScreenState({ message }: { message: string }) {
  return (
    <main className="auth-layout">
      <div className="container auth-layout__state">
        <section className="auth-card auth-card--status">
          <div className="auth-card__header">
            <p className="section-eyebrow">Authentifizierung</p>
            <h1>Arbeitsbereich wird vorbereitet</h1>
            <p>{message}</p>
          </div>
        </section>
      </div>
    </main>
  )
}
