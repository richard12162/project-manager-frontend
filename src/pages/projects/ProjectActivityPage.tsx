import { useOutletContext } from 'react-router-dom'
import type { ProjectResponse } from '../../api/projects'

export function ProjectActivityPage() {
  const { project } = useOutletContext<{ project: ProjectResponse }>()

  return (
    <section className="content-card">
      <div className="content-card__header">
        <p className="section-eyebrow">Activity</p>
        <h1>Projektaktivitaet</h1>
        <p>
          Die Aktivitaetsflaeche fuer {project.name ?? 'dieses Projekt'} ist als eigener
          Bereich bereits eingebunden.
        </p>
      </div>

      <div className="detail-empty-state">
        <h2>Aktivitaetsfeed folgt spaeter</h2>
        <p>
          Hier werden Aenderungen an Tasks, Kommentaren und Teamaktionen zeitlich
          nachvollziehbar zusammenlaufen.
        </p>
      </div>
    </section>
  )
}
