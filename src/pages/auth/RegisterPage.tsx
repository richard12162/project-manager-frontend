import { Link } from 'react-router-dom'

export function RegisterPage() {
  return (
    <section className="auth-card">
      <div className="auth-card__header">
        <p className="section-eyebrow">Registrieren</p>
        <h1>Workspace einrichten</h1>
        <p>
          Lege deinen Zugang an und starte direkt mit Projekten, Aufgaben und
          Teamkommunikation.
        </p>
      </div>

      <form className="form-stack">
        <div className="field">
          <label htmlFor="register-email">E-Mail</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@firma.de"
          />
        </div>

        <div className="field">
          <label htmlFor="register-password">Passwort</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Sicheres Passwort"
          />
        </div>

        <button className="button button--primary" type="submit">
          Konto erstellen
        </button>
      </form>

      <p className="auth-card__footer">
        Bereits registriert?{' '}
        <Link className="inline-link" to="/login">
          Zum Login
        </Link>
      </p>
    </section>
  )
}
