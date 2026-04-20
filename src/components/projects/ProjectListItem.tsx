import { Link } from 'react-router-dom'
import type { ProjectResponse } from '../../api/projects'
import { formatDateTime } from '../../utils/date'

type ProjectListItemProps = {
  project: ProjectResponse
}

export function ProjectListItem({ project }: ProjectListItemProps) {
  return (
    <article className="project-card">
      <div className="project-card__header">
        <div>
          <h2>{project.name ?? 'Unbenanntes Projekt'}</h2>
          <p>{project.description?.trim() || 'Keine Beschreibung hinterlegt.'}</p>
        </div>
        <span className="project-card__owner">{project.ownerEmail ?? 'Kein Owner'}</span>
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
          <Link className="button button--ghost" to={`/projects/${project.id}/tasks`}>
            Projekt öffnen
          </Link>
        </div>
      ) : null}
    </article>
  )
}
