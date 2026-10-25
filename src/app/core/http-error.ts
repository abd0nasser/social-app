import { HttpErrorResponse } from '@angular/common/http';

/** Turn any HTTP failure into one readable message for the UI. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { message?: string; errors?: unknown[] } | null;
    if (body?.errors?.length) return body.errors.map(String).join(' · ');
    if (body?.message) return body.message;
    if (err.status === 0) return 'Cannot reach the server. Check your connection.';
  }
  return 'Something went wrong. Please try again.';
}
