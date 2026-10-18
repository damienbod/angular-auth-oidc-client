/**
 * True when the given value is a primitive string.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
