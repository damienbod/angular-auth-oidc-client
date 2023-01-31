import { Injectable } from '@angular/core';

/**
 * Implement this class-interface to create a custom logger service.
 */
@Injectable({ providedIn: 'root' })
export abstract class AbstractLoggerService {
  abstract logError(message: any, ...args: any[]): void;

  abstract logWarning(message: any, ...args: any[]): void;

  abstract logDebug(message: any, ...args: any[]): void;
}
