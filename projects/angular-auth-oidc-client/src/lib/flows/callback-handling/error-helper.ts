import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

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
 * checks if a failed refresh can be tried again with the stored tokens,
 * because the token endpoint could not be reached or did not answer in time
 * @param error
 * @returns true if the error is a network error or a timeout
 */
export const isTransientRefreshError = (error: unknown): boolean =>
  isNetworkError(error) || error instanceof TimeoutError;
