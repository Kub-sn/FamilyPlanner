import { useCallback, useState } from 'react';
import { nextStringId } from '../lib/id';
import type { ToastItem, ToastTone } from '../app/types';

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message: string, tone: ToastTone) => {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) {
      return;
    }

    setToasts((current) => {
      if (current.some((toast) => toast.message === normalizedMessage && toast.tone === tone)) {
        return current;
      }

      return [
        ...current,
        {
          id: nextStringId(),
          message: normalizedMessage,
          tone,
        },
      ];
    });
  }, []);

  return { toasts, pushToast, dismissToast };
}
