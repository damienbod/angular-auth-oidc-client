import type { AbstractLoggerService } from '../services/abstract-logger.service';

/**
 * The order matters: a message is logged when the configured level is
 * equal to or lower than the level of the message. `None` turns all
 * logging off, including errors.
 */
export enum LogLevel {
  None = 0,
  Debug = 1,
  Warn = 2,
  Error = 3,
}

export type LogMethod = keyof AbstractLoggerService;

export type LogLabel = 'ERROR' | 'WARN' | 'DEBUG';

/**
 * The text that goes into the log line and the values that are passed on
 * as they are, so a console can show their stack or contents.
 */
export interface FormattedMessage {
  text: string;
  originals: unknown[];
}
