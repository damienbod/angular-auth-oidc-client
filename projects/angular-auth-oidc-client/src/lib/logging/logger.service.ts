import { Injectable, inject } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { AbstractLoggerService } from './abstract-logger.service';
import { LogLevel } from './log-level';

type LogMethod = keyof AbstractLoggerService;

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly abstractLoggerService = inject(AbstractLoggerService);

  /**
   * Errors are logged even when no log level is configured. Only
   * `LogLevel.None` turns them off.
   */
  logError(
    configuration: OpenIdConfiguration | null | undefined,
    message: string | object,
    ...args: unknown[]
  ): void {
    if (configuration?.logLevel === LogLevel.None) {
      return;
    }

    this.log('logError', 'ERROR', configuration, message, args);
  }

  logWarning(
    configuration: OpenIdConfiguration | null | undefined,
    message: string | object,
    ...args: unknown[]
  ): void {
    if (!this.isEnabledFor(configuration, LogLevel.Warn)) {
      return;
    }

    this.log('logWarning', 'WARN', configuration, message, args);
  }

  logDebug(
    configuration: OpenIdConfiguration | null | undefined,
    message: string | object,
    ...args: unknown[]
  ): void {
    if (!this.isEnabledFor(configuration, LogLevel.Debug)) {
      return;
    }

    this.log('logDebug', 'DEBUG', configuration, message, args);
  }

  /**
   * True when a log level is configured, it is not `None` and it is equal to
   * or lower than the given level.
   */
  private isEnabledFor(
    configuration: OpenIdConfiguration | null | undefined,
    level: LogLevel
  ): boolean {
    const logLevel = configuration?.logLevel;

    if (logLevel === undefined || logLevel === null) {
      return false;
    }

    return logLevel !== LogLevel.None && logLevel <= level;
  }

  private log(
    method: LogMethod,
    label: string,
    configuration: OpenIdConfiguration | null | undefined,
    message: string | object,
    args: unknown[]
  ): void {
    const configId = configuration?.configId;
    const prefix = configId ? `[${label}] ${configId}` : `[${label}]`;
    const { text, originals } = this.formatMessage(message);

    this.abstractLoggerService[method](
      `${prefix} - ${text}`,
      ...originals,
      ...args
    );
  }

  /**
   * Strings are logged as they are and plain objects and arrays as JSON.
   * Anything else (an `Error`, a DOM element) or a value that cannot be
   * serialized (a circular object) is described in the text and also
   * passed on as it is, so a console can show its stack or contents.
   * Logging must never throw.
   */
  private formatMessage(message: string | object): {
    text: string;
    originals: unknown[];
  } {
    if (typeof message === 'string') {
      return { text: message, originals: [] };
    }

    if (this.isPlainObjectOrArray(message)) {
      try {
        return { text: JSON.stringify(message), originals: [] };
      } catch {
        // Not serializable, fall through and pass the value on as it is.
      }
    }

    return { text: String(message), originals: [message] };
  }

  private isPlainObjectOrArray(value: unknown): boolean {
    const tag = Object.prototype.toString.call(value);

    return tag === '[object Object]' || tag === '[object Array]';
  }
}
