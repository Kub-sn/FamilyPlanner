import type { ReactNode } from 'react';

export function ModalDialog({
  actions,
  children,
  className,
  eyebrow,
  id,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  id: string;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center p-6 bg-[rgba(24,52,47,0.5)] backdrop-blur-[10px]" role="presentation">
      <section
        className={`w-[min(560px,100%)] max-h-[min(88vh,1000px)] min-w-0 overflow-auto grid gap-4 p-5 rounded-[28px] bg-[rgba(255,250,244,0.97)] border border-[rgba(24,52,47,0.1)] shadow-[0_28px_70px_rgba(24,52,47,0.22)] ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
      >
        <div className="block min-w-0">
          <div className="w-auto min-w-0">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h3 id={id} className="break-words">{title}</h3>
          </div>
        </div>
        {children}
        {actions ? <div className="flex justify-end flex-wrap gap-3">{actions}</div> : null}
      </section>
    </div>
  );
}