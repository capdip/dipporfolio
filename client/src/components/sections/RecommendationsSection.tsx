import type { Recommendation } from '../../../../shared/types';
import { initials } from '../../lib/format';
import { useResource } from '../../hooks/useContent';
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../ui/primitives';

export default function RecommendationsSection() {
  const { data, isLoading, isError, refetch } = useResource<Recommendation>('recommendations');
  // `visibility` is the canonical flag. Legacy records may still carry
  // `publicVisibility: false` from older seeds, which would wrongly hide
  // entries the admin has marked visible, so it is intentionally ignored here.
  const items = (data ?? []).filter((item) => item.visibility !== false);

  return (
    <Section id="recommendations" ariaLabel="Recommendations">
      <SectionHeading title="Recommendations" subtitle="Kind words" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load recommendations." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No recommendations published yet." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item._id ?? item.name} delay={index * 0.05}>
              <figure className="panel flex h-full flex-col gap-4 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span aria-hidden="true" className="font-heading text-4xl leading-none text-primary/40">
                  &ldquo;
                </span>
                {item.recommendationText ? (
                  <blockquote className="flex-1 text-sm leading-relaxed text-muted">
                    {item.recommendationText}
                  </blockquote>
                ) : null}
                <span
                  aria-hidden="true"
                  className="self-end font-heading text-4xl leading-none text-primary/40"
                >
                  &rdquo;
                </span>
                <figcaption className="flex items-center gap-3 border-t border-border pt-4">
                  {item.photo ? (
                    <img
                      src={item.photo}
                      alt={`Photo of ${item.name}`}
                      loading="lazy"
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                    >
                      {initials(item.name)}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted">
                      {[item.title, item.institution].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}
