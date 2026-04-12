import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  getProjectMembers,
  type ProjectMemberResponse,
  type ProjectResponse,
} from '../../api/projects'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/date'

export function ProjectMembersPage() {
  const { token } = useAuth()
  const { project } = useOutletContext<{ project: ProjectResponse }>()
  const [members, setMembers] = useState<ProjectMemberResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !project.id) {
      return
    }

    const sessionToken = token
    const currentProjectId = project.id
    let cancelled = false

    async function loadMembers() {
      try {
        setIsLoading(true)
        setError(null)

        const nextMembers = await getProjectMembers(sessionToken, currentProjectId)

        if (cancelled) {
          return
        }

        setMembers(nextMembers)
      } catch (loadError) {
        if (cancelled) {
          return
        }

        if (loadError instanceof ApiError) {
          setError(loadError.message)
        } else {
          setError('Die Mitglieder konnten nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadMembers()

    return () => {
      cancelled = true
    }
  }, [project.id, token])

  return (
    <section className="content-card">
      <div className="content-card__header">
        <p className="section-eyebrow">Mitglieder</p>
        <h1>Teamzugriff</h1>
        <p>
          Alle Projektmitglieder für {project.name ?? 'dieses Projekt'} mit Rolle
          und Beitrittszeitpunkt.
        </p>
      </div>

      {isLoading ? (
        <div className="detail-empty-state">
          <h2>Mitglieder werden geladen</h2>
          <p>Wir holen gerade den aktuellen Projektzugriff aus dem Backend.</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="detail-empty-state detail-empty-state--error">
          <h2>Mitglieder konnten nicht geladen werden</h2>
          <p>{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && members.length === 0 ? (
        <div className="detail-empty-state">
          <h2>Noch keine Mitglieder sichtbar</h2>
          <p>
            Sobald weitere Personen Zugriff auf dieses Projekt erhalten, erscheinen
            sie hier mit Rolle und Eintrittsdatum.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && members.length > 0 ? (
        <div className="member-list" aria-label="Projektmitglieder">
          {members.map((member) => (
            <article className="member-card" key={member.id ?? member.userId ?? member.email}>
              <div className="member-card__identity">
                <div className="member-card__avatar">
                  {(member.email ?? '?').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2>{member.email ?? 'Unbekannte E-Mail'}</h2>
                  <p>Zum Projekt hinzugefügt am {formatDateTime(member.joinedAt)}</p>
                </div>
              </div>

              <div className="member-card__role">
                <span className="member-role-badge">{member.role ?? 'MEMBER'}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
