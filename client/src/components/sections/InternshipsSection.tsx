import type { Internship } from '../../../../shared/types';
import { formatDateRange } from '../../lib/format';
import { useResource } from '../../hooks/useContent';
import { resolveImageUrl } from '../../lib/resolveImageUrl';
import {
  Badge,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../ui/primitives';

export default function InternshipsSection() {
  const { data, isLoading, isError, refetch } = useResource<Internship>('internships');
  const items = (data ?? []).filter((item) => item.visibility !== false);

  return (
    <Section id="internships" ariaLabel="Internships">
      <SectionHeading title="Internships" subtitle="Hands-on training" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load internships." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No internships published yet." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item._id ?? `${item.organization}-${index}`} delay={index * 0.05}>
              <article className="panel h-full p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={resolveImageUrl(item.images[0])}
                    alt={`${item.organization} internship`}
                    loading="lazy"
                    className="mb-4 h-40 w-full rounded-xl object-cover"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{item.dateLabel ?? formatDateRange(item.dates?.start, item.dates?.end)}</Badge>
                </div>
                <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                  {item.organization}
                </h3>
                <p className="text-sm font-medium text-primary">{item.department}</p>
                {item.location ? <p className="text-xs text-faint">{item.location}</p> : null}
                {item.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
                ) : null}
                {item.responsibilities && item.responsibilities.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                    {item.responsibilities.map((responsibility, i) => (
                      <li key={i}>{responsibility}</li>
                    ))}
                  </ul>
                ) : null}
                {item.skills && item.skills.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.skills.map((skill) => (
                      <Badge key={skill} tone="accent">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}
