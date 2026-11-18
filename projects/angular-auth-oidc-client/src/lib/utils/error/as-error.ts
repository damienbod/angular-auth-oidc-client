export const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(error as string);
