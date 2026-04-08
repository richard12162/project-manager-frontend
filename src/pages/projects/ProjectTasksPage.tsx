import { useOutletContext } from 'react-router-dom'
import type { ProjectResponse } from '../../api/projects'

export function ProjectTasksPage() {
  const { project } = useOutletContext<{ project: ProjectResponse }>()

  return (
    <section className="content-card">
      <div className="content-card__header">
        <p className="section-eyebrow">Tasks</p>
        <h1>Aufgabenbereich</h1>
        <p>
          Hier entsteht als naechstes die Aufgabenliste fuer {project.name ?? 'dieses Projekt'}.
          Der Screen ist bereits als echter Arbeitsbereich vorbereitet.
        </p>
      </div>

      <div className="detail-empty-state">
        <h2>Tasks folgen im naechsten Schritt</h2>
        <p>
          In diesem Bereich kommen Liste, Filter, Status und Task-Erstellung direkt
          in den Projektkontext.
        </p>
      </div>
    </section>
  )
}
