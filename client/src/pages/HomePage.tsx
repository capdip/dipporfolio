import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { api } from '../lib/api';
import { CANONICAL_HOME_SECTIONS, resolveSectionComponent } from '../lib/sectionMap';
import { useAbout, useMedia, useSettings } from '../hooks/useContent';
import { resolveImageUrl } from '../lib/resolveImageUrl';

// The WebGL scene pulls in the large `three` dependency. Loading it lazily keeps
// the 3D engine (and its ~500 kB chunk) out of the initial route bundle so the
// rest of the page paints faster. The scene is `aria-hidden` and purely
// decorative with its own CSS fallback, so a `null` Suspense fallback is safe
// and invisible to users.
const ScienceHomeScene = lazy(() => import('../components/three/ScienceHomeScene'));

export default function HomePage() {
  const aboutQuery = useAbout();
  const settingsQuery = useSettings();
  const mediaQuery = useMedia();
  const heroRef = useRef<HTMLElement>(null);

  const settings = settingsQuery.data;
  const profileImage = aboutQuery.data?.profileImage;

  // Media Library images woven into the 3D composition.
  const mediaImages = useMemo(
    () =>
      (mediaQuery.data ?? [])
        .filter((m) => String(m.mimeType ?? '').startsWith('image/'))
        .slice(0, 8)
        .map((m) => resolveImageUrl(m.url)),
    [mediaQuery.data]
  );

  const displayName =
    settings?.footer?.name ?? settings?.siteName?.split('—')[0]?.trim() ?? 'Dipesh Thapa';
  const title = settings?.footer?.professionalTitle ?? 'Research Scientist & Molecular Biologist';

  // GSAP entrance for the hero copy (fail-safe: always clears to natural visible state).
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-hero-line]',
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.15,
          clearProps: 'all',
          overwrite: 'auto',
        }
      );
      gsap.fromTo(
        '[data-hero-actions] > *',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out',
          delay: 0.6,
          clearProps: 'all',
          overwrite: 'auto',
        }
      );
    }, heroRef.current);
    return () => {
      const hero = heroRef.current;
      if (hero && hero.querySelector('[data-hero-line], [data-hero-actions] > *')) {
        gsap.set(hero.querySelectorAll('[data-hero-line], [data-hero-actions] > *'), { clearProps: 'all' });
      }
      ctx.revert();
    };
  }, []);

  const downloadCv = () => {
    void api.getCvDownloadUrl().then((url) => {
      window.location.href = url;
    });
  };

  return (
    <>
      <header ref={heroRef} className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-x-clip">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full">
          <Suspense fallback={null}>
            <ScienceHomeScene imageUrls={mediaImages} className="h-full w-full" />
          </Suspense>
        </div>
        <div aria-hidden="true" className="hairline-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-site relative z-10 py-24">
          <div className="max-w-3xl">
            <p
              data-hero-line
              className="mb-4 inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
            >
              {settings?.siteName?.split('—')[1]?.trim() ?? 'Academic Portfolio'}
            </p>
            <h1
              data-hero-line
              className="font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl"
            >
              {displayName}
            </h1>
            <p data-hero-line className="mt-4 max-w-xl font-heading text-lg font-medium text-muted md:text-xl">
              {title}
            </p>
            {settings?.siteDescription ? (
              <p data-hero-line className="mt-5 max-w-xl leading-relaxed text-muted">
                {settings.siteDescription}
              </p>
            ) : null}

            <div data-hero-actions className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
              >
                About me
              </Link>
              <button
                type="button"
                onClick={() => document.querySelector('#research')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Explore research
              </button>
              <button
                type="button"
                onClick={downloadCv}
                className="inline-flex items-center gap-2 rounded-lg border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download CV
              </button>
            </div>

            {profileImage ? (
              <div data-hero-line className="mt-10 flex items-center gap-4">
                <img
                  src={resolveImageUrl(profileImage)}
                  alt={`Portrait of ${displayName}`}
                  className="h-16 w-16 rounded-full border-2 border-border object-cover ring-4 ring-primary/15"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{aboutQuery.data?.highlights?.[0]}</p>
                  <p className="text-xs text-faint">{aboutQuery.data?.highlights?.[1]}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main id="main-content">
        {CANONICAL_HOME_SECTIONS.map((key) => {
          const SectionComp = resolveSectionComponent(key);
          if (!SectionComp) return null;
          return <SectionComp key={key} />;
        })}
      </main>
    </>
  );
}
