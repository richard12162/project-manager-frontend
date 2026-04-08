import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { getMyProjects, type ProjectResponse } from '../../api/projects'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/date'

export function ProjectsPage() {
  const { token, currentUser } = useAuth()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        <button className="button button--secondary" type="button" disabled>
          Neues Projekt
        </button>
      </div>

      <div className="projects-layout">
        <aside className="projects-sidebar">
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
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
