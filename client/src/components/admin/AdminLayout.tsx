import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/Providers';
import { cn } from '../../lib/cn';
import { useStorageStatus } from '../../hooks/useStorageStatus';

interface NavEntry {
  to: string;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavEntry[];
}

const RESOURCE_LABELS: Record<string, string> = {
  education: 'Education',
  research: 'Research',
  projects: 'Projects',
  publications: 'Publications',
  experience: 'Experience',
  internships: 'Internships',
  'research-experience': 'Research Experience',
  skills: 'Skills',
  conferences: 'Conferences',
  training: 'Training',
  memberships: 'Memberships',
  languages: 'Languages',
  hobbies: 'Hobbies',
  recommendations: 'Recommendations',
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Content',
    items: Object.entries(RESOURCE_LABELS).map(([key, label]) => ({
      to: `/admin/resources/${key}`,
      label,
    })),
  },
  {
    title: 'Structure',
    items: [{ to: '/admin/about', label: 'About Section' }],
  },
  {
    title: 'Library',
    items: [
      { to: '/admin/media', label: 'Media Library' },
      { to: '/admin/cv', label: 'CV Manager' },
      { to: '/admin/blog', label: 'Blog Posts' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { to: '/admin/inbox', label: 'Inbox' },
      { to: '/admin/audit', label: 'Audit Log' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { to: '/admin/settings', label: 'Settings' },
      { to: '/admin/theme', label: 'Theme' },
    ],
  },
];

const TITLE_OVERRIDES: Record<string, string> = {
  about: 'About Section',
  media: 'Media Library',
  cv: 'CV Manager',
  blog: 'Blog Posts',
  inbox: 'Inbox',
  settings: 'Settings',
  theme: 'Theme',
  audit: 'Audit Log',
};

export default function AdminLayout() {
    const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isInMemory } = useStorageStatus();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const segments = location.pathname.replace(/^\/admin\/?/, '').split('/');
  let pageTitle = 'Dashboard';
  if (segments[0] === 'resources' && segments[1]) {
    pageTitle = RESOURCE_LABELS[segments[1]] ?? segments[1];
  } else if (segments[0] && TITLE_OVERRIDES[segments[0]]) {
    pageTitle = TITLE_OVERRIDES[segments[0]];
  }

  const initials = (user?.name ?? user?.email ?? '?')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sidebar = (
    <nav aria-label="Admin navigation" className="flex h-full flex-col overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-4">
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-1.5 text-sm transition',
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted hover:bg-elevated hover:text-foreground'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {isInMemory && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-sm text-amber-600 dark:text-amber-400">
          ⚠️ <strong>Demo Mode</strong> — Changes will NOT persist. Add MONGODB_URI environment variable to Vercel to save data permanently.
        </div>
      )}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur">
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen((o) => !o)}
          className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-foreground lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <Link to="/admin" className="font-heading text-sm font-bold tracking-tight text-foreground">
          Portfolio CMS
        </Link>
        <span
          title="If you can read this marker, you are running the latest code (v2.3)"
          className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
        >
          v2.3
        </span>
        <span aria-hidden="true" className="hidden text-faint sm:inline">/</span>
        <h1 className="hidden truncate font-heading text-sm font-semibold text-muted sm:block">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="/"
            target="_self"
            className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground sm:inline-block"
          >
            View site
          </a>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
          >
            {initials}
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-danger/40 hover:text-danger"
          >
            Log out
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative h-full w-72 border-r border-border bg-card shadow-xl">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border bg-card lg:block">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
