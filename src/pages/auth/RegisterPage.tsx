import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  type FieldErrors,
  type RegisterFormValues,
  validateRegisterForm,
} from '../../features/auth/forms'
import { useAuth } from '../../hooks/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [values, setValues] = useState<RegisterFormValues>({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FieldErrors<RegisterFormValues>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field: keyof RegisterFormValues, value: string) {
    setSubmitError(null)
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateRegisterForm(values)
    setErrors(nextErrors)
    setSubmitError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)
      await register({
        email: values.email,
        password: values.password,
      })
      navigate('/projects')
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message)
      } else {
        setSubmitError('Die Registrierung ist fehlgeschlagen. Bitte versuche es erneut.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-card__header">
        <p className="section-eyebrow">Registrieren</p>
        <h1>Workspace einrichten</h1>
        <p>
          Registriere dich, um deine Projekte und Aufgaben zu erstellen und zu verwalten.
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
            aria-describedby={errors.email ? 'register-email-error' : undefined}
          />
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
            aria-describedby={errors.password ? 'register-password-error' : undefined}
          />
            {errors.password ? (
              <span className="field__error" id="register-password-error" role="alert">
                {errors.password}
              </span>
            ) : null}
          </div>

          <div
            className={`field${errors.confirmPassword ? ' field--invalid' : ''}`}
          >
            <label htmlFor="register-confirm-password">Passwort bestätigen</label>
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
              aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            />
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

        {submitError ? (
          <div className="form-feedback form-feedback--error" role="alert">
            {submitError}
          </div>
        ) : null}

        <div className="auth-card__actions">
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Erstelle Konto...' : 'Konto erstellen'}
          </button>
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
