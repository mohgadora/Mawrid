/**
 * lib/errors.ts — أخطاء قابلة للتعامل من طبقة API.
 */
export class ValidationError extends Error {
  readonly isValidationError = true as const
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  readonly isNotFoundError = true as const
  constructor(message = 'Not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  readonly isUnauthorizedError = true as const
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  readonly isForbiddenError = true as const
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export function isValidationError(err: unknown): err is ValidationError {
  return (
    err instanceof ValidationError ||
    (typeof err === 'object' && err !== null && (err as { isValidationError?: boolean }).isValidationError === true)
  )
}

export function isNotFoundError(err: unknown): err is NotFoundError {
  return (
    err instanceof NotFoundError ||
    (typeof err === 'object' && err !== null && (err as { isNotFoundError?: boolean }).isNotFoundError === true)
  )
}

export function isUnauthorizedError(err: unknown): err is UnauthorizedError {
  return (
    err instanceof UnauthorizedError ||
    (typeof err === 'object' && err !== null && (err as { isUnauthorizedError?: boolean }).isUnauthorizedError === true)
  )
}
