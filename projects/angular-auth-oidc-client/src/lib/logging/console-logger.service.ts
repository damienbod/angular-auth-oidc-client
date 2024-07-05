import { Injectable } from '@angular/core';
import { AbstractLoggerService } from './abstract-logger.service';

@Injectable({ providedIn: 'root' })
export class ConsoleLoggerService implements AbstractLoggerService {
  logError(message: string | object, ...args: any[]): void {
    console.error(message, ...args);
  }

  logWarning(message: string | object, ...args: any[]): void {
    console.warn(message, ...args);
  }

  logDebug(message: string | object, ...args: any[]): void {
    console.debug(message, ...args);
  }
}
