type ErrorWithMessage = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return typeof error === 'object' && error !== null;
}

export function humanizeAuthError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (isErrorWithMessage(error) && typeof error.message === 'string' && error.message.trim()) {
    const parts = [error.message.trim()];

    if (typeof error.details === 'string' && error.details.trim()) {
      parts.push(error.details.trim());
    }

    if (typeof error.hint === 'string' && error.hint.trim()) {
      parts.push(`Hinweis: ${error.hint.trim()}`);
    }

    return parts.join(' ');
  }

  return 'Die Anfrage konnte nicht verarbeitet werden.';
}
