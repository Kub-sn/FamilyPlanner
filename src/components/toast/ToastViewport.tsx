import { useEffect } from 'react';
import type { ToastItem } from '../../app/types';

const TOAST_LIFETIME_MS = 5000;

const TONE_CLASSES: Record<ToastItem['tone'], string> = {
  success:
    'text-forest-950 border-forest-950/16 bg-linear-to-b from-[rgba(242,249,245,0.98)] to-[rgba(255,255,255,0.94)]',
  info:
    'text-forest-950 border-forest-950/12 bg-linear-to-b from-[rgba(244,248,247,0.98)] to-[rgba(255,255,255,0.94)]',
  warning:
    'text-ember-900 border-ember-800/16 bg-linear-to-b from-[rgba(255,247,239,0.98)] to-[rgba(255,252,248,0.94)]',
  error:
    'text-ember-900 border-ember-800/[0.22] bg-linear-to-b from-[rgba(255,240,234,0.98)] to-[rgba(255,250,247,0.94)]',
};

function NotificationToast({
  id,
  message,
  tone,
  onDismiss,
}: ToastItem & {
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss(id);
    }, TOAST_LIFETIME_MS);

    return () => window.clearTimeout(timeoutId);
  }, [id, onDismiss]);

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-3.5 items-start w-[min(24rem,calc(100vw-2.2rem))] max-sm:w-full py-3.5 pr-3.5 pl-4 border rounded-2xl shadow-[0_20px_44px_rgba(20,40,35,0.16)] backdrop-blur-[18px] pointer-events-auto ${TONE_CLASSES[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <p className="m-0 leading-[1.45]">{message}</p>
      <button
        type="button"
        className="border-none bg-transparent text-current text-[0.9rem] leading-none p-0.5 cursor-pointer opacity-72 hover:opacity-100 focus-visible:opacity-100"
        aria-label="Hinweis schliessen"
        onClick={() => onDismiss(id)}
      >
        X
      </button>
    </li>
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 max-sm:top-3.5 max-sm:right-3.5 max-sm:left-3.5 z-[1200] pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <ol className="grid gap-3 m-0 p-0 list-none">
        {toasts.map((toast) => (
          <NotificationToast key={toast.id} {...toast} onDismiss={onDismiss} />
        ))}
      </ol>
    </div>
  );
}