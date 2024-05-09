import { HttpErrorResponse } from '@angular/common/http';

/**
 * checks if the error is a network error
 * by checking if either internal error is a ProgressEvent with type error
 * or another error with status 0
 * @param error
 * @returns true if the error is a network error
 */
export const isNetworkError = (error: unknown): boolean =>
  !!error &&
  error instanceof HttpErrorResponse &&
  ((error.error instanceof ProgressEvent && error.error.type === 'error') ||
    (error.status === 0 && !!error.error));
