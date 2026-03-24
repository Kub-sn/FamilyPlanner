import { describe, expect, it } from 'vitest';
import { resolveSupabasePublicKey } from './supabase-config';

describe('resolveSupabasePublicKey', () => {
  it('prefers the publishable key when it is present', () => {
    expect(
      resolveSupabasePublicKey({
        VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
        VITE_SUPABASE_ANON_KEY: 'legacy-anon-key',
      }),
    ).toBe('publishable-key');
  });

  it('falls back to the legacy anon key', () => {
    expect(
      resolveSupabasePublicKey({
        VITE_SUPABASE_ANON_KEY: 'legacy-anon-key',
      }),
    ).toBe('legacy-anon-key');
  });
});
