import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  getProjectActivity,
  type ActivityLogResponse,
  type ProjectResponse,
} from '../../api/projects'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/date'

export function ProjectActivityPage() {
  const { token } = useAuth()
  const { project } = useOutletContext<{ project: ProjectResponse }>()
  const [entries, setEntries] = useState<ActivityLogResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !project.id) {
      return
    }

    const sessionToken = token
    const currentProjectId = project.id
    let cancelled = false

    async function loadActivity() {
      try {
        setIsLoading(true)
        setError(null)

        const nextEntries = await getProjectActivity(sessionToken, currentProjectId)

        if (cancelled) {
          return
        }

        setEntries(nextEntries)
      } catch (loadError) {
        if (cancelled) {
          return
        }

        if (loadError instanceof ApiError) {
          setError(loadError.message)
        } else {
          setError('Die Aktivitaet konnte nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadActivity()

    return () => {
      cancelled = true
    }
  }, [project.id, token])

  return (
    <section className="content-card">
      <div className="content-card__header">
        <p className="section-eyebrow">Activity</p>
        <h1>Projektaktivitaet</h1>
        <p>
          Verlauf aller nachvollziehbaren Aenderungen im Projekt {project.name ?? 'dieses Projekt'}.
        </p>
      </div>

      {isLoading ? (
        <div className="detail-empty-state">
          <h2>Aktivitaet wird geladen</h2>
          <p>Wir sammeln gerade die letzten Aktionen rund um dieses Projekt.</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="detail-empty-state detail-empty-state--error">
          <h2>Aktivitaet konnte nicht geladen werden</h2>
          <p>{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && entries.length === 0 ? (
        <div className="detail-empty-state">
          <h2>Noch keine Aktivitaet vorhanden</h2>
          <p>
            Sobald Tasks, Kommentare oder Teamaktionen im Projekt stattfinden,
            erscheinen sie hier chronologisch.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && entries.length > 0 ? (
        <div className="activity-list" aria-label="Projektaktivitaet">
          {entries.map((entry) => (
            <article className="activity-card" key={entry.id ?? entry.createdAt}>
              <div className="activity-card__rail" aria-hidden="true" />
              <div className="activity-card__content">
                <div className="activity-card__meta">
                  <span className="activity-type-badge">{entry.type ?? 'EVENT'}</span>
                  <span>{entry.actorEmail ?? 'Unbekannter Nutzer'}</span>
                  <span>{formatDateTime(entry.createdAt)}</span>
                </div>
                <p>{entry.message ?? 'Keine Aktivitaetsbeschreibung vorhanden.'}</p>
                <div className="activity-card__entity">
                  <strong>{entry.entityType ?? 'Entity'}</strong>
                  <span>{entry.entityId ?? 'Keine Referenz'}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
