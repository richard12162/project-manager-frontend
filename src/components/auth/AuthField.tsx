import type { InputHTMLAttributes } from 'react'

type AuthFieldProps = {
  label: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

export function AuthField({ label, error, id, ...inputProps }: AuthFieldProps) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
