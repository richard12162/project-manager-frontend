import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import { AuthCardShell } from '../../components/auth/AuthCardShell'
import { AuthField } from '../../components/auth/AuthField'
import {
  type FieldErrors,
  type LoginFormValues,
  validateLoginForm,
} from '../../features/auth/forms'
import { useAuth } from '../../hooks/useAuth'

const EMPTY_LOGIN_VALUES: LoginFormValues = {
  email: '',
  password: '',
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [values, setValues] = useState<LoginFormValues>(EMPTY_LOGIN_VALUES)
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
      setSubmitError(
        getErrorMessage(error, 'Der Login ist fehlgeschlagen. Bitte versuche es erneut.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCardShell
      eyebrow="Anmelden"
      title="Willkommen zurück"
      description="Melde dich an, um auf deine Projekte und Aufgaben zuzugreifen."
      footerText="Noch kein Konto?"
      footerLinkLabel="Registrieren"
      footerLinkTo="/register"
    >
      <form className="form-stack" noValidate onSubmit={handleSubmit}>
        <AuthField
          id="login-email"
          label="E-Mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@firma.de"
          value={values.email}
          onChange={(event) => handleChange('email', event.target.value)}
          error={errors.email}
        />

        <AuthField
          id="login-password"
          label="Passwort"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Passwort eingeben"
          value={values.password}
          onChange={(event) => handleChange('password', event.target.value)}
          error={errors.password}
        />

        {submitError ? (
          <div className="form-feedback form-feedback--error" role="alert">
            {submitError}
          </div>
        ) : null}

        <div className="auth-card__actions">
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Melde an...' : 'Einloggen'}
          </button>
        </div>
      </form>
    </AuthCardShell>
  )
}
