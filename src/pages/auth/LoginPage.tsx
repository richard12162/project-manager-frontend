import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  type FieldErrors,
  type LoginFormValues,
  validateLoginForm,
} from '../../features/auth/forms'

export function LoginPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FieldErrors<LoginFormValues>>({})

  function handleChange(field: keyof LoginFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => {
      if (!current[field]) {
        return current
      }

      const nextErrors = validateLoginForm({
        ...values,
        [field]: value,
      })

      return {
        ...current,
        [field]: nextErrors[field],
      }
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    navigate('/projects')
  }

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

      <form className="form-stack" noValidate onSubmit={handleSubmit}>
        <div className={`field${errors.email ? ' field--invalid' : ''}`}>
          <label htmlFor="login-email">E-Mail</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@firma.de"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : 'login-email-hint'}
          />
          <span className="field__hint" id="login-email-hint">
            Nutze die Adresse, mit der du im Team-Workspace registriert bist.
          </span>
          {errors.email ? (
            <span className="field__error" id="login-email-error" role="alert">
              {errors.email}
            </span>
          ) : null}
        </div>

        <div className={`field${errors.password ? ' field--invalid' : ''}`}>
          <label htmlFor="login-password">Passwort</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Passwort eingeben"
            value={values.password}
            onChange={(event) => handleChange('password', event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'login-password-error' : 'login-password-hint'
            }
          />
          <span className="field__hint" id="login-password-hint">
            Im naechsten Commit wird dieses Formular direkt an `/auth/login` angebunden.
          </span>
          {errors.password ? (
            <span className="field__error" id="login-password-error" role="alert">
              {errors.password}
            </span>
          ) : null}
        </div>

        <div className="auth-card__actions">
          <button className="button button--primary" type="submit">
            Einloggen
          </button>
          <p className="auth-note">
            Nach erfolgreicher Validierung geht es direkt in die Projektansicht.
          </p>
        </div>
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
