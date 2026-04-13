import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  addProjectMember,
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
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function validateEmail(value: string) {
    if (!value.trim()) {
      return 'Bitte gib eine E-Mail-Adresse ein.'
    }

    const normalizedValue = value.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
      return 'Bitte gib eine gültige E-Mail-Adresse ein.'
    }

    return null
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !project.id) {
      return
    }

    const nextError = validateEmail(email)
    setFormError(nextError)
    setFormSuccess(null)

    if (nextError) {
      return
    }

    try {
      setIsSubmitting(true)

      const createdMember = await addProjectMember(token, project.id, {
        email: email.trim(),
      })

      setMembers((current) => {
        const existingMember = current.some(
          (member) =>
            (member.id && createdMember.id && member.id === createdMember.id) ||
            member.email === createdMember.email,
        )

        if (existingMember) {
          return current
        }

        return [...current, createdMember]
      })
      setEmail('')
      setFormError(null)
      setFormSuccess('Mitglied wurde zum Projekt hinzugefügt.')
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setFormError(submitError.message)
      } else {
        setFormError('Das Mitglied konnte nicht hinzugefügt werden.')
      }
      setFormSuccess(null)
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <section className="member-invite-card">
        <div>
          <h2>Mitglied hinzufügen</h2>
          <p>Füge eine Person per E-Mail-Adresse zu diesem Projekt hinzu.</p>
        </div>

        <form className="member-invite-form" onSubmit={handleAddMember} noValidate>
          <div className={`field${formError ? ' field--invalid' : ''}`}>
            <label htmlFor="member-email">E-Mail</label>
            <input
              id="member-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@firma.de"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (formError) {
                  setFormError(null)
                }
                if (formSuccess) {
                  setFormSuccess(null)
                }
              }}
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? 'member-email-error' : undefined}
            />
            {formError ? (
              <span className="field__error" id="member-email-error" role="alert">
                {formError}
              </span>
            ) : null}
          </div>

          <div className="member-invite-form__actions">
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Füge hinzu...' : 'Mitglied hinzufügen'}
            </button>
            {formSuccess ? <p className="form-feedback form-feedback--success">{formSuccess}</p> : null}
          </div>
        </form>
      </section>

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
