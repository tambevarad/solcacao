/** Thrown by template stubs so callers can show a labeled "pending" state instead of crashing. */
export class NotImplementedError extends Error {
  constructor(public feature: string) {
    super(`Template stub: implement ${feature} in the assigned phase`);
    this.name = 'NotImplementedError';
  }
}
export function notImplemented(feature: string): never {
  throw new NotImplementedError(feature);
}
