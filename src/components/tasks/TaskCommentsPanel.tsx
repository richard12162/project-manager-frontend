import type { CommentResponse } from '../../api/tasks'
import { formatDateTime } from '../../utils/date'

type TaskCommentsPanelProps = {
  comments: CommentResponse[]
  commentDraft: string
  commentError: string | null
  isEditingComment: boolean
  isLoadingComments: boolean
  isSubmittingComment: boolean
  deletingCommentId: string | null
  onCommentDraftChange: (value: string) => void
  onCommentSubmit: () => Promise<void>
  onCommentDelete: (commentId: string) => Promise<void>
  onStartCommentEdit: (comment: CommentResponse) => void
  onCancelCommentEdit: () => void
}

export function TaskCommentsPanel({
  comments,
  commentDraft,
  commentError,
  isEditingComment,
  isLoadingComments,
  isSubmittingComment,
  deletingCommentId,
  onCommentDraftChange,
  onCommentSubmit,
  onCommentDelete,
  onStartCommentEdit,
  onCancelCommentEdit,
}: TaskCommentsPanelProps) {
  return (
    <div className="comments-panel">
      <div className="comments-panel__header">
        <h3>Kommentare</h3>
        <span>{comments.length} Eintraege</span>
      </div>

      {commentError ? (
        <div className="form-feedback form-feedback--error" role="alert">
          {commentError}
        </div>
      ) : null}

      {isLoadingComments ? (
        <div className="comments-empty-state">
          <p>Kommentare werden geladen...</p>
        </div>
      ) : null}

      {!isLoadingComments && comments.length === 0 ? (
        <div className="comments-empty-state">
          <p>Noch keine Kommentare vorhanden.</p>
        </div>
      ) : null}

      {!isLoadingComments && comments.length > 0 ? (
        <div className="comment-list">
          {comments.map((comment) => (
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
                      onClick={() => onStartCommentEdit(comment)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => onCommentDelete(comment.id!)}
                      disabled={deletingCommentId === comment.id}
                    >
                      {deletingCommentId === comment.id ? 'Loesche...' : 'Loeschen'}
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
        <label htmlFor="comment-draft">
          {isEditingComment ? 'Kommentar bearbeiten' : 'Neuen Kommentar schreiben'}
        </label>
        <textarea
          id="comment-draft"
          rows={4}
          placeholder="Rückfragen, Kontext oder Update zur Aufgabe festhalten."
          value={commentDraft}
          onChange={(event) => onCommentDraftChange(event.target.value)}
        />
        <div className="comment-composer__actions">
          <button
            className="button button--primary"
            type="button"
            onClick={() => void onCommentSubmit()}
            disabled={isSubmittingComment}
          >
            {isSubmittingComment
              ? 'Speichere Kommentar...'
              : isEditingComment
                ? 'Kommentar speichern'
                : 'Kommentar erstellen'}
          </button>
          {isEditingComment ? (
            <button
              className="button button--ghost"
              type="button"
              onClick={onCancelCommentEdit}
            >
              Abbrechen
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
