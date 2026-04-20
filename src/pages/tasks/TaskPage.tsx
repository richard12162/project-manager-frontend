import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getMyProjects, type ProjectResponse, type TaskResponse } from '../../api/projects'
import { getMyTasks } from '../../api/tasks'
import { TaskCard } from '../../components/tasks/TaskCard'
import { useAuth } from '../../hooks/useAuth'

export function TaskPage() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [projectsById, setProjectsById] = useState<Record<string, ProjectResponse>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return
    }

    const sessionToken = token
    let cancelled = false

    async function loadTasks() {
      try {
        setIsLoading(true)
        setError(null)

        const [taskResponse, projectResponse] = await Promise.all([
          getMyTasks(sessionToken),
          getMyProjects(sessionToken),
        ])

        if (cancelled) {
          return
        }

        setTasks(taskResponse)
        setProjectsById(
          Object.fromEntries(
            projectResponse
              .filter((project) => project.id)
              .map((project) => [project.id!, project]),
          ),
        )
      } catch (loadError) {
        if (cancelled) {
          return
        }

        if (loadError instanceof ApiError) {
          setError(loadError.message)
        } else {
          setError('Deine Aufgaben konnten nicht geladen werden.')
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
  }, [token])

  return (
    <section className="content-card">
      <div className="content-card__header">
        <p className="section-eyebrow">Meine Aufgaben</p>
        <h1>Alle zugewiesenen Tasks</h1>
        <p>Hier siehst du alle Aufgaben, die aktuell dir zugewiesen sind.</p>
      </div>

      {isLoading ? (
        <div className="detail-empty-state">
          <h2>Aufgaben werden geladen</h2>
          <p>Wir holen gerade deine zugewiesenen Tasks aus dem Backend.</p>
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
          <h2>Keine Aufgaben gefunden</h2>
          <p>Dir ist aktuell keine Aufgabe zugewiesen.</p>
        </div>
      ) : null}

      {!isLoading && !error && tasks.length > 0 ? (
        <div className="task-list" aria-label="Meine Aufgaben">
          {tasks.map((task) => (
            <TaskCard
              key={task.id ?? task.title}
              task={task}
              context={
                <p>
                  Projekt:{' '}
                  <strong>
                    {task.projectId
                      ? projectsById[task.projectId]?.name ?? 'Unbekanntes Projekt'
                      : 'Unbekanntes Projekt'}
                  </strong>
                </p>
              }
              actions={
                task.projectId ? (
                  <Link
                    className="button button--ghost"
                    to={`/projects/${task.projectId}/tasks`}
                  >
                    Gehe zu der Aufgabe
                  </Link>
                ) : null
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
