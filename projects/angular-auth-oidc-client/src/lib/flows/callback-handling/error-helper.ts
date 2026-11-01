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

/**
 * Returns the error as an `Error` instance. Values that are not an `Error`,
 * e.g. an `HttpErrorResponse` or a string, are wrapped in a new `Error` with
 * the original value kept in `cause`.
 * @param error
 * @returns the error, or a new `Error` wrapping it
 */
export const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(getErrorMessage(error), { cause: error });
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (
    !!error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return error === undefined || error === null
    ? 'Unknown error'
    : String(error);
};
