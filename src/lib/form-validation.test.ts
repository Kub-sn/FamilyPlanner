import { describe, expect, it } from 'vitest';
import { validateRequiredFields } from './form-validation';

describe('validateRequiredFields', () => {
  it('returns errors for missing or whitespace-only required fields', () => {
    const form = new FormData();
    form.set('title', 'Hello');
    form.set('owner', '   ');
    // 'due' is missing entirely

    const errors = validateRequiredFields(form, [
      { name: 'title', label: 'Titel' },
      { name: 'owner', label: 'Verantwortlich' },
      { name: 'due', label: 'Fällig am' },
    ]);

    expect(errors).toEqual({
      owner: 'Verantwortlich ist erforderlich.',
      due: 'Fällig am ist erforderlich.',
    });
  });

  it('returns an empty object when all required fields are filled', () => {
    const form = new FormData();
    form.set('a', 'one');
    form.set('b', 'two');

    const errors = validateRequiredFields(form, [
      { name: 'a', label: 'A' },
      { name: 'b', label: 'B' },
    ]);

    expect(errors).toEqual({});
  });
});
