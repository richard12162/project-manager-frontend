import type { FormEvent } from 'react'
import { useEffect, useEffectEvent, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import {
  getProjectMembers,
  type ProjectMemberResponse,
  type ProjectResponse,
} from '../../api/projects'
import {
  createProjectTask,
  getProjectTasks,
  type CreateTaskRequest,
  type TaskPriority,
  type TaskResponse,
  type TaskStatus,
  updateProjectTask,
  updateProjectTaskAssignment,
  updateProjectTaskStatus,
} from '../../api/tasks'
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

type FormMode = 'closed' | 'create' | 'edit'

export function ProjectTasksPage() {
  const { token } = useAuth()
  const { project } = useOutletContext<{ project: ProjectResponse }>()
  // Page-level state owns task data, filters, and form state. Per-task comment
  // state lives inside ProjectTaskItem to keep this file flatter.
  const [members, setMembers] = useState<ProjectMemberResponse[]>([])
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL')
  const [formMode, setFormMode] = useState<FormMode>('closed')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<TaskFormValues>(EMPTY_TASK_FORM)
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taskActionError, setTaskActionError] = useState<string | null>(null)
  const [pendingTaskAction, setPendingTaskAction] = useState<string | null>(null)

  const loadMembers = useEffectEvent(async () => {
    if (!token || !project.id) {
      return
    }

    try {
      const nextMembers = await getProjectMembers(token, project.id)
      setMembers(nextMembers)
    } catch {
      // Member loading is not critical enough to block the full page.
      setMembers([])
    }
  })

  useEffect(() => {
    void loadMembers()
  }, [project.id, token])

  const loadTasks = useEffectEvent(async () => {
    if (!token || !project.id) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Filters are forwarded to the backend so the page does not need its own
      // client-side filtering over already loaded tasks.
      const response = await getProjectTasks(token, project.id, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        size: 50,
        sort: 'updatedAt,desc',
      })

      setTasks(response.content ?? [])
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Die Tasks konnten nicht geladen werden.'))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    void loadTasks()
  }, [priorityFilter, project.id, statusFilter, token])

  function handleFormChange(field: keyof TaskFormValues, value: string) {
    // Clear field-specific errors as soon as the user changes the input again.
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
    setFormMode('create')
    setFormError(null)
    setFormErrors({})
    setFormValues(EMPTY_TASK_FORM)
  }

  function openEditForm(task: TaskResponse) {
    // The edit form is prefilled from the selected task instead of reloading it.
    setEditingTaskId(task.id ?? null)
    setFormMode('edit')
    setFormError(null)
    setFormErrors({})
    setFormValues({
      title: task.title ?? '',
      description: task.description ?? '',
      priority: normalizeTaskPriority(task.priority),
      dueDate: normalizeDateInput(task.dueDate),
    })
  }

  function closeForm() {
    setFormMode('closed')
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

      // Create and edit intentionally share the same submit flow and only differ
      // by the presence of editingTaskId.
      const savedTask = editingTaskId
        ? await updateProjectTask(token, editingTaskId, payload)
        : await createProjectTask(token, project.id, payload)

      setTasks((current) => {
        // Keep the visible list in sync locally after create or edit.
        if (editingTaskId) {
          return current.map((task) => (task.id === savedTask.id ? savedTask : task))
        }

        return [savedTask, ...current]
      })

      closeForm()
    } catch (submissionError) {
      setFormError(
        getErrorMessage(submissionError, 'Die Task konnte nicht gespeichert werden.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    if (!token) {
      return
    }

    // A single pending marker keeps status and assignment loading states simple.
    setTaskActionError(null)
    setPendingTaskAction(`status:${taskId}`)

    try {
      const updatedTask = await updateProjectTaskStatus(token, taskId, { status })
      setTasks((current) =>
        current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      )
    } catch (submissionError) {
      setTaskActionError(
        getErrorMessage(submissionError, 'Der Status konnte nicht aktualisiert werden.'),
      )
    } finally {
      setPendingTaskAction(null)
    }
  }

  async function handleAssignmentChange(taskId: string, assigneeId: string) {
    if (!token) {
      return
    }

    setTaskActionError(null)
    setPendingTaskAction(`assignment:${taskId}`)

    try {
      const updatedTask = await updateProjectTaskAssignment(token, taskId, {
        assigneeId: assigneeId || undefined,
      })
      setTasks((current) =>
        current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      )
    } catch (submissionError) {
      setTaskActionError(
        getErrorMessage(
          submissionError,
          'Die Zuweisung konnte nicht aktualisiert werden.',
        ),
      )
    } finally {
      setPendingTaskAction(null)
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
          onClick={formMode === 'closed' ? openCreateForm : closeForm}
        >
          {formMode === 'closed' ? 'Neue Aufgabe' : 'Abbrechen'}
        </button>
      </div>

      {taskActionError ? (
        <div className="form-feedback form-feedback--error" role="alert">
          {taskActionError}
        </div>
      ) : null}

      {formMode !== 'closed' ? (
        <ProjectTaskForm
          isEditing={formMode === 'edit'}
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
              pendingTaskAction={pendingTaskAction}
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
