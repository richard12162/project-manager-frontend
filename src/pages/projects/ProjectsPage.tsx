import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  createProject,
  getMyProjects,
  type CreateProjectRequest,
  type ProjectResponse,
} from '../../api/projects'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/date'

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
          <p className="section-eyebrow">Projects</p>
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
          {isCreateOpen ? 'Formular schliessen' : 'Neues Projekt'}
        </button>
      </div>

      <div className="projects-layout">
        <aside className="projects-sidebar">
          <div className="projects-sidebar__section">
            <h2>Neues Projekt</h2>
            <p>
              Lege direkt von hier ein Projekt an und starte danach mit Tasks,
              Team und Aktivitaeten.
            </p>

            {isCreateOpen ? (
              <form className="form-stack" noValidate onSubmit={handleCreateSubmit}>
                <div className={`field${createErrors.name ? ' field--invalid' : ''}`}>
                  <label htmlFor="project-name">Projektname</label>
                  <input
                    id="project-name"
                    name="name"
                    type="text"
                    placeholder="z. B. Website Relaunch"
                    value={createValues.name}
                    onChange={(event) =>
                      handleCreateChange('name', event.target.value)
                    }
                    aria-invalid={Boolean(createErrors.name)}
                  />
                  {createErrors.name ? (
                    <span className="field__error" role="alert">
                      {createErrors.name}
                    </span>
                  ) : null}
                </div>

                <div
                  className={`field${createErrors.description ? ' field--invalid' : ''}`}
                >
                  <label htmlFor="project-description">Beschreibung</label>
                  <textarea
                    id="project-description"
                    name="description"
                    rows={4}
                    placeholder="Kurz beschreiben, worum es in diesem Projekt geht."
                    value={createValues.description ?? ''}
                    onChange={(event) =>
                      handleCreateChange('description', event.target.value)
                    }
                    aria-invalid={Boolean(createErrors.description)}
                  />
                  <span className="field__hint">
                    Optional, aber hilfreich fuer den ersten gemeinsamen Kontext.
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
                    onClick={() => {
                      setIsCreateOpen(false)
                      setCreateError(null)
                      setCreateErrors({})
                    }}
                    disabled={isCreating}
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="button button--secondary project-create-trigger"
                type="button"
                onClick={() => setIsCreateOpen(true)}
              >
                Projekt anlegen
              </button>
            )}
          </div>

          <div className="projects-sidebar__section">
            <h2>Uebersicht</h2>
            <p>Dein Arbeitsbereich startet direkt mit der echten Projektliste.</p>
          </div>

          <div className="projects-sidebar__section">
            <h2>Status</h2>
            <dl className="project-stats">
              <div>
                <dt>Projekte</dt>
                <dd>{projects.length}</dd>
              </div>
              <div>
                <dt>Ansicht</dt>
                <dd>{isLoading ? 'Laedt' : error ? 'Fehler' : 'Bereit'}</dd>
              </div>
              <div>
                <dt>Erstellung</dt>
                <dd>{isCreating ? 'Sendet' : isCreateOpen ? 'Offen' : 'Bereit'}</dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="projects-content">
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
                <article className="project-card" key={project.id ?? project.name}>
                  <div className="project-card__header">
                    <div>
                      <h2>{project.name ?? 'Unbenanntes Projekt'}</h2>
                      <p>{project.description?.trim() || 'Keine Beschreibung hinterlegt.'}</p>
                    </div>
                    <span className="project-card__owner">
                      {project.ownerEmail ?? 'Kein Owner'}
                    </span>
                  </div>

                  <dl className="project-card__meta">
                    <div>
                      <dt>Erstellt</dt>
                      <dd>{formatDateTime(project.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Zuletzt aktualisiert</dt>
                      <dd>{formatDateTime(project.updatedAt)}</dd>
                    </div>
                  </dl>

                  {project.id ? (
                    <div className="project-card__actions">
                      <Link
                        className="button button--ghost"
                        to={`/projects/${project.id}/tasks`}
                      >
                        Projekt oeffnen
                      </Link>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
