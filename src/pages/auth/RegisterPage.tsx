import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import { AuthCardShell } from '../../components/auth/AuthCardShell'
import { AuthField } from '../../components/auth/AuthField'
import {
  type FieldErrors,
  type RegisterFormValues,
  validateRegisterForm,
} from '../../features/auth/forms'
import { useAuth } from '../../hooks/useAuth'

const EMPTY_REGISTER_VALUES: RegisterFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [values, setValues] = useState<RegisterFormValues>(EMPTY_REGISTER_VALUES)
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
      setSubmitError(
        getErrorMessage(
          error,
          'Die Registrierung ist fehlgeschlagen. Bitte versuche es erneut.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCardShell
      eyebrow="Registrieren"
      title="Workspace einrichten"
      description="Registriere dich, um deine Projekte und Aufgaben zu erstellen und zu verwalten."
      footerText="Bereits registriert?"
      footerLinkLabel="Zum Login"
      footerLinkTo="/login"
    >
      <form className="form-stack" noValidate onSubmit={handleSubmit}>
        <AuthField
          id="register-email"
          label="E-Mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@firma.de"
          value={values.email}
          onChange={(event) => handleChange('email', event.target.value)}
          error={errors.email}
        />

        <div className="auth-password-grid">
          <AuthField
            id="register-password"
            label="Passwort"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Sicheres Passwort"
            value={values.password}
            onChange={(event) => handleChange('password', event.target.value)}
            error={errors.password}
          />

          <AuthField
            id="register-confirm-password"
            label="Passwort bestätigen"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Passwort wiederholen"
            value={values.confirmPassword}
            onChange={(event) => handleChange('confirmPassword', event.target.value)}
            error={errors.confirmPassword}
          />
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
    </AuthCardShell>
  )
}
