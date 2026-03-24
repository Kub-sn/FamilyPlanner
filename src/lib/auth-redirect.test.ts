import { describe, expect, it } from 'vitest';
import { clearAuthRedirectState, getAuthRedirectMessage } from './auth-redirect';

describe('auth redirect helpers', () => {
  it('detects a successful signup confirmation redirect', () => {
    expect(
      getAuthRedirectMessage(
        'http://localhost:5173/#access_token=test-token&type=signup&expires_in=3600',
      ),
    ).toBe('E-Mail bestätigt. Du bist jetzt erfolgreich angemeldet.');
  });

  it('clears auth callback parameters from the url', () => {
    expect(
      clearAuthRedirectState(
        'http://localhost:5173/?code=abc#access_token=test-token&type=signup',
      ),
    ).toBe('/');
  });
});
