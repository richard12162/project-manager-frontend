import { useNavigate } from 'react-router-dom'
import { ShellNavLink } from '../../layouts/AppShell'
import { useAuth } from '../../hooks/useAuth'

export function AppHeader() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <div className="brand" aria-label="Task manager">
          <div className="brand__mark">PM</div>
          <div className="brand__meta">
            <span className="brand__title">Project Manager</span>
            <span className="brand__subtitle">Team workspace</span>
          </div>
        </div>

        <nav className="topbar__nav" aria-label="Hauptnavigation">
          <ShellNavLink to="/projects">Projekte</ShellNavLink>
          {currentUser?.email ? (
            <span className="topbar__user" title={currentUser.email}>
              {currentUser.email}
            </span>
          ) : null}
          <button className="button button--ghost" type="button" onClick={handleLogout}>
            Abmelden
          </button>
        </nav>
      </div>
    </header>
  )
}
