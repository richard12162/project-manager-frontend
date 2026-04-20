import type { FormEvent } from 'react'
import {
  TASK_FORM_PRIORITY_OPTIONS,
  type TaskFormErrors,
  type TaskFormValues,
} from './taskOptions'

type ProjectTaskFormProps = {
  isEditing: boolean
  formValues: TaskFormValues
  formErrors: TaskFormErrors
  formError: string | null
  isSubmitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onChange: (field: keyof TaskFormValues, value: string) => void
  onCancel: () => void
}

export function ProjectTaskForm({
  isEditing,
  formValues,
  formErrors,
  formError,
  isSubmitting,
  onSubmit,
  onChange,
  onCancel,
}: ProjectTaskFormProps) {
  return (
    <form className="task-form" noValidate onSubmit={onSubmit}>
      <div className={`field${formErrors.title ? ' field--invalid' : ''}`}>
        <label htmlFor="task-title">Titel</label>
        <input
          id="task-title"
          name="title"
          type="text"
          placeholder="z. B. Kickoff mit dem Team vorbereiten"
          value={formValues.title}
          onChange={(event) => onChange('title', event.target.value)}
          aria-invalid={Boolean(formErrors.title)}
        />
        {formErrors.title ? (
          <span className="field__error" role="alert">
            {formErrors.title}
          </span>
        ) : null}
      </div>

      <div className="task-form__grid">
        <div className="field">
          <label htmlFor="task-priority">Priorität</label>
          <select
            id="task-priority"
            name="priority"
            value={formValues.priority}
            onChange={(event) => onChange('priority', event.target.value)}
          >
            {TASK_FORM_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-due-date">Fälligkeit</label>
          <input
            id="task-due-date"
            name="dueDate"
            type="datetime-local"
            value={formValues.dueDate}
            onChange={(event) => onChange('dueDate', event.target.value)}
          />
        </div>
      </div>

      <div className={`field${formErrors.description ? ' field--invalid' : ''}`}>
        <label htmlFor="task-description">Beschreibung</label>
        <textarea
          id="task-description"
          name="description"
          rows={5}
          placeholder="Ergänze Details, Kontext und das erwartete Ergebnis."
          value={formValues.description}
          onChange={(event) => onChange('description', event.target.value)}
          aria-invalid={Boolean(formErrors.description)}
        />
        <span className="field__hint">
          Status und Zuweisung können direkt in der Liste angepasst werden.
        </span>
        {formErrors.description ? (
          <span className="field__error" role="alert">
            {formErrors.description}
          </span>
        ) : null}
      </div>

      {formError ? (
        <div className="form-feedback form-feedback--error" role="alert">
          {formError}
        </div>
      ) : null}

      <div className="task-form__actions">
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEditing
              ? 'Speichere Aufgabe...'
              : 'Erstelle Aufgabe...'
            : isEditing
              ? 'Aufgabe speichern'
              : 'Aufgabe erstellen'}
        </button>
        <button
          className="button button--ghost"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
