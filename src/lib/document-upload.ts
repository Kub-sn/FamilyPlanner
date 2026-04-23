export const MAX_DOCUMENT_UPLOAD_BYTES = 15 * 1024 * 1024;

const WORD_MIME_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function getDocumentNameFromFile(file: File) {
  return file.name.replace(/\.[^.]+$/, '') || file.name;
}

export function mergeDocumentFiles(current: File[], incoming: File[]) {
  const merged = [...current];

  for (const file of incoming) {
    const alreadyIncluded = merged.some(
      (entry) =>
        entry.name === file.name &&
        entry.size === file.size &&
        entry.lastModified === file.lastModified,
    );

    if (!alreadyIncluded) {
      merged.push(file);
    }
  }

  return merged;
}

export function validateSelectedDocumentFiles(files: File[]) {
  const errors: string[] = [];

  for (const file of files) {
    const lowerName = file.name.toLowerCase();
    const allowedType =
      file.type === 'application/pdf' ||
      file.type.startsWith('image/') ||
      WORD_MIME_TYPES.has(file.type) ||
      lowerName.endsWith('.pdf') ||
      lowerName.endsWith('.doc') ||
      lowerName.endsWith('.docx');

    if (!allowedType) {
      errors.push(
        `${file.name} wird nicht unterstützt. Erlaubt sind PDF, Bilder sowie Word-Dateien.`,
      );
      continue;
    }

    if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
      errors.push(`${file.name} ist zu groß. Maximal erlaubt sind 15 MB pro Datei.`);
    }
  }

  return errors;
}

export function resolveDocumentMetadata(input: {
  name: string;
  file?: File | null;
}) {
  return {
    name: input.name || (input.file ? getDocumentNameFromFile(input.file) : 'Dokument'),
  };
}