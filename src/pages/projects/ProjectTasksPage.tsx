import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  createProjectTask,
  getProjectMembers,
  getProjectTasks,
  type CreateTaskRequest,
  type ProjectMemberResponse,
  type ProjectResponse,
  type TaskPriority,
  type TaskResponse,
  type TaskStatus,
  updateProjectTask,
  updateProjectTaskAssignment,
  updateProjectTaskStatus,
} from '../../api/projects'
import { ProjectTaskForm } from '../../components/tasks/ProjectTaskForm'
import { ProjectTaskItem } from '../../components/tasks/ProjectTaskItem'
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  normalizeDateInput,
  normalizeTaskPriority,
  type TaskFormErrors,
  type TaskFormValues,
} from '../../components/tasks/taskOptions'
import { useAuth } from '../../hooks/useAuth'

const EMPTY_TASK_FORM: TaskFormValues = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
}

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
  const [formValues, setFormValues] = useState<TaskFormValues>(EMPTY_TASK_FORM)
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taskActionError, setTaskActionError] = useState<string | null>(null)
  const [statusUpdatingTaskId, setStatusUpdatingTaskId] = useState<string | null>(null)
  const [assignmentUpdatingTaskId, setAssignmentUpdatingTaskId] = useState<string | null>(null)

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

        if (!cancelled) {
          setMembers(nextMembers)
        }
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

        if (!cancelled) {
          setTasks(response.content ?? [])
        }
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
    setFormValues(EMPTY_TASK_FORM)
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

    const payload: CreateTaskRequest = {
      title: formValues.title.trim(),
      description: formValues.description.trim() || undefined,
      priority: formValues.priority,
      dueDate: formValues.dueDate ? new Date(formValues.dueDate).toISOString() : undefined,
    }

    try {
      setIsSubmitting(true)

      const savedTask = editingTaskId
        ? await updateProjectTask(token, editingTaskId, payload)
        : await createProjectTask(token, project.id, payload)

      setTasks((current) => {
        if (editingTaskId) {
          return current.map((task) => (task.id === savedTask.id ? savedTask : task))
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
          onClick={isComposerOpen ? closeForm : openCreateForm}
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
        <ProjectTaskForm
          editingTaskId={editingTaskId}
          formValues={formValues}
          formErrors={formErrors}
          formError={formError}
          isSubmitting={isSubmitting}
          onSubmit={handleTaskSubmit}
          onChange={handleFormChange}
          onCancel={closeForm}
        />
      ) : null}

      <div className="tasks-toolbar">
        <div className="field">
          <label htmlFor="task-status-filter">Status</label>
          <select
            id="task-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TaskStatus | 'ALL')}
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
            <ProjectTaskItem
              key={task.id ?? task.title}
              task={task}
              members={members}
              statusUpdatingTaskId={statusUpdatingTaskId}
              assignmentUpdatingTaskId={assignmentUpdatingTaskId}
              onStatusChange={handleStatusChange}
              onAssignmentChange={handleAssignmentChange}
              onEditTask={openEditForm}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
