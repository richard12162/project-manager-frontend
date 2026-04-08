import { useOutletContext } from 'react-router-dom'
import type { ProjectResponse } from '../../api/projects'

export function ProjectMembersPage() {
  const { project } = useOutletContext<{ project: ProjectResponse }>()

  return (
    <section className="content-card">
      <div className="content-card__header">
        <p className="section-eyebrow">Members</p>
        <h1>Teamzugriff</h1>
        <p>
          Dieser Bereich wird fuer Mitglieder und Rollen im Projekt {project.name ?? ''} vorbereitet.
        </p>
      </div>

      <div className="detail-empty-state">
        <h2>Mitgliederansicht vorbereitet</h2>
        <p>
          Im spaeteren Flow erscheinen hier Projektmitglieder, Einladungen und
          Zuweisungen fuer Aufgaben.
        </p>
      </div>
    </section>
  )
}
