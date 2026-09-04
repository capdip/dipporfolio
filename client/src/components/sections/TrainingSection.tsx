import type { Training } from '../../../../shared/types';
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

export default function TrainingSection() {
  const { data, isLoading, isError, refetch } = useResource<Training>('training');
  const items = (data ?? [])
    .filter((item) => item.visibility !== false)
    .sort((a, b) => (b.sortDate ?? '').localeCompare(a.sortDate ?? ''));

  return (
    <Section id="training" ariaLabel="Training and workshops">
      <SectionHeading title="Training & Workshops" subtitle="Continuous learning" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load training records." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No training records published yet." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <Reveal key={item._id ?? item.title} delay={index * 0.05}>
              <article className="panel flex h-full flex-col p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{item.dateLabel}</Badge>
                  {item.hours ? <Badge tone="success">{item.hours}</Badge> : null}
                </div>
                <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                {item.provider ? <p className="text-sm font-medium text-primary">{item.provider}</p> : null}
                {item.location ? <p className="text-xs text-faint">{item.location}</p> : null}
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                ) : null}
                {item.topics && item.topics.length > 0 ? (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    {item.topics.map((topic) => (
                      <Badge key={topic} tone="neutral">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {item.certificate || item.document ? (
                  <a
                    href={item.certificate ?? item.document}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex w-fit rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    {item.certificate ? 'View certificate' : 'View document'}
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
