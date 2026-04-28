export type FieldErrors = Record<string, string>;

export type RequiredFieldSpec = { name: string; label: string };

export function validateRequiredFields(
  form: FormData,
  fields: ReadonlyArray<RequiredFieldSpec>,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of fields) {
    const raw = form.get(field.name);
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) {
      errors[field.name] = `${field.label} ist erforderlich.`;
    }
  }
  return errors;
}
