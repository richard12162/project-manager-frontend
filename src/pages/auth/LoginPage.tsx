import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  type FieldErrors,
  type LoginFormValues,
  validateLoginForm,
} from '../../features/auth/forms'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FieldErrors<LoginFormValues>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: keyof LoginFormValues, value: string) {
    setSubmitError(null)
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)
    setSubmitError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)
      await login(values)
      navigate('/projects')
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message)
      } else {
        setSubmitError('Der Login ist fehlgeschlagen. Bitte versuche es erneut.')
      }
    } finally {
      setIsSubmitting(false)
    }
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
            Dein Zugang wird gegen das Backend authentifiziert und danach direkt geladen.
          </span>
          {errors.password ? (
            <span className="field__error" id="login-password-error" role="alert">
              {errors.password}
            </span>
          ) : null}
        </div>

        {submitError ? (
          <div className="form-feedback form-feedback--error" role="alert">
            {submitError}
          </div>
        ) : null}

        <div className="auth-card__actions">
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Melde an...' : 'Einloggen'}
          </button>
          <p className="auth-note">
            Nach erfolgreichem Login laden wir dein Profil und leiten in die Projekte weiter.
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
