import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { cn } from '../../lib/cn';
import { keys } from '../../hooks/useContent';
import { resolveImageUrl } from '../../lib/resolveImageUrl';
import type { MediaItem } from '../../../../shared/types';

export const AdminCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn('panel p-5', className)}>{children}</div>;

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {title}
      </h1>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export const FormField = ({
  label,
  htmlFor,
  required,
  helpText,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {label}
      {required ? <span className="ml-0.5 text-danger">*</span> : null}
    </label>
    {children}
    {helpText ? <p className="text-xs text-faint">{helpText}</p> : null}
  </div>
);

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const { className, ...rest } = props;
  return <input {...rest} className={cn(inputClass, className)} />;
};

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const { className, rows = 4, ...rest } = props;
  return <textarea {...rest} rows={rows} className={cn(inputClass, 'resize-y', className)} />;
};

export interface SelectOption {
  value: string;
  label: string;
}

export const SelectInput = ({
  options,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) => (
  <select {...rest} className={cn(inputClass, 'appearance-none')}>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

export const CheckboxInput = ({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) => (
  <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-foreground">
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-border accent-[var(--primary)]"
    />
    {label}
  </label>
);

export const TagsInput = ({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  id?: string;
}) => {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const parts = draft
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      const existing = new Set(value);
      onChange([...value, ...parts.filter((p) => !existing.has(p))]);
    }
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-2">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-primary/70 hover:text-danger"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        placeholder={placeholder ?? 'Type and press Enter'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-foreground placeholder:text-faint focus:outline-none"
      />
    </div>
  );
};

export const ImagePickerInput = ({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (url: string) => void;
  id?: string;
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mediaQuery = useQuery({
    queryKey: keys.media(),
    queryFn: () => api.getMedia(),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1.5">
      <div className="flex gap-2">
        <TextInput id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/... or https://..." />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="shrink-0 rounded-lg border border-border bg-elevated px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
        >
          Browse media
        </button>
      </div>
      {open ? (
        <div className="absolute top-full z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card p-3 shadow-xl">
          {mediaQuery.isLoading ? (
            <p className="py-4 text-center text-sm text-faint">Loading media…</p>
          ) : (mediaQuery.data?.length ?? 0) === 0 ? (
            <p className="py-4 text-center text-sm text-faint">No media uploaded yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(mediaQuery.data ?? []).map((m: MediaItem) => (
                <button
                  key={m._id}
                  type="button"
                  title={m.originalName}
                  onClick={() => {
                    onChange(m.url);
                    setOpen(false);
                  }}
                  className={cn(
                    'aspect-square overflow-hidden rounded-md border-2 transition',
                    value === m.url ? 'border-primary' : 'border-transparent hover:border-primary/50'
                  )}
                >
                  {m.mimeType.startsWith('image/') ? (
                    <img src={resolveImageUrl(m.url)} alt={m.altText ?? m.originalName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-elevated text-[10px] text-muted">
                      {m.mimeType.replace('application/', '')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export const Drawer = ({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep onClose in a ref so the effect below does not re-run (and steal focus
  // from form inputs) every time the parent re-renders with a new callback.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
};

export const ConfirmButton = ({
  onConfirm,
  label,
  confirmMessage,
  className,
  ariaLabel,
  children,
}: {
  onConfirm: () => void;
  label?: string;
  confirmMessage: string;
  className?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={ariaLabel ?? label}
    className={
      className ??
      'rounded-lg border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger transition hover:bg-danger/10'
    }
    onClick={() => {
      if (window.confirm(confirmMessage)) onConfirm();
    }}
  >
    {children ?? label}
  </button>
);

export const InlineBanner = ({
  tone,
  message,
  onDismiss,
}: {
  tone: 'success' | 'error';
  message: string;
  onDismiss?: () => void;
}) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={cn(
      'mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm',
      tone === 'success'
        ? 'border-success/30 bg-success/10 text-success'
        : 'border-danger/30 bg-danger/10 text-danger'
    )}
  >
    <span>{message}</span>
    {onDismiss ? (
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
        ×
      </button>
    ) : null}
  </div>
);

export const StatCard = ({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
}) => {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className="panel flex flex-col gap-1 p-5 text-left transition hover:border-primary/40"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-faint">{label}</span>
      <span className="font-heading text-3xl font-bold text-foreground">{value}</span>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </Wrapper>
  );
};

export const useAutoDismissBanner = () => {
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 3500);
    return () => window.clearTimeout(t);
  }, [banner]);
  return { banner, setBanner };
};
