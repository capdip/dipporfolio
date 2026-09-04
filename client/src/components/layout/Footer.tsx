import { useSettings } from '../../hooks/useContent';
import { getSocialEntries } from '../../lib/socialLinks';

const SOCIAL_ICONS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/dipesh-thapa-6b0559215/',
    path: 'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/dipesh_thapa_kazi/?hl=en',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'Figshare',
    href: 'https://figshare.com/authors/Dipesh_Thapa/23756241',
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.95 13.54-1.06 1.06L12 12.65l-3.89 3.95-1.06-1.06L10.94 11.6 7.05 7.65l1.06-1.06L12 10.54l3.89-3.95 1.06 1.06-3.89 3.95 3.89 3.94Z',
  },
];

export default function Footer() {
  const { data: settings } = useSettings();
  const footer = settings?.footer;
  const social = settings?.socialLinks ?? {};

  const socials = getSocialEntries(social);

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-site grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-heading text-lg font-bold text-foreground">
            {footer?.name ?? settings?.siteName ?? 'Dipesh Thapa'}
          </p>
          {footer?.professionalTitle ? (
            <p className="mt-1 text-sm text-primary">{footer.professionalTitle}</p>
          ) : null}
          {footer?.customText ? (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{footer.customText}</p>
          ) : null}
        </div>

        <nav aria-label="Social profiles" className="flex flex-col gap-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-faint">Connect</p>
          <div className="flex items-center gap-3">
            {SOCIAL_ICONS.map((icon) => (
              <a
                key={icon.label}
                href={icon.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={icon.label}
                title={icon.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition hover:border-primary/50 hover:text-primary"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d={icon.path} />
                </svg>
              </a>
            ))}
          </div>
        </nav>

        <div className="flex flex-col gap-3">
          {footer?.email ? (
            <a href={`mailto:${footer.email}`} className="text-sm text-muted transition hover:text-primary">
              {footer.email}
            </a>
          ) : null}
          {footer?.location ? <p className="text-sm text-muted">{footer.location}</p> : null}
          {footer?.showSocial !== false && socials.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {socials.map((socialEntry) => (
                <a
                  key={socialEntry.label}
                  href={socialEntry.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={socialEntry.label}
                  title={socialEntry.label}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition hover:border-primary/40 hover:text-primary"
                >
                  {socialEntry.path ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path d={socialEntry.path} />
                    </svg>
                  ) : (
                    <span>{socialEntry.label}</span>
                  )}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border py-4">
        <p className="container-site text-center text-xs text-faint">
          © {new Date().getFullYear()}{' '}
          {footer?.copyright ?? `${settings?.siteName ?? 'Dipesh Thapa'}. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
