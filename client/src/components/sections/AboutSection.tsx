import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CtaButton } from '../../../../shared/types';
import { isInternalUrl } from '../../lib/format';
import { useAbout } from '../../hooks/useContent';
import { resolveImageUrl } from '../../lib/resolveImageUrl';
import {
  Badge,
  EmptyState,
  Reveal,
  Section,
  SectionHeading,
  Skeleton,
} from '../ui/primitives';

export function CtaLink({ cta, tone = 'primary' }: { cta?: CtaButton; tone?: 'primary' | 'ghost' }) {
  if (!cta?.url) return null;
  const classes =
    tone === 'primary'
      ? 'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900'
      : 'inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary';
  if (isInternalUrl(cta.url)) {
    return (
      <Link to={cta.url} className={classes}>
        {cta.label}
      </Link>
    );
  }
  return (
    <a href={cta.url} className={classes}>
      {cta.label}
    </a>
  );
}

export default function AboutSection() {
  const { data: about, isLoading, isError, error, refetch } = useAbout();
  const [slide, setSlide] = useState(0);

  const aboutData = about && Object.keys(about).length > 0 ? about : null;
  const photos = (
    aboutData?.images && aboutData.images.length > 0
      ? aboutData.images
      : [aboutData?.profileImage]
  ).filter((p): p is string => Boolean(p && p.trim()));
  const currentPhoto = photos.length > 0 ? photos[slide % photos.length] : null;

  return (
    <Section id="about" ariaLabel="About">
      <SectionHeading title="About Me" subtitle="Profile" />
      {isLoading && !aboutData ? (
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ) : isError && !aboutData ? (
        <div className="panel flex flex-col items-center gap-3 border-danger/30 px-6 py-10 text-center">
          <p className="text-danger">Could not load the about content.</p>
          <p className="text-xs text-muted">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <button 
            onClick={() => void refetch()} 
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
          >
            Try again
          </button>
        </div>
      ) : !aboutData || Object.keys(aboutData).length === 0 ? (
        <EmptyState message="No profile information yet." hint="Check back soon." />
      ) : (
        <Reveal className="grid items-start gap-10 md:grid-cols-[280px_1fr]">
          {currentPhoto ? (
            <div>
              <div className="relative overflow-hidden rounded-2xl border border-border shadow-lg">
                <img
                  src={resolveImageUrl(currentPhoto)}
                  alt={`About photo ${slide + 1}`}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
                {photos.length > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="Previous photo"
                      onClick={() => setSlide((s) => (s - 1 + photos.length) % photos.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white transition hover:bg-black/70"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Next photo"
                      onClick={() => setSlide((s) => (s + 1) % photos.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white transition hover:bg-black/70"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </>
                ) : null}
              </div>
              {photos.length > 1 ? (
                <div className="mt-3 flex justify-center gap-1.5">
                  {photos.map((photo, index) => (
                    <button
                      key={photo + index}
                      type="button"
                      aria-label={`Go to photo ${index + 1}`}
                      onClick={() => setSlide(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === slide % photos.length ? 'w-6 bg-primary' : 'w-2 bg-border hover:bg-muted'
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : aboutData.profileImage ? (
            <img
              src={resolveImageUrl(aboutData.profileImage)}
              alt="Portrait of the researcher"
              loading="lazy"
              className="w-full rounded-2xl border border-border object-cover shadow-lg"
            />
          ) : null}
          <div className="space-y-6">
            {[aboutData.profileText, aboutData.biography, aboutData.academicSummary]
              .filter((text): text is string => Boolean(text && text.trim()))
              .map((text, index) => (
                <p key={index} className="leading-relaxed text-muted">
                  {text}
                </p>
              ))}
            {aboutData.highlights && aboutData.highlights.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {aboutData.highlights.map((highlight) => (
                  <Badge key={highlight} tone="accent">
                    {highlight}
                  </Badge>
                ))}
              </div>
            ) : null}
            {'keywords' in aboutData && aboutData.keywords && aboutData.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-sm font-medium text-faint">Keywords:</span>
                {aboutData.keywords.map((keyword) => (
                  <Badge key={keyword} tone="neutral">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : null}
            <CtaLink cta={aboutData.cta} />
          </div>
        </Reveal>
      )}
    </Section>
  );
}
