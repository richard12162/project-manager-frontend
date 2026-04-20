import { useState } from 'react'
import { ApiError } from '../../api/client'
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  type CommentResponse,
  type ProjectMemberResponse,
  type TaskResponse,
  type TaskStatus,
  updateTaskComment,
} from '../../api/projects'
import { useAuth } from '../../hooks/useAuth'
import { TaskCard } from './TaskCard'
import { TaskCommentsPanel } from './TaskCommentsPanel'
import { STATUS_OPTIONS, normalizeTaskStatus } from './taskOptions'

type ProjectTaskItemProps = {
  task: TaskResponse
  members: ProjectMemberResponse[]
  pendingTaskAction: string | null
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void>
  onAssignmentChange: (taskId: string, assigneeId: string) => Promise<void>
  onEditTask: (task: TaskResponse) => void
}

export function ProjectTaskItem({
  task,
  members,
  pendingTaskAction,
  onStatusChange,
  onAssignmentChange,
  onEditTask,
}: ProjectTaskItemProps) {
  const { token } = useAuth()
  const taskId = task.id
  const [isExpanded, setIsExpanded] = useState(false)
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  async function handleToggleComments() {
    if (!taskId) {
      return
    }

    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)
    setCommentError(null)

    if (comments.length > 0 || !token) {
      return
    }

    try {
      setIsLoadingComments(true)
      const nextComments = await getTaskComments(token, taskId)
      setComments(nextComments)
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setCommentError(loadError.message)
      } else {
        setCommentError('Die Kommentare konnten nicht geladen werden.')
      }
    } finally {
      setIsLoadingComments(false)
    }
  }

  function handleCommentDraftChange(value: string) {
    setCommentError(null)
    setCommentDraft(value)
  }

  function handleStartCommentEdit(comment: CommentResponse) {
    if (!comment.id) {
      return
    }

    setEditingCommentId(comment.id)
    setCommentDraft(comment.content ?? '')
  }

  function handleCancelCommentEdit() {
    setEditingCommentId(null)
    setCommentDraft('')
  }

  async function handleCommentSubmit() {
    if (!taskId || !token) {
      return
    }

    const content = commentDraft.trim()
    if (!content) {
      setCommentError('Bitte gib einen Kommentarinhalt ein.')
      return
    }

    try {
      setCommentError(null)
      setIsSubmittingComment(true)

      if (editingCommentId) {
        const updatedComment = await updateTaskComment(token, editingCommentId, {
          content,
        })
        setComments((current) =>
          current.map((comment) =>
            comment.id === updatedComment.id ? updatedComment : comment,
          ),
        )
      } else {
        const createdComment = await createTaskComment(token, taskId, { content })
        setComments((current) => [createdComment, ...current])
      }

      setCommentDraft('')
      setEditingCommentId(null)
    } catch (submissionError) {
      if (submissionError instanceof ApiError) {
        setCommentError(submissionError.message)
      } else {
        setCommentError('Der Kommentar konnte nicht gespeichert werden.')
      }
    } finally {
      setIsSubmittingComment(false)
    }
  }

  async function handleCommentDelete(commentId: string) {
    if (!token) {
      return
    }

    try {
      setCommentError(null)
      setDeletingCommentId(commentId)
      await deleteTaskComment(token, commentId)
      setComments((current) => current.filter((comment) => comment.id !== commentId))
      if (editingCommentId === commentId) {
        setEditingCommentId(null)
        setCommentDraft('')
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
    <TaskCard
      task={task}
      controls={
        taskId ? (
          <>
            <div className="field">
              <label htmlFor={`task-status-${taskId}`}>Status ändern</label>
              <select
                id={`task-status-${taskId}`}
                value={normalizeTaskStatus(task.status)}
                onChange={(event) => onStatusChange(taskId, event.target.value as TaskStatus)}
                disabled={pendingTaskAction === `status:${taskId}`}
              >
                {STATUS_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor={`task-assignee-${taskId}`}>Zuweisen</label>
              <select
                id={`task-assignee-${taskId}`}
                value={task.assigneeId ?? ''}
                onChange={(event) => onAssignmentChange(taskId, event.target.value)}
                disabled={pendingTaskAction === `assignment:${taskId}`}
              >
                <option value="">Nicht zugewiesen</option>
                {members.map((member) => (
                  <option key={member.userId ?? member.id} value={member.userId ?? ''}>
                    {member.email ?? 'Unbekanntes Mitglied'}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null
      }
      actions={
        taskId ? (
          <>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => void handleToggleComments()}
            >
              {isExpanded ? 'Kommentare ausblenden' : 'Kommentare'}
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => onEditTask(task)}
            >
              Bearbeiten
            </button>
          </>
        ) : null
      }
      details={
        taskId && isExpanded ? (
          <TaskCommentsPanel
            comments={comments}
            commentDraft={commentDraft}
            commentError={commentError}
            isEditingComment={Boolean(editingCommentId)}
            isLoadingComments={isLoadingComments}
            isSubmittingComment={isSubmittingComment}
            deletingCommentId={deletingCommentId}
            onCommentDraftChange={handleCommentDraftChange}
            onCommentSubmit={handleCommentSubmit}
            onCommentDelete={handleCommentDelete}
            onStartCommentEdit={handleStartCommentEdit}
            onCancelCommentEdit={handleCancelCommentEdit}
          />
        ) : null
      }
    />
  )
}
