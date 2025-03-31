/**
 * Creates a RegExp from the given string, converting asterisks to .* expressions,
 * and escaping all other characters.
 */
export function wildcardToRegExp(value: string): RegExp {
  const regexPattern = regExpEscape(value);

  return new RegExp(`^${regexPattern}$`);
}

/**
 * RegExp-escapes all characters in the given string.
 */
function regExpEscape(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
}
