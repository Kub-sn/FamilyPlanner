import { describe, expect, it } from 'vitest';
import { humanizeAuthError } from './auth-errors';

describe('humanizeAuthError', () => {
  it('returns the message from regular Error instances', () => {
    expect(humanizeAuthError(new Error('Kaputt'))).toBe('Kaputt');
  });

  it('returns message, details and hint from Supabase-style error objects', () => {
    expect(
      humanizeAuthError({
        message: 'relation "profiles" does not exist',
        details: 'The table public.profiles is missing.',
        hint: 'Run the SQL schema.',
      }),
    ).toBe(
      'relation "profiles" does not exist The table public.profiles is missing. Hinweis: Run the SQL schema.',
    );
  });
});
