import type { Conference } from '../../../../shared/types';
import { useResource } from '../../hooks/useContent';
import {
  Badge,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../ui/primitives';

export default function ConferencesSection() {
  const { data, isLoading, isError, refetch } = useResource<Conference>('conferences');
  const items = (data ?? [])
    .filter((item) => item.visibility !== false)
    .sort((a, b) => (b.sortDate ?? b.startDate ?? '').localeCompare(a.sortDate ?? a.startDate ?? ''));

  return (
    <Section id="conferences" ariaLabel="Conferences and events">
      <SectionHeading title="Conferences & Events" subtitle="Presentations and participation" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load conferences." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No conferences published yet." />
      ) : (
        <ul className="space-y-4">
          {items.map((item, index) => (
            <Reveal key={item._id ?? item.title} delay={index * 0.04} as="li">
              <article className="panel flex flex-col gap-3 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:items-start">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-24 w-full rounded-xl object-cover sm:w-36"
                  />
                ) : null}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{item.eventType}</Badge>
                    <Badge tone="neutral">{item.dateLabel}</Badge>
                  </div>
                  <h3 className="mt-2 font-heading text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  {item.location ? <p className="text-sm text-muted">{item.location}</p> : null}
                  {item.organizer ? <p className="text-xs text-faint">{item.organizer}</p> : null}
                  {item.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                  ) : null}
                </div>
                {item.certificate ? (
                  <a
                    href={item.certificate}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="self-start rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    Certificate
                  </a>
                ) : null}
              </article>
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}
