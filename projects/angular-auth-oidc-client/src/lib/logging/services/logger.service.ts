import { Injectable, inject } from '@angular/core';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { isString } from '../../utils/string/string.utils';
import {
  FormattedMessage,
  LogLabel,
  LogLevel,
  LogMethod,
} from '../types/logging.types';
import { AbstractLoggerService } from './abstract-logger.service';

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
    if (this.loggingIsTurnedOff(configuration)) {
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

  private isEnabledFor(
    configuration: OpenIdConfiguration | null | undefined,
    level: LogLevel
  ): boolean {
    return (
      this.logLevelIsSet(configuration) &&
      !this.loggingIsTurnedOff(configuration) &&
      this.currentLogLevelIsEqualOrSmallerThan(configuration, level)
    );
  }

  private logLevelIsSet(
    configuration: OpenIdConfiguration | null | undefined
  ): boolean {
    const logLevel = configuration?.logLevel;

    return logLevel !== undefined && logLevel !== null;
  }

  private loggingIsTurnedOff(
    configuration: OpenIdConfiguration | null | undefined
  ): boolean {
    return configuration?.logLevel === LogLevel.None;
  }

  private currentLogLevelIsEqualOrSmallerThan(
    configuration: OpenIdConfiguration | null | undefined,
    level: LogLevel
  ): boolean {
    const logLevel = configuration?.logLevel;

    if (!logLevel) {
      return false;
    }

    return logLevel <= level;
  }

  private log(
    method: LogMethod,
    label: LogLabel,
    configuration: OpenIdConfiguration | null | undefined,
    message: string | object,
    args: unknown[]
  ): void {
    const prefix = this.createPrefix(label, configuration);
    const { text, originals } = this.formatMessage(message);

    this.abstractLoggerService[method](
      `${prefix} - ${text}`,
      ...originals,
      ...args
    );
  }

  private createPrefix(
    label: LogLabel,
    configuration: OpenIdConfiguration | null | undefined
  ): string {
    const configId = configuration?.configId;

    return configId ? `[${label}] ${configId}` : `[${label}]`;
  }

  /**
   * Strings are logged as they are and plain objects and arrays as JSON.
   * Anything else (an `Error`, a DOM element) or a value that cannot be
   * serialized (a circular object) is described in the text and also
   * passed on as it is, so a console can show its stack or contents.
   * Logging must never throw.
   */
  private formatMessage(message: string | object): FormattedMessage {
    if (isString(message)) {
      return this.formatAsText(message);
    }

    if (this.isObject(message) || Array.isArray(message)) {
      return this.formatAsJsonOrOriginal(message);
    }

    return this.formatAsOriginal(message);
  }

  private formatAsText(message: string): FormattedMessage {
    return { text: message, originals: [] };
  }

  private formatAsJsonOrOriginal(message: object): FormattedMessage {
    try {
      return { text: JSON.stringify(message), originals: [] };
    } catch {
      return this.formatAsOriginal(message);
    }
  }

  private formatAsOriginal(message: object): FormattedMessage {
    return { text: String(message), originals: [message] };
  }

  private isObject(possibleObject: unknown): boolean {
    return Object.prototype.toString.call(possibleObject) === '[object Object]';
  }
}
