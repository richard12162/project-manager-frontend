import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  type FieldErrors,
  type RegisterFormValues,
  validateRegisterForm,
} from '../../features/auth/forms'

export function RegisterPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<RegisterFormValues>({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FieldErrors<RegisterFormValues>>({})

  function handleChange(field: keyof RegisterFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => {
      if (!current[field] && field !== 'password') {
        return current
      }

      const nextErrors = validateRegisterForm({
        ...values,
        [field]: value,
      })

      return {
        ...current,
        password: nextErrors.password,
        confirmPassword: nextErrors.confirmPassword,
        ...(field === 'email' ? { email: nextErrors.email } : {}),
      }
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateRegisterForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    navigate('/projects')
  }

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

      <form className="form-stack" noValidate onSubmit={handleSubmit}>
        <div className={`field${errors.email ? ' field--invalid' : ''}`}>
          <label htmlFor="register-email">E-Mail</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@firma.de"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? 'register-email-error' : 'register-email-hint'
            }
          />
          <span className="field__hint" id="register-email-hint">
            Diese Adresse wird spaeter fuer Login, Kommentare und Zuweisungen genutzt.
          </span>
          {errors.email ? (
            <span className="field__error" id="register-email-error" role="alert">
              {errors.email}
            </span>
          ) : null}
        </div>

        <div className="auth-password-grid">
          <div className={`field${errors.password ? ' field--invalid' : ''}`}>
          <label htmlFor="register-password">Passwort</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Sicheres Passwort"
            value={values.password}
            onChange={(event) => handleChange('password', event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'register-password-error' : 'register-password-hint'
            }
          />
            <span className="field__hint" id="register-password-hint">
              Mindestens 8 Zeichen fuer den ersten produktiven Zugriff.
            </span>
            {errors.password ? (
              <span className="field__error" id="register-password-error" role="alert">
                {errors.password}
              </span>
            ) : null}
          </div>

          <div
            className={`field${errors.confirmPassword ? ' field--invalid' : ''}`}
          >
            <label htmlFor="register-confirm-password">Passwort bestaetigen</label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Passwort wiederholen"
              value={values.confirmPassword}
              onChange={(event) =>
                handleChange('confirmPassword', event.target.value)
              }
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword
                  ? 'register-confirm-password-error'
                  : 'register-confirm-password-hint'
              }
            />
            <span className="field__hint" id="register-confirm-password-hint">
              So vermeiden wir Tippfehler, bevor die API-Anbindung folgt.
            </span>
            {errors.confirmPassword ? (
              <span
                className="field__error"
                id="register-confirm-password-error"
                role="alert"
              >
                {errors.confirmPassword}
              </span>
            ) : null}
          </div>
        </div>

        <div className="auth-card__actions">
          <button className="button button--primary" type="submit">
            Konto erstellen
          </button>
          <p className="auth-note">
            Nach erfolgreicher Validierung fuehren wir direkt in die Produktflaeche.
          </p>
        </div>
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
