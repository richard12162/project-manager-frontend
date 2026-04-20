import type { ReactNode } from 'react'
import type { TaskResponse } from '../../api/tasks'
import { formatDateTime } from '../../utils/date'

type TaskCardProps = {
  task: TaskResponse
  context?: ReactNode
  controls?: ReactNode
  actions?: ReactNode
  details?: ReactNode
}

export function TaskCard({ task, context, controls, actions, details }: TaskCardProps) {
  // "Unknown" should not appear as its own meta field in the UI.
  const dueDateLabel = formatOptionalDateTime(task.dueDate)

  return (
    <article className="task-card">
      <div className="task-card__main">
        <div className="task-card__heading">
          <h2>{task.title ?? 'Unbenannte Aufgabe'}</h2>
          <div className="task-card__badges">
            <span className={`task-badge task-badge--status-${normalizeTaskToken(task.status)}`}>
              {formatTaskStatus(task.status)}
            </span>
            <span
              className={`task-badge task-badge--priority-${normalizeTaskToken(task.priority)}`}
            >
              {formatTaskPriority(task.priority)}
            </span>
          </div>
        </div>

        {context ? <div className="task-card__context">{context}</div> : null}
        <p>{task.description?.trim() || 'Keine Beschreibung hinterlegt.'}</p>
      </div>

      <dl className="task-card__meta">
        <div>
          <dt>Zugewiesen an</dt>
          <dd>{task.assigneeEmail ?? 'Nicht zugewiesen'}</dd>
        </div>
        {dueDateLabel ? (
          <div>
            <dt>Fällig</dt>
            <dd>{dueDateLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt>Aktualisiert</dt>
          <dd>{formatDateTime(task.updatedAt)}</dd>
        </div>
      </dl>

      {controls ? <div className="task-card__controls">{controls}</div> : null}
      {actions ? <div className="task-card__actions">{actions}</div> : null}
      {details}
    </article>
  )
}

function formatTaskStatus(status?: string) {
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

function formatTaskPriority(priority?: string) {
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
      return 'Ohne Priorität'
  }
}

function normalizeTaskToken(value?: string) {
  // CSS classes expect tokens like "in-progress" instead of "IN_PROGRESS".
  return value?.toLowerCase().replaceAll('_', '-') ?? 'unknown'
}

function formatOptionalDateTime(value?: string) {
  const label = formatDateTime(value)
  return label === 'Unbekannt' ? null : label
}
