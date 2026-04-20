import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../../api/client'
import {
  createProject,
  getMyProjects,
  type CreateProjectRequest,
  type ProjectResponse,
} from '../../api/projects'
import { ProjectCreateForm } from '../../components/projects/ProjectCreateForm'
import { ProjectListItem } from '../../components/projects/ProjectListItem'
import { useAuth } from '../../hooks/useAuth'

const EMPTY_CREATE_VALUES: CreateProjectRequest = {
  name: '',
  description: '',
}

export function ProjectsPage() {
  const { token, currentUser } = useAuth()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Create form state stays in the page because the result updates the list directly.
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createValues, setCreateValues] = useState<CreateProjectRequest>(EMPTY_CREATE_VALUES)
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof CreateProjectRequest, string>>>({})
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!token) {
      return
    }

    // The same loader is reused for the initial load and the retry action.
    setIsLoading(true)
    setError(null)

    try {
      const nextProjects = await getMyProjects(token)
      setProjects(nextProjects)
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Die Projekte konnten nicht geladen werden.'))
    } finally {
      setIsLoading(false)
    }
  }, [token])

  function closeCreateForm() {
    setIsCreateOpen(false)
    setCreateError(null)
    setCreateErrors({})
  }

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  function handleRetry() {
    void loadProjects()
  }

  function handleCreateChange(
    field: keyof CreateProjectRequest,
    value: string,
  ) {
    // Field-level errors are cleared as soon as the user edits the affected input.
    setCreateError(null)
    setCreateValues((current) => ({
      ...current,
      [field]: value,
    }))

    setCreateErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
  }

  function validateCreateForm(values: CreateProjectRequest) {
    const nextErrors: Partial<Record<keyof CreateProjectRequest, string>> = {}

    // Validation stays local to this page because it only belongs to this form.
    if (!values.name.trim()) {
      nextErrors.name = 'Bitte gib einen Projektnamen ein.'
    } else if (values.name.trim().length < 3) {
      nextErrors.name = 'Der Projektname sollte mindestens 3 Zeichen lang sein.'
    }

    if (values.description && values.description.length > 500) {
      nextErrors.description =
        'Die Beschreibung darf hoechstens 500 Zeichen lang sein.'
    }

    return nextErrors
  }

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      return
    }

    const payload: CreateProjectRequest = {
      name: createValues.name.trim(),
      description: createValues.description?.trim() || undefined,
    }

    const nextErrors = validateCreateForm(payload)
    setCreateErrors(nextErrors)
    setCreateError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    try {
      setIsCreating(true)
      const createdProject = await createProject(token, payload)
      // New projects are inserted locally so the page does not need a full reload.
      setProjects((current) => [createdProject, ...current])
      setCreateValues(EMPTY_CREATE_VALUES)
      setCreateErrors({})
      closeCreateForm()
    } catch (submissionError) {
      setCreateError(
        getErrorMessage(submissionError, 'Das Projekt konnte nicht erstellt werden.'),
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="content-card">
      <div className="content-card__header split-header">
        <div>
          <p className="section-eyebrow">Projekte</p>
          <h1>Projektarbeitsbereich</h1>
          <p>
            {currentUser?.email
              ? `Angemeldet als ${currentUser.email}. Hier findest du alle Projekte, auf die du Zugriff hast.`
              : 'Hier findest du alle Projekte, auf die du Zugriff hast.'}
          </p>
        </div>

        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            setIsCreateOpen((current) => !current)
            setCreateError(null)
          }}
        >
          {isCreateOpen ? 'Abbrechen' : 'Neues Projekt'}
        </button>
      </div>

      <div className="projects-layout">
        <div className="projects-content">
          {/* The create form is rendered inline so list and form stay in one flow. */}
          {isCreateOpen ? (
            <ProjectCreateForm
              createValues={createValues}
              createErrors={createErrors}
              createError={createError}
              isCreating={isCreating}
              onSubmit={handleCreateSubmit}
              onChange={handleCreateChange}
              onCancel={closeCreateForm}
            />
          ) : null}

          {isLoading ? (
            <div className="projects-state">
              <h2>Projekte werden geladen</h2>
              <p>Wir holen gerade deine aktuellen Projekte aus dem Backend.</p>
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="projects-state projects-state--error">
              <h2>Projekte konnten nicht geladen werden</h2>
              <p>{error}</p>
              <button className="button button--secondary" type="button" onClick={handleRetry}>
                Erneut versuchen
              </button>
            </div>
          ) : null}

          {!isLoading && !error && projects.length === 0 ? (
            <div className="projects-state">
              <h2>Noch keine Projekte vorhanden</h2>
              <p>
                Sobald dein Team ein erstes Projekt anlegt, erscheint es hier als
                Startpunkt fuer Tasks, Mitglieder und Aktivitaeten.
              </p>
            </div>
          ) : null}

          {!isLoading && !error && projects.length > 0 ? (
            <div className="project-list" aria-label="Projektliste">
              {projects.map((project) => (
                <ProjectListItem key={project.id ?? project.name} project={project} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
