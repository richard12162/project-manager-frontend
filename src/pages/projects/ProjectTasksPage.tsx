import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  createProjectTask,
  createTaskComment,
  deleteTaskComment,
  getProjectMembers,
  getProjectTasks,
  getTaskComments,
  type CommentResponse,
  type CreateTaskRequest,
  type ProjectMemberResponse,
  type ProjectResponse,
  type TaskPriority,
  type TaskResponse,
  type TaskStatus,
  updateTaskComment,
  updateProjectTask,
  updateProjectTaskAssignment,
  updateProjectTaskStatus,
} from '../../api/projects'
import { useAuth } from '../../hooks/useAuth'
import { formatDateTime } from '../../utils/date'

const STATUS_OPTIONS: Array<{ label: string; value: TaskStatus | 'ALL' }> = [
  { label: 'Beliebig', value: 'ALL' },
  { label: 'To do', value: 'TODO' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'In review', value: 'IN_REVIEW' },
  { label: 'Done', value: 'DONE' },
]

const PRIORITY_OPTIONS: Array<{ label: string; value: TaskPriority | 'ALL' }> = [
  { label: 'Beliebig', value: 'ALL' },
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
type CommentDrafts = Record<string, string>
type CommentCollections = Record<string, CommentResponse[]>

export function ProjectTasksPage() {
  const { token } = useAuth()
  const { project } = useOutletContext<{ project: ProjectResponse }>()
  const [members, setMembers] = useState<ProjectMemberResponse[]>([])
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
  const [taskActionError, setTaskActionError] = useState<string | null>(null)
  const [statusUpdatingTaskId, setStatusUpdatingTaskId] = useState<string | null>(null)
  const [assignmentUpdatingTaskId, setAssignmentUpdatingTaskId] = useState<string | null>(null)
  const [commentsByTaskId, setCommentsByTaskId] = useState<CommentCollections>({})
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([])
  const [loadingCommentsTaskId, setLoadingCommentsTaskId] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<CommentDrafts>({})
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [submittingCommentTaskId, setSubmittingCommentTaskId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !project.id) {
      return
    }

    const sessionToken = token
    const currentProjectId = project.id
    let cancelled = false

    async function loadMembers() {
      try {
        const nextMembers = await getProjectMembers(sessionToken, currentProjectId)

        if (cancelled) {
          return
        }

        setMembers(nextMembers)
      } catch {
        if (!cancelled) {
          setMembers([])
        }
      }
    }

    void loadMembers()

    return () => {
      cancelled = true
    }
  }, [project.id, token])

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

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    if (!token) {
      return
    }

    setTaskActionError(null)
    setStatusUpdatingTaskId(taskId)

    try {
      const updatedTask = await updateProjectTaskStatus(token, taskId, { status })
      setTasks((current) =>
        current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      )
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setTaskActionError(submissionError.message)
      } else {
        setTaskActionError('Der Status konnte nicht aktualisiert werden.')
      }
    } finally {
      setStatusUpdatingTaskId(null)
    }
  }

  async function handleAssignmentChange(taskId: string, assigneeId: string) {
    if (!token) {
      return
    }

    setTaskActionError(null)
    setAssignmentUpdatingTaskId(taskId)

    try {
      const updatedTask = await updateProjectTaskAssignment(token, taskId, {
        assigneeId: assigneeId || undefined,
      })
      setTasks((current) =>
        current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      )
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setTaskActionError(submissionError.message)
      } else {
        setTaskActionError('Die Zuweisung konnte nicht aktualisiert werden.')
      }
    } finally {
      setAssignmentUpdatingTaskId(null)
    }
  }

  async function handleToggleComments(taskId: string) {
    const isExpanded = expandedTaskIds.includes(taskId)

    if (isExpanded) {
      setExpandedTaskIds((current) => current.filter((id) => id !== taskId))
      return
    }

    setExpandedTaskIds((current) => [...current, taskId])
    setCommentError(null)

    if (commentsByTaskId[taskId]) {
      return
    }

    if (!token) {
      return
    }

    try {
      setLoadingCommentsTaskId(taskId)
      const comments = await getTaskComments(token, taskId)
      setCommentsByTaskId((current) => ({
        ...current,
        [taskId]: comments,
      }))
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setCommentError(submissionError.message)
      } else {
        setCommentError('Die Kommentare konnten nicht geladen werden.')
      }
    } finally {
      setLoadingCommentsTaskId(null)
    }
  }

  function handleCommentDraftChange(taskId: string, value: string) {
    setCommentError(null)
    setCommentDrafts((current) => ({
      ...current,
      [taskId]: value,
    }))
  }

  function startCommentEdit(taskId: string, comment: CommentResponse) {
    if (!comment.id) {
      return
    }

    setEditingCommentId(comment.id)
    setCommentDrafts((current) => ({
      ...current,
      [taskId]: comment.content ?? '',
    }))
  }

  function cancelCommentEdit(taskId: string) {
    setEditingCommentId(null)
    setCommentDrafts((current) => ({
      ...current,
      [taskId]: '',
    }))
  }

  async function handleCommentSubmit(taskId: string) {
    if (!token) {
      return
    }

    const content = commentDrafts[taskId]?.trim() ?? ''
    if (!content) {
      setCommentError('Bitte gib einen Kommentarinhalt ein.')
      return
    }

    try {
      setCommentError(null)
      setSubmittingCommentTaskId(taskId)

      if (editingCommentId) {
        const updatedComment = await updateTaskComment(token, editingCommentId, {
          content,
        })

        setCommentsByTaskId((current) => ({
          ...current,
          [taskId]: (current[taskId] ?? []).map((comment) =>
            comment.id === updatedComment.id ? updatedComment : comment,
          ),
        }))
      } else {
        const createdComment = await createTaskComment(token, taskId, { content })
        setCommentsByTaskId((current) => ({
          ...current,
          [taskId]: [createdComment, ...(current[taskId] ?? [])],
        }))
      }

      setCommentDrafts((current) => ({
        ...current,
        [taskId]: '',
      }))
      setEditingCommentId(null)
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setCommentError(submissionError.message)
      } else {
        setCommentError('Der Kommentar konnte nicht gespeichert werden.')
      }
    } finally {
      setSubmittingCommentTaskId(null)
    }
  }

  async function handleCommentDelete(taskId: string, commentId: string) {
    if (!token) {
      return
    }

    try {
      setCommentError(null)
      setDeletingCommentId(commentId)
      await deleteTaskComment(token, commentId)
      setCommentsByTaskId((current) => ({
        ...current,
        [taskId]: (current[taskId] ?? []).filter((comment) => comment.id !== commentId),
      }))
      if (editingCommentId === commentId) {
        setEditingCommentId(null)
      }
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setCommentError(submissionError.message)
      } else {
        setCommentError('Der Kommentar konnte nicht geloescht werden.')
      }
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <section className="content-card">
      <div className="content-card__header">
        <p className="section-eyebrow">Aufgaben</p>
        <h1>Aufgabenbereich</h1>
        <p>
          Alle Aufgaben für {project.name ?? 'dieses Projekt'} an einem Ort, mit
          Filtern für Status und Priorität.
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
          {isComposerOpen ? 'Abbrechen' : 'Neue Aufgabe'}
        </button>
      </div>

      {taskActionError ? (
        <div className="form-feedback form-feedback--error" role="alert">
          {taskActionError}
        </div>
      ) : null}

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
              <label htmlFor="task-priority">Priorität</label>
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
              <label htmlFor="task-due-date">Fälligkeit</label>
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
              placeholder="Ergänze Details, Kontext und das erwartete Ergebnis."
              value={formValues.description}
              onChange={(event) =>
                handleFormChange('description', event.target.value)
              }
              aria-invalid={Boolean(formErrors.description)}
            />
            <span className="field__hint">
              Status und Zuweisung können direkt in der Liste angepasst werden.
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
                  ? 'Speichere Aufgabe...'
                  : 'Erstelle Aufgabe...'
                : editingTaskId
                  ? 'Aufgabe speichern'
                  : 'Aufgabe erstellen'}
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
          <label htmlFor="task-priority-filter">Priorität</label>
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
          <h2>Aufgaben werden geladen</h2>
          <p>Wir holen gerade die Aufgabenliste aus dem Backend.</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="detail-empty-state detail-empty-state--error">
          <h2>Aufgaben konnten nicht geladen werden</h2>
          <p>{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && tasks.length === 0 ? (
        <div className="detail-empty-state">
          <h2>Keine passenden Tasks gefunden</h2>
          <p>
            Für die aktuelle Filterkombination gibt es keine Aufgaben. Passe die
            Filter an oder lege im nächsten Schritt eine neue Aufgabe an.
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
                  <dt>Fällig</dt>
                  <dd>{formatDateTime(task.dueDate)}</dd>
                </div>
                <div>
                  <dt>Aktualisiert</dt>
                  <dd>{formatDateTime(task.updatedAt)}</dd>
                </div>
              </dl>

              {task.id ? (
                <div className="task-card__controls">
                  <div className="field">
                    <label htmlFor={`task-status-${task.id}`}>Status ändern</label>
                    <select
                      id={`task-status-${task.id}`}
                      value={normalizeTaskStatus(task.status)}
                      onChange={(event) =>
                        handleStatusChange(task.id!, event.target.value as TaskStatus)
                      }
                      disabled={statusUpdatingTaskId === task.id}
                    >
                      {STATUS_OPTIONS.filter((option) => option.value !== 'ALL').map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor={`task-assignee-${task.id}`}>Zuweisen</label>
                    <select
                      id={`task-assignee-${task.id}`}
                      value={task.assigneeId ?? ''}
                      onChange={(event) =>
                        handleAssignmentChange(task.id!, event.target.value)
                      }
                      disabled={assignmentUpdatingTaskId === task.id}
                    >
                      <option value="">Nicht zugewiesen</option>
                      {members.map((member) => (
                        <option key={member.userId ?? member.id} value={member.userId ?? ''}>
                          {member.email ?? 'Unbekanntes Mitglied'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {task.id ? (
                <div className="task-card__actions">
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => handleToggleComments(task.id!)}
                  >
                    {expandedTaskIds.includes(task.id)
                      ? 'Kommentare ausblenden'
                      : 'Kommentare'}
                  </button>
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => openEditForm(task)}
                  >
                    Bearbeiten
                  </button>
                </div>
              ) : null}

              {task.id && expandedTaskIds.includes(task.id) ? (
                <div className="comments-panel">
                  <div className="comments-panel__header">
                    <h3>Kommentare</h3>
                    <span>{(commentsByTaskId[task.id] ?? []).length} Eintraege</span>
                  </div>

                  {commentError ? (
                    <div className="form-feedback form-feedback--error" role="alert">
                      {commentError}
                    </div>
                  ) : null}

                  {loadingCommentsTaskId === task.id ? (
                    <div className="comments-empty-state">
                      <p>Kommentare werden geladen...</p>
                    </div>
                  ) : null}

                  {loadingCommentsTaskId !== task.id &&
                  (commentsByTaskId[task.id] ?? []).length === 0 ? (
                    <div className="comments-empty-state">
                      <p>Noch keine Kommentare vorhanden.</p>
                    </div>
                  ) : null}

                  {loadingCommentsTaskId !== task.id &&
                  (commentsByTaskId[task.id] ?? []).length > 0 ? (
                    <div className="comment-list">
                      {(commentsByTaskId[task.id] ?? []).map((comment) => (
                        <article className="comment-card" key={comment.id ?? comment.createdAt}>
                          <div className="comment-card__header">
                            <div>
                              <strong>{comment.authorEmail ?? 'Unbekannter Autor'}</strong>
                              <p>{formatDateTime(comment.updatedAt ?? comment.createdAt)}</p>
                            </div>
                            {comment.id ? (
                              <div className="comment-card__actions">
                                <button
                                  className="button button--ghost"
                                  type="button"
                                  onClick={() => startCommentEdit(task.id!, comment)}
                                >
                                  Bearbeiten
                                </button>
                                <button
                                  className="button button--ghost"
                                  type="button"
                                  onClick={() =>
                                    handleCommentDelete(task.id!, comment.id!)
                                  }
                                  disabled={deletingCommentId === comment.id}
                                >
                                  {deletingCommentId === comment.id
                                    ? 'Loesche...'
                                    : 'Loeschen'}
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <p>{comment.content ?? ''}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  <div className="comment-composer">
                    <label htmlFor={`comment-draft-${task.id}`}>
                      {editingCommentId ? 'Kommentar bearbeiten' : 'Neuen Kommentar schreiben'}
                    </label>
                    <textarea
                      id={`comment-draft-${task.id}`}
                      rows={4}
                      placeholder="Rückfragen, Kontext oder Update zur Aufgabe festhalten."
                      value={commentDrafts[task.id] ?? ''}
                      onChange={(event) =>
                        handleCommentDraftChange(task.id!, event.target.value)
                      }
                    />
                    <div className="comment-composer__actions">
                      <button
                        className="button button--primary"
                        type="button"
                        onClick={() => handleCommentSubmit(task.id!)}
                        disabled={submittingCommentTaskId === task.id}
                      >
                        {submittingCommentTaskId === task.id
                          ? 'Speichere Kommentar...'
                          : editingCommentId
                            ? 'Kommentar speichern'
                            : 'Kommentar erstellen'}
                      </button>
                      {editingCommentId ? (
                        <button
                          className="button button--ghost"
                          type="button"
                          onClick={() => cancelCommentEdit(task.id!)}
                        >
                          Abbrechen
                        </button>
                      ) : null}
                    </div>
                  </div>
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
      return 'Ohne Priorität'
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

function normalizeTaskStatus(status?: string): TaskStatus {
  if (
    status === 'TODO' ||
    status === 'IN_PROGRESS' ||
    status === 'IN_REVIEW' ||
    status === 'DONE'
  ) {
    return status
  }

  return 'TODO'
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
