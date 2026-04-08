import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <section className="auth-card">
      <div className="auth-card__header">
        <p className="section-eyebrow">Anmelden</p>
        <h1>Willkommen zurueck</h1>
        <p>
          Melde dich an, um direkt in deine Projektliste und offenen Aufgaben zu
          wechseln.
        </p>
      </div>

      <form className="form-stack">
        <div className="field">
          <label htmlFor="login-email">E-Mail</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@firma.de"
          />
        </div>

        <div className="field">
          <label htmlFor="login-password">Passwort</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Passwort eingeben"
          />
        </div>

        <button className="button button--primary" type="submit">
          Einloggen
        </button>
      </form>

      <p className="auth-card__footer">
        Noch kein Konto?{' '}
        <Link className="inline-link" to="/register">
          Registrieren
        </Link>
      </p>
    </section>
  )
}
