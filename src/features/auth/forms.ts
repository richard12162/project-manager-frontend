import type { components } from '../../types/api'

export type LoginFormValues = components['schemas']['LoginRequest']

export type RegisterFormValues = components['schemas']['RegisterRequest'] & {
  confirmPassword: string
}

export type FieldErrors<TFormValues extends Record<string, string>> = Partial<
  Record<keyof TFormValues, string>
>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginForm(
  values: LoginFormValues,
): FieldErrors<LoginFormValues> {
  const errors: FieldErrors<LoginFormValues> = {}

  if (!values.email.trim()) {
    errors.email = 'Bitte gib deine E-Mail-Adresse ein.'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Bitte gib eine gueltige E-Mail-Adresse ein.'
  }

  if (!values.password) {
    errors.password = 'Bitte gib dein Passwort ein.'
  }

  return errors
}

export function validateRegisterForm(
  values: RegisterFormValues,
): FieldErrors<RegisterFormValues> {
  const errors: FieldErrors<RegisterFormValues> = {}

  if (!values.email.trim()) {
    errors.email = 'Bitte gib deine E-Mail-Adresse ein.'
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Bitte gib eine gueltige E-Mail-Adresse ein.'
  }

  if (!values.password) {
    errors.password = 'Bitte erstelle ein Passwort.'
  } else if (values.password.length < 8) {
    errors.password = 'Das Passwort muss mindestens 8 Zeichen lang sein.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Bitte bestaetige dein Passwort.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Die Passwoerter stimmen nicht ueberein.'
  }

  return errors
}
