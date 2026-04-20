import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import {
  createProject,
  getMyProjects,
  type CreateProjectRequest,
  type ProjectResponse,
} from '../../api/projects'
import { ProjectCreateForm } from '../../components/projects/ProjectCreateForm'
import { ProjectListItem } from '../../components/projects/ProjectListItem'
import { useAuth } from '../../hooks/useAuth'

export function ProjectsPage() {
  const { token, currentUser } = useAuth()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createValues, setCreateValues] = useState<CreateProjectRequest>({
    name: '',
    description: '',
  })
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof CreateProjectRequest, string>>>({})
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!token) {
      return
    }

    const sessionToken = token
    let cancelled = false

    async function loadProjects() {
      try {
        setIsLoading(true)
        setError(null)

        const nextProjects = await getMyProjects(sessionToken)

        if (cancelled) {
          return
        }

        setProjects(nextProjects)
      } catch (loadError) {
        if (cancelled) {
          return
        }

        if (loadError instanceof ApiError) {
          setError(loadError.message)
        } else {
          setError('Die Projekte konnten nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      cancelled = true
    }
  }, [token])

  function handleRetry() {
    if (!token) {
      return
    }

    const sessionToken = token
    setIsLoading(true)
    setError(null)

    void getMyProjects(sessionToken)
      .then((nextProjects) => {
        setProjects(nextProjects)
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof ApiError) {
          setError(loadError.message)
        } else {
          setError('Die Projekte konnten nicht geladen werden.')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  function handleCreateChange(
    field: keyof CreateProjectRequest,
    value: string,
  ) {
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
      setProjects((current) => [createdProject, ...current])
      setCreateValues({
        name: '',
        description: '',
      })
      setCreateErrors({})
      setIsCreateOpen(false)
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setCreateError(submissionError.message)
      } else {
        setCreateError('Das Projekt konnte nicht erstellt werden.')
      }
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
          {isCreateOpen ? (
            <ProjectCreateForm
              createValues={createValues}
              createErrors={createErrors}
              createError={createError}
              isCreating={isCreating}
              onSubmit={handleCreateSubmit}
              onChange={handleCreateChange}
              onCancel={() => {
                setIsCreateOpen(false)
                setCreateError(null)
                setCreateErrors({})
              }}
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
