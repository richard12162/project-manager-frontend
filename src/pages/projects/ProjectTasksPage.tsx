import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  createProjectTask,
  getProjectTasks,
  type CreateTaskRequest,
  type ProjectResponse,
  type TaskPriority,
  type TaskResponse,
  type TaskStatus,
  updateProjectTask,
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

const TASK_FORM_PRIORITY_OPTIONS: Array<{
  label: string
  value: NonNullable<CreateTaskRequest['priority']>
}> = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

type TaskFormValues = {
  title: string
  description: string
  priority: NonNullable<CreateTaskRequest['priority']>
  dueDate: string
}

type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>

export function ProjectTasksPage() {
  const { token } = useAuth()
  const { project } = useOutletContext<{ project: ProjectResponse }>()
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<TaskFormValues>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  })
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function handleFormChange(field: keyof TaskFormValues, value: string) {
    setFormError(null)
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))

    setFormErrors((current) => ({
      ...current,
      [field]: undefined,
    }))
  }

  function openCreateForm() {
    setEditingTaskId(null)
    setFormError(null)
    setFormErrors({})
    setFormValues({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
    })
    setIsComposerOpen(true)
  }

  function openEditForm(task: TaskResponse) {
    setEditingTaskId(task.id ?? null)
    setFormError(null)
    setFormErrors({})
    setFormValues({
      title: task.title ?? '',
      description: task.description ?? '',
      priority: normalizeTaskPriority(task.priority),
      dueDate: normalizeDateInput(task.dueDate),
    })
    setIsComposerOpen(true)
  }

  function closeForm() {
    setIsComposerOpen(false)
    setEditingTaskId(null)
    setFormError(null)
    setFormErrors({})
  }

  function validateTaskForm(values: TaskFormValues) {
    const nextErrors: TaskFormErrors = {}

    if (!values.title.trim()) {
      nextErrors.title = 'Bitte gib einen Task-Titel ein.'
    } else if (values.title.trim().length < 3) {
      nextErrors.title = 'Der Task-Titel sollte mindestens 3 Zeichen lang sein.'
    }

    if (values.description.length > 1000) {
      nextErrors.description =
        'Die Beschreibung darf hoechstens 1000 Zeichen lang sein.'
    }

    return nextErrors
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !project.id) {
      return
    }

    const nextErrors = validateTaskForm(formValues)
    setFormErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload = {
      title: formValues.title.trim(),
      description: formValues.description.trim() || undefined,
      priority: formValues.priority,
      dueDate: formValues.dueDate ? new Date(formValues.dueDate).toISOString() : undefined,
    }

    try {
      setIsSubmitting(true)

      const savedTask =
        editingTaskId
          ? await updateProjectTask(token, editingTaskId, payload)
          : await createProjectTask(token, project.id, payload)

      setTasks((current) => {
        if (editingTaskId) {
          return current.map((task) =>
            task.id === savedTask.id ? savedTask : task,
          )
        }

        return [savedTask, ...current]
      })

      closeForm()
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setFormError(submissionError.message)
      } else {
        setFormError('Die Task konnte nicht gespeichert werden.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <div className="tasks-header-actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            if (isComposerOpen) {
              closeForm()
            } else {
              openCreateForm()
            }
          }}
        >
          {isComposerOpen ? 'Formular schliessen' : 'Neue Task'}
        </button>
      </div>

      {isComposerOpen ? (
        <form className="task-form" noValidate onSubmit={handleTaskSubmit}>
          <div className={`field${formErrors.title ? ' field--invalid' : ''}`}>
            <label htmlFor="task-title">Titel</label>
            <input
              id="task-title"
              name="title"
              type="text"
              placeholder="z. B. Kickoff mit dem Team vorbereiten"
              value={formValues.title}
              onChange={(event) => handleFormChange('title', event.target.value)}
              aria-invalid={Boolean(formErrors.title)}
            />
            {formErrors.title ? (
              <span className="field__error" role="alert">
                {formErrors.title}
              </span>
            ) : null}
          </div>

          <div className="task-form__grid">
            <div className="field">
              <label htmlFor="task-priority">Prioritaet</label>
              <select
                id="task-priority"
                name="priority"
                value={formValues.priority}
                onChange={(event) => handleFormChange('priority', event.target.value)}
              >
                {TASK_FORM_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="task-due-date">Faelligkeit</label>
              <input
                id="task-due-date"
                name="dueDate"
                type="datetime-local"
                value={formValues.dueDate}
                onChange={(event) => handleFormChange('dueDate', event.target.value)}
              />
            </div>
          </div>

          <div className={`field${formErrors.description ? ' field--invalid' : ''}`}>
            <label htmlFor="task-description">Beschreibung</label>
            <textarea
              id="task-description"
              name="description"
              rows={5}
              placeholder="Ergaenze Details, Kontext und das erwartete Ergebnis."
              value={formValues.description}
              onChange={(event) =>
                handleFormChange('description', event.target.value)
              }
              aria-invalid={Boolean(formErrors.description)}
            />
            <span className="field__hint">
              Assignment und Statussteuerung folgen im naechsten Commit direkt in der Liste.
            </span>
            {formErrors.description ? (
              <span className="field__error" role="alert">
                {formErrors.description}
              </span>
            ) : null}
          </div>

          {formError ? (
            <div className="form-feedback form-feedback--error" role="alert">
              {formError}
            </div>
          ) : null}

          <div className="task-form__actions">
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? editingTaskId
                  ? 'Speichere Task...'
                  : 'Erstelle Task...'
                : editingTaskId
                  ? 'Task speichern'
                  : 'Task erstellen'}
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={closeForm}
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : null}

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

              {task.id ? (
                <div className="task-card__actions">
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => openEditForm(task)}
                  >
                    Bearbeiten
                  </button>
                </div>
              ) : null}
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

function normalizeTaskPriority(priority?: string): NonNullable<CreateTaskRequest['priority']> {
  if (
    priority === 'LOW' ||
    priority === 'MEDIUM' ||
    priority === 'HIGH' ||
    priority === 'URGENT'
  ) {
    return priority
  }

  return 'MEDIUM'
}

function normalizeDateInput(value?: string) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}
