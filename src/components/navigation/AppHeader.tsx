import { ShellNavLink } from '../../layouts/AppShell'

export function AppHeader() {
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
          <ShellNavLink to="/projects">Projects</ShellNavLink>
          <ShellNavLink to="/login">Login</ShellNavLink>
          <ShellNavLink to="/register">Register</ShellNavLink>
        </nav>
      </div>
    </header>
  )
}
