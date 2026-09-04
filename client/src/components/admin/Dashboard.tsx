import { Link, useNavigate } from 'react-router-dom';
import { useAllRecords, useAuditLogs, useContactMessages, useCvVersions, useResource } from '../../hooks/useContent';
import { ApiError } from '../../lib/api';
import { EmptyState, Skeleton } from '../ui/primitives';
import { AdminCard, PageHeader, StatCard } from './ui';

const COUNTED_RESOURCES: Array<{ key: string; label: string }> = [
  { key: 'projects', label: 'Projects' },
  { key: 'publications', label: 'Publications' },
  { key: 'education', label: 'Education' },
  { key: 'experience', label: 'Experience' },
  { key: 'skills', label: 'Skills' },
];

const QUICK_LINKS = [
  { to: '/admin/resources/projects', label: 'Add a project' },
  { to: '/admin/resources/publications', label: 'Add a publication' },
  { to: '/admin/media', label: 'Upload media' },
  { to: '/admin/cv', label: 'Upload CV' },
  { to: '/admin/settings', label: 'Site settings' },
  { to: '/admin/theme', label: 'Theme' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const inboxQuery = useContactMessages();
  const mediaQuery = useResource('media');
  const cvQuery = useCvVersions();
  const auditQuery = useAuditLogs();

  const unread = (inboxQuery.data ?? []).filter((m) => m.status === 'unread').length;
  const activeCv = (cvQuery.data ?? []).find((c) => c.active);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your portfolio content and activity."
        actions={
          <a
            href="/"
            target="_self"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground"
          >
            View site
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Unread messages"
          value={inboxQuery.isLoading ? '…' : unread}
          hint={`${(inboxQuery.data ?? []).length} total`}
          onClick={() => navigate('/admin/inbox')}
        />
        <StatCard
          label="Media files"
          value={mediaQuery.isLoading ? '…' : (mediaQuery.data ?? []).length}
          onClick={() => navigate('/admin/media')}
        />
        <StatCard
          label="Active CV"
          value={cvQuery.isLoading ? '…' : cvQuery.isError ? '—' : activeCv ? 'Yes' : 'None'}
          hint={
            cvQuery.isError
              ? 'Could not load CV — click to retry in CV Manager'
              : activeCv
                ? activeCv.label
                : 'Upload one in CV Manager'
          }
          onClick={() => {
            if (cvQuery.isError) void cvQuery.refetch();
            navigate('/admin/cv');
          }}
        />
        {COUNTED_RESOURCES.map(({ key, label }) => (
          <CountCard key={key} resource={key} label={label} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Quick links</h2>
          <ul className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="inline-block rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:border-primary/40 hover:text-primary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Recent activity</h2>
            <Link to="/admin/audit" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {auditQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : auditQuery.isError ? (
            <p className="text-sm text-faint">
              {auditQuery.error instanceof ApiError ? auditQuery.error.message : 'Audit log unavailable.'}
            </p>
          ) : (auditQuery.data ?? []).length === 0 ? (
            <EmptyState message="No activity recorded yet." />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {(auditQuery.data ?? []).slice(0, 8).map((log, i) => (
                <li key={String(log._id ?? i)} className="flex items-center gap-2 py-2 text-sm">
                  <span className="rounded bg-elevated px-1.5 py-0.5 text-xs font-medium text-muted">
                    {String(log.action ?? '')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-muted">{String(log.resource ?? '')}</span>
                  <span className="shrink-0 text-xs text-faint">
                    {typeof log.createdAt === 'string' ? new Date(log.createdAt).toLocaleString() : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}

const CountCard = ({ resource, label }: { resource: string; label: string }) => {
  const query = useAllRecords(resource);
  const navigate = useNavigate();
  return (
    <StatCard
      label={label}
      value={query.isLoading ? '…' : (query.data ?? []).length}
      onClick={() => navigate(`/admin/resources/${resource}`)}
    />
  );
};
