import type { ResearchExperience } from '../../../../shared/types';
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

export default function ResearchExperienceSection() {
  const { data, isLoading, isError, refetch } = useResource<ResearchExperience>('research-experience');
  const items = (data ?? []).filter((item) => item.visibility !== false);

  return (
    <Section id="research-experience" ariaLabel="Research experience">
      <SectionHeading title="Research Experience" subtitle="In the lab and beyond" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load research experience." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No research experience published yet." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item._id ?? `${item.organization}-${index}`} delay={index * 0.05}>
              <article className="panel h-full p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.project ?? item.organization}
                    loading="lazy"
                    className="mb-4 h-40 w-full rounded-xl object-cover"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  {item.dateLabel ? <Badge tone="primary">{item.dateLabel}</Badge> : null}
                  {item.date ? <Badge tone="neutral">{item.date}</Badge> : null}
                </div>
                <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                  {item.role}
                </h3>
                <p className="text-sm font-medium text-primary">{item.organization}</p>
                {item.project ? <p className="text-sm text-muted">{item.project}</p> : null}
                {item.location ? <p className="text-xs text-faint">{item.location}</p> : null}
                {item.responsibilities && item.responsibilities.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                    {item.responsibilities.map((responsibility, i) => (
                      <li key={i}>{responsibility}</li>
                    ))}
                  </ul>
                ) : null}
                {item.outcomes && item.outcomes.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-success/25 bg-success/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-success">
                      Outcomes
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                      {item.outcomes.map((outcome, i) => (
                        <li key={i}>{outcome}</li>
                      ))}
                    </ul>
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
