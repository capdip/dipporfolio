import { useMemo, useState } from 'react';
import { useAuditLogs } from '../../hooks/useContent';
import { ApiError } from '../../lib/api';
import type { AuditLogEntry } from '../../../../shared/types';
import { EmptyState, ErrorState, Skeleton } from '../ui/primitives';
import { PageHeader, SelectInput } from './ui';

export default function AuditLogViewer() {
  const logsQuery = useAuditLogs();
  const [action, setAction] = useState('all');

  const logs = (logsQuery.data ?? []) as unknown as AuditLogEntry[];

  const actions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action).filter(Boolean))).sort(),
    [logs]
  );
  const filtered = useMemo(
    () => (action === 'all' ? logs : logs.filter((l) => l.action === action)),
    [logs, action]
  );

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Recent administrative activity, newest first."
        actions={
          <SelectInput
            aria-label="Filter by action"
            value={action}
            options={[
              { value: 'all', label: 'All actions' },
              ...actions.map((a) => ({ value: a, label: a })),
            ]}
            onChange={(e) => setAction(e.target.value)}
          />
        }
      />

      {logsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : logsQuery.isError ? (
        <ErrorState
          message={logsQuery.error instanceof ApiError ? logsQuery.error.message : 'Failed to load audit log.'}
          onRetry={() => void logsQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState message={action === 'all' ? 'No audit entries yet.' : `No "${action}" entries.`} />
      ) : (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-faint">
                <th scope="col" className="px-4 py-3 font-semibold">Timestamp</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actor</th>
                <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                <th scope="col" className="px-4 py-3 font-semibold">Resource</th>
                <th scope="col" className="px-4 py-3 font-semibold">Resource ID</th>
                <th scope="col" className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log, i) => (
                <tr key={String(log._id ?? i)} className="text-muted transition hover:bg-elevated/50">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-2.5">{log.actorEmail ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-elevated px-1.5 py-0.5 text-xs font-medium text-foreground">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{log.resource}</td>
                  <td className="max-w-[8rem] truncate px-4 py-2.5 text-xs">{log.resourceId ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs">{log.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
