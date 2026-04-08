import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  getProjectTasks,
  type ProjectResponse,
  type TaskPriority,
  type TaskResponse,
  type TaskStatus,
} from '../../api/projects'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/date'

const STATUS_OPTIONS: Array<{ label: string; value: TaskStatus | 'ALL' }> = [
  { label: 'Alle Status', value: 'ALL' },
  { label: 'To do', value: 'TODO' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'In review', value: 'IN_REVIEW' },
  { label: 'Done', value: 'DONE' },
]

const PRIORITY_OPTIONS: Array<{ label: string; value: TaskPriority | 'ALL' }> = [
  { label: 'Alle Prioritaeten', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

export function ProjectTasksPage() {
  const { token } = useAuth()
  const { project } = useOutletContext<{ project: ProjectResponse }>()
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL')

  useEffect(() => {
    if (!token || !project.id) {
      return
    }

    const sessionToken = token
    const currentProjectId = project.id
    let cancelled = false

    async function loadTasks() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await getProjectTasks(sessionToken, currentProjectId, {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
          size: 50,
          sort: 'updatedAt,desc',
        })

        if (cancelled) {
          return
        }

        setTasks(response.content ?? [])
      } catch (loadError) {
        if (cancelled) {
          return
        }

        if (loadError instanceof ApiError) {
          setError(loadError.message)
        } else {
          setError('Die Tasks konnten nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadTasks()

    return () => {
      cancelled = true
    }
  }, [priorityFilter, project.id, statusFilter, token])

  return (
    <section className="content-card">
      <div className="content-card__header">
        <p className="section-eyebrow">Tasks</p>
        <h1>Aufgabenbereich</h1>
        <p>
          Alle Aufgaben fuer {project.name ?? 'dieses Projekt'} an einem Ort, mit
          Filtern fuer Status und Prioritaet.
        </p>
      </div>

      <div className="tasks-toolbar">
        <div className="field">
          <label htmlFor="task-status-filter">Status</label>
          <select
            id="task-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TaskStatus | 'ALL')
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-priority-filter">Prioritaet</label>
          <select
            id="task-priority-filter"
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as TaskPriority | 'ALL')
            }
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="detail-empty-state">
          <h2>Tasks werden geladen</h2>
          <p>Wir holen gerade die Aufgabenliste aus dem Backend.</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="detail-empty-state detail-empty-state--error">
          <h2>Tasks konnten nicht geladen werden</h2>
          <p>{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && tasks.length === 0 ? (
        <div className="detail-empty-state">
          <h2>Keine passenden Tasks gefunden</h2>
          <p>
            Fuer die aktuelle Filterkombination gibt es keine Aufgaben. Passe die
            Filter an oder lege im naechsten Schritt eine neue Task an.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && tasks.length > 0 ? (
        <div className="task-list" aria-label="Taskliste">
          {tasks.map((task) => (
            <article className="task-card" key={task.id ?? task.title}>
              <div className="task-card__main">
                <div className="task-card__heading">
                  <h2>{task.title ?? 'Unbenannte Aufgabe'}</h2>
                  <div className="task-card__badges">
                    <span className={`task-badge task-badge--status-${normalizeToken(task.status)}`}>
                      {formatStatus(task.status)}
                    </span>
                    <span
                      className={`task-badge task-badge--priority-${normalizeToken(task.priority)}`}
                    >
                      {formatPriority(task.priority)}
                    </span>
                  </div>
                </div>

                <p>{task.description?.trim() || 'Keine Beschreibung hinterlegt.'}</p>
              </div>

              <dl className="task-card__meta">
                <div>
                  <dt>Zugewiesen an</dt>
                  <dd>{task.assigneeEmail ?? 'Nicht zugewiesen'}</dd>
                </div>
                <div>
                  <dt>Faellig</dt>
                  <dd>{formatDateTime(task.dueDate)}</dd>
                </div>
                <div>
                  <dt>Aktualisiert</dt>
                  <dd>{formatDateTime(task.updatedAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function formatStatus(status?: string) {
  switch (status) {
    case 'TODO':
      return 'To do'
    case 'IN_PROGRESS':
      return 'In progress'
    case 'IN_REVIEW':
      return 'In review'
    case 'DONE':
      return 'Done'
    default:
      return 'Unbekannt'
  }
}

function formatPriority(priority?: string) {
  switch (priority) {
    case 'LOW':
      return 'Low'
    case 'MEDIUM':
      return 'Medium'
    case 'HIGH':
      return 'High'
    case 'URGENT':
      return 'Urgent'
    default:
      return 'Ohne Prioritaet'
  }
}

function normalizeToken(value?: string) {
  return value?.toLowerCase().replaceAll('_', '-') ?? 'unknown'
}
