import type {
  CreateTaskRequest,
  TaskPriority,
  TaskStatus,
} from '../../api/tasks'

export const STATUS_OPTIONS: Array<{ label: string; value: TaskStatus | 'ALL' }> = [
  { label: 'Beliebig', value: 'ALL' },
  { label: 'To do', value: 'TODO' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'In review', value: 'IN_REVIEW' },
  { label: 'Done', value: 'DONE' },
]

export const PRIORITY_OPTIONS: Array<{ label: string; value: TaskPriority | 'ALL' }> = [
  { label: 'Beliebig', value: 'ALL' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

export const TASK_FORM_PRIORITY_OPTIONS: Array<{
  label: string
  value: NonNullable<CreateTaskRequest['priority']>
}> = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

export type TaskFormValues = {
  title: string
  description: string
  priority: NonNullable<CreateTaskRequest['priority']>
  dueDate: string
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>

export function normalizeTaskPriority(
  priority?: string,
): NonNullable<CreateTaskRequest['priority']> {
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

export function normalizeTaskStatus(status?: string): TaskStatus {
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

export function normalizeDateInput(value?: string) {
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
