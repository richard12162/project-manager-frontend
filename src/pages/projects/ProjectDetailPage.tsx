import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import { getProjectById, type ProjectResponse } from '../../api/projects'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/date'

export function ProjectDetailPage() {
  const { token } = useAuth()
  const { projectId } = useParams()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    if (!token || !projectId) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const nextProject = await getProjectById(token, projectId)
      setProject(nextProject)
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Das Projekt konnte nicht geladen werden.'))
    } finally {
      setIsLoading(false)
    }
  }, [projectId, token])

  useEffect(() => {
    void loadProject()
  }, [loadProject])

  function handleRetry() {
    void loadProject()
  }

  if (isLoading) {
    return (
      <section className="content-card">
        <div className="projects-state">
          <h1>Projekt wird geladen</h1>
          <p>Wir holen gerade die Projektdetails und bereiten die Arbeitsflaeche vor.</p>
        </div>
      </section>
    )
  }

  if (error || !project) {
    return (
      <section className="content-card">
        <div className="projects-state projects-state--error">
          <h1>Projekt konnte nicht geladen werden</h1>
          <p>{error ?? 'Das angeforderte Projekt ist nicht verfuegbar.'}</p>
          <button className="button button--secondary" type="button" onClick={handleRetry}>
            Erneut versuchen
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="project-detail">
      <div className="content-card project-detail__header">
        <div className="project-detail__title">
          <p className="section-eyebrow">Projekt-Details</p>
          <h1>{project.name ?? 'Unbenanntes Projekt'}</h1>
          <p>{project.description?.trim() || 'Keine Projektbeschreibung hinterlegt.'}</p>
        </div>

        <div className="project-detail__summary">
          <div className="project-detail__pill">{project.ownerEmail ?? 'Kein Owner'}</div>
          <dl className="project-card__meta">
            <div>
              <dt>Erstellt</dt>
              <dd>{formatDateTime(project.createdAt)}</dd>
            </div>
            <div>
              <dt>Aktualisiert</dt>
              <dd>{formatDateTime(project.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="project-detail__tabs" role="tablist" aria-label="Projektbereiche">
        <ProjectTabLink to="tasks">Aufgaben</ProjectTabLink>
        <ProjectTabLink to="members">Mitglieder</ProjectTabLink>
        <ProjectTabLink to="activity">Aktivität</ProjectTabLink>
      </div>

      <Outlet context={{ project }} />
    </section>
  )
}

function ProjectTabLink({
  to,
  children,
}: {
  to: string
  children: string
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        isActive ? 'project-tab project-tab--active' : 'project-tab'
      }
    >
      {children}
    </NavLink>
  )
}
