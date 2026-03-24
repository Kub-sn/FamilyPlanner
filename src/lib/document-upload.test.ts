import { describe, expect, it } from 'vitest';
import {
  getDocumentNameFromFile,
  mergeDocumentFiles,
  resolveDocumentMetadata,
  validateSelectedDocumentFiles,
} from './document-upload';

describe('document upload helpers', () => {
  it('merges dropped files instead of replacing them', () => {
    const first = new File(['a'], 'erste.pdf', { type: 'application/pdf', lastModified: 1 });
    const second = new File(['b'], 'zweite.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      lastModified: 2,
    });

    expect(mergeDocumentFiles([first], [second])).toEqual([first, second]);
  });

  it('deduplicates identical files during repeated drops', () => {
    const first = new File(['a'], 'erste.pdf', { type: 'application/pdf', lastModified: 1 });

    expect(mergeDocumentFiles([first], [first])).toEqual([first]);
  });

  it('derives defaults for uploaded files', () => {
    const file = new File(['a'], 'urlaub-foto.jpg', { type: 'image/jpeg' });

    expect(resolveDocumentMetadata({ name: '', category: '', status: '', file })).toEqual({
      name: 'urlaub-foto',
      category: 'Dokument',
      status: 'Neu',
    });
    expect(getDocumentNameFromFile(file)).toBe('urlaub-foto');
  });

  it('rejects files above the size limit', () => {
    const tooLarge = new File(['a'.repeat(16 * 1024 * 1024)], 'zu-gross.pdf', {
      type: 'application/pdf',
    });

    expect(validateSelectedDocumentFiles([tooLarge])[0]).toMatch(/15 MB/);
  });

  it('returns one validation error per invalid file', () => {
    const tooLarge = new File(['a'.repeat(16 * 1024 * 1024)], 'zu-gross.pdf', {
      type: 'application/pdf',
    });
    const unsupported = new File(['x'], 'archiv.zip', { type: 'application/zip' });

    expect(validateSelectedDocumentFiles([tooLarge, unsupported])).toEqual([
      'zu-gross.pdf ist zu groß. Maximal erlaubt sind 15 MB pro Datei.',
      'archiv.zip wird nicht unterstützt. Erlaubt sind PDF, Bilder sowie Word-Dateien.',
    ]);
  });
});