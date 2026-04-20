import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthCardShellProps = {
  eyebrow: string
  title: string
  description: string
  footerText: string
  footerLinkLabel: string
  footerLinkTo: string
  children: ReactNode
}

export function AuthCardShell({
  eyebrow,
  title,
  description,
  footerText,
  footerLinkLabel,
  footerLinkTo,
  children,
}: AuthCardShellProps) {
  return (
    <section className="auth-card">
      <div className="auth-card__header">
        <p className="section-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {children}

      <p className="auth-card__footer">
        {footerText}{' '}
        <Link className="inline-link" to={footerLinkTo}>
          {footerLinkLabel}
        </Link>
      </p>
    </section>
  )
}
