import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/Providers';
import { useSettings } from '../../hooks/useContent';
import { api } from '../../lib/api';
import { cn } from '../../lib/cn';

interface NavEntry {
  label: string;
  to: string;
}

const NAV_ENTRIES: NavEntry[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Research', to: '/#research' },
  { label: 'Projects', to: '/#projects' },
  { label: 'Publications', to: '/publications' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
];

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="rounded-lg border border-border bg-elevated p-2 text-muted transition hover:text-primary"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: settings } = useSettings();
  const location = useLocation();

  const siteName = settings?.siteName?.split('—')[0]?.trim() || 'Dipesh Thapa';

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const downloadCv = () => {
    void api.getCvDownloadUrl().then((url) => {
      window.location.href = url;
    });
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl transition-all duration-300',
        scrolled ? 'border-border bg-background/85 py-2 shadow-sm' : 'border-transparent bg-transparent py-3'
      )}
    >
      <div className="container-site flex items-center justify-between gap-3">
        <Link
          to="/"
          className="min-w-0 truncate font-heading text-base font-bold tracking-tight text-foreground sm:text-lg"
        >
          {siteName}
        </Link>

        <nav aria-label="Primary" className="hidden min-w-0 items-center gap-3 xl:flex 2xl:gap-5">
          {NAV_ENTRIES.map((entry) => (
            <Link
              key={entry.to}
              to={entry.to}
              className={cn(
                'whitespace-nowrap text-sm font-medium text-muted transition hover:text-primary',
                location.pathname === entry.to && entry.to !== '/' && 'text-primary'
              )}
            >
              {entry.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={downloadCv}
            className="whitespace-nowrap rounded-lg border border-primary/40 px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            Download CV
          </button>
          <ThemeToggle />
          <Link
            to="/admin"
            className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-muted transition hover:border-primary/40 hover:text-primary"
          >
            Admin
          </Link>
        </nav>

        {/* Mobile + tablet + small laptop: hamburger + theme toggle */}
        <div className="flex items-center gap-2 xl:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-lg border-2 border-white bg-black p-3 text-white"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={open ? 'fixed inset-0 xl:hidden' : 'hidden xl:hidden'}
        style={open ? { backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2147483647 } : undefined}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="flex min-h-full w-full flex-col items-center justify-center gap-3 px-4 py-10">
          {NAV_ENTRIES.map((entry) => (
            <Link
              key={entry.to}
              to={entry.to}
              onClick={() => setOpen(false)}
              className="w-full max-w-xs border-2 border-green-600 bg-transparent px-4 py-2 text-center text-base font-bold text-green-600"
            >
              {entry.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              downloadCv();
              setOpen(false);
            }}
            className="mt-4 rounded-lg border border-primary px-6 py-3 text-base font-semibold text-primary"
          >
            Download CV
          </button>
        </div>
      </div>
    </header>
  );
}
