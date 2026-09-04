import type { Membership } from '../../../../shared/types';
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

export default function MembershipsSection() {
  const { data, isLoading, isError, refetch } = useResource<Membership>('memberships');
  const items = (data ?? []).filter((item) => item.visibility !== false);

  return (
    <Section id="memberships" ariaLabel="Professional memberships">
      <SectionHeading title="Memberships" subtitle="Professional affiliations" />
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load memberships." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No memberships published yet." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item._id ?? item.organization} delay={index * 0.05}>
              <article className="panel flex h-full flex-col items-start gap-2 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                {item.logo ? (
                  <img
                    src={resolveImageUrl(item.logo)}
                    alt={`${item.organization} logo`}
                    loading="lazy"
                    className="h-12 w-12 rounded-lg object-contain"
                  />
                ) : null}
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {item.organization}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {item.membershipType ? <Badge tone="primary">{item.membershipType}</Badge> : null}
                  {item.dateLabel ? <Badge tone="neutral">{item.dateLabel}</Badge> : null}
                </div>
                {item.description ? (
                  <p className="text-sm leading-relaxed text-muted">{item.description}</p>
                ) : null}
                {item.website ? (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-auto text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Visit website
                  </a>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}
