import { Injectable } from '@angular/core';
import { ConsoleLoggerService } from './console-logger.service';

/**
 * Implement this class-interface to create a custom logger service.
 * Without a custom provider, messages go to the console.
 */
@Injectable({ providedIn: 'root', useClass: ConsoleLoggerService })
export abstract class AbstractLoggerService {
  abstract logError(message: string | object, ...args: any[]): void;

  abstract logWarning(message: string | object, ...args: any[]): void;

  abstract logDebug(message: string | object, ...args: any[]): void;
}
