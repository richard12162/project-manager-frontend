import type { FormEvent } from 'react'
import type { CreateProjectRequest } from '../../api/projects'

type ProjectCreateFormProps = {
  createValues: CreateProjectRequest
  createErrors: Partial<Record<keyof CreateProjectRequest, string>>
  createError: string | null
  isCreating: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onChange: (field: keyof CreateProjectRequest, value: string) => void
  onCancel: () => void
}

export function ProjectCreateForm({
  createValues,
  createErrors,
  createError,
  isCreating,
  onSubmit,
  onChange,
  onCancel,
}: ProjectCreateFormProps) {
  return (
    <form className="project-create-form" noValidate onSubmit={onSubmit}>
      <div className={`field${createErrors.name ? ' field--invalid' : ''}`}>
        <label htmlFor="project-name">Projektname</label>
        <input
          id="project-name"
          name="name"
          type="text"
          placeholder="z. B. Website Relaunch"
          value={createValues.name}
          onChange={(event) => onChange('name', event.target.value)}
          aria-invalid={Boolean(createErrors.name)}
        />
        {createErrors.name ? (
          <span className="field__error" role="alert">
            {createErrors.name}
          </span>
        ) : null}
      </div>

      <div className={`field${createErrors.description ? ' field--invalid' : ''}`}>
        <label htmlFor="project-description">Beschreibung</label>
        <textarea
          id="project-description"
          name="description"
          rows={4}
          placeholder="Kurz beschreiben, worum es in diesem Projekt geht."
          value={createValues.description ?? ''}
          onChange={(event) => onChange('description', event.target.value)}
          aria-invalid={Boolean(createErrors.description)}
        />
        <span className="field__hint">
          Optional, aber hilfreich für den ersten gemeinsamen Kontext.
        </span>
        {createErrors.description ? (
          <span className="field__error" role="alert">
            {createErrors.description}
          </span>
        ) : null}
      </div>

      {createError ? (
        <div className="form-feedback form-feedback--error" role="alert">
          {createError}
        </div>
      ) : null}

      <div className="project-create-actions">
        <button className="button button--primary" type="submit" disabled={isCreating}>
          {isCreating ? 'Erstelle Projekt...' : 'Projekt erstellen'}
        </button>
        <button
          className="button button--ghost"
          type="button"
          onClick={onCancel}
          disabled={isCreating}
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
