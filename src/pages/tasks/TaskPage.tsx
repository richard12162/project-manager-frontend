import { useEffect, useEffectEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import { getMyTasks, type TaskResponse } from '../../api/tasks'
import { TaskCard } from '../../components/tasks/TaskCard'
import { useAuth } from '../../hooks/useAuth'

export function TaskPage() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<TaskResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTasks = useEffectEvent(async () => {
    if (!token) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // projectName comes directly from the task DTO, so this page no longer
      // needs a second request to /projects.
      setTasks(await getMyTasks(token))
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Deine Aufgaben konnten nicht geladen werden.'))
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    void loadTasks()
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
          {/* The card stays generic on purpose, while page-specific UI comes through context/actions. */}
          {tasks.map((task) => (
            <TaskCard
              key={task.id ?? task.title}
              task={task}
              context={
                <p>
                  Projekt: <strong>{task.projectName ?? 'Unbekanntes Projekt'}</strong>
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
