import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { useContactMessages } from '../../hooks/useContent';
import type { ContactStatus } from '../../../../shared/types';
import { cn } from '../../lib/cn';
import { EmptyState, ErrorState, Skeleton } from '../ui/primitives';
import { ConfirmButton, InlineBanner, PageHeader, useAutoDismissBanner } from './ui';

const TABS: Array<{ value: 'all' | ContactStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
];

export default function Inbox() {
  const { banner, setBanner } = useAutoDismissBanner();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'all' | ContactStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const messagesQuery = useContactMessages();

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['contact-messages'] });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      api.patch('contact', id, { status }),
    onSuccess: invalidate,
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Failed to update message.',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove('contact', id),
    onSuccess: (_data, id) => {
      setSelectedId((cur) => (cur === id ? null : cur));
      invalidate();
      setBanner({ tone: 'success', message: 'Message deleted.' });
    },
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Delete failed.',
      }),
  });

  const messages = messagesQuery.data ?? [];
  const filtered = useMemo(
    () => (tab === 'all' ? messages : messages.filter((m) => m.status === tab)),
    [messages, tab]
  );
  const selected = messages.find((m) => m._id === selectedId) ?? null;

  return (
    <div>
      <PageHeader title="Inbox" description="Messages submitted through the contact form." />

      {banner ? <InlineBanner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      <div className="mb-4 flex gap-1.5" role="tablist" aria-label="Filter by status">
        {TABS.map((t) => {
          const count =
            t.value === 'all'
              ? messages.length
              : messages.filter((m) => m.status === t.value).length;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                tab === t.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-elevated hover:text-foreground'
              )}
            >
              {t.label}
              <span className="ml-1 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {messagesQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : messagesQuery.isError ? (
        <ErrorState
          message={
            messagesQuery.error instanceof ApiError ? messagesQuery.error.message : 'Failed to load messages.'
          }
          onRetry={() => void messagesQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState message={tab === 'all' ? 'No messages yet.' : `No ${tab} messages.`} />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <ul className="flex flex-col gap-2">
            {filtered.map((m) => (
              <li key={m._id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(m._id ?? null);
                    if (m.status === 'unread' && m._id) {
                      statusMutation.mutate({ id: m._id, status: 'read' });
                    }
                  }}
                  className={cn(
                    'panel w-full px-4 py-3 text-left transition hover:border-primary/40',
                    selectedId === m._id && 'border-primary/60',
                    m.status === 'unread' && 'border-l-4 border-l-primary'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {m.status === 'unread' ? (
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{m.subject}</span>
                    <span className="shrink-0 text-xs text-faint">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {m.name} · {m.email}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <div className="panel p-5">
              <h2 className="font-heading text-lg font-semibold text-foreground">{selected.subject}</h2>
              <p className="mt-1 text-sm text-muted">
                {selected.name}
                {selected.organization ? ` · ${selected.organization}` : ''} ·{' '}
                <a href={`mailto:${selected.email}`} className="text-primary hover:underline">
                  {selected.email}
                </a>
              </p>
              <p className="mt-0.5 text-xs text-faint">
                Purpose: {selected.purpose}
                {selected.createdAt ? ` · ${new Date(selected.createdAt).toLocaleString()}` : ''}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{selected.message}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
                >
                  Reply via email
                </a>
                {selected.status !== 'replied' ? (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => selected._id && statusMutation.mutate({ id: selected._id, status: 'replied' })}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-50"
                  >
                    Mark replied
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => selected._id && statusMutation.mutate({ id: selected._id, status: 'read' })}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-50"
                  >
                    Mark unread
                  </button>
                )}
                <ConfirmButton
                  ariaLabel={`Delete message "${selected.subject}"`}
                  confirmMessage={`Delete the message "${selected.subject}"? This cannot be undone.`}
                  onConfirm={() => selected._id && deleteMutation.mutate(selected._id)}
                  className="ml-auto rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10"
                >
                  Delete
                </ConfirmButton>
              </div>
            </div>
          ) : (
            <div className="panel hidden items-center justify-center p-10 text-sm text-faint lg:flex">
              Select a message to read it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
