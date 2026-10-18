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
