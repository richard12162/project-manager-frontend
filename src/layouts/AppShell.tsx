import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { AppHeader } from '../components/navigation/AppHeader'

export function AppShell() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page-section">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function ShellNavLink({
  to,
  children,
}: {
  to: string
  children: ReactNode
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? 'nav-link nav-link--active' : 'nav-link'
      }
    >
      {children}
    </NavLink>
  )
}
