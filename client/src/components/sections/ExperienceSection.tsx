import type { Experience } from '../../../../shared/types';
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

export default function ExperienceSection() {
  const { data, isLoading, isError, refetch } = useResource<Experience>('experience');
  const items = (data ?? [])
    .filter((item) => item.visibility !== false)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));

  return (
    <Section id="experience" ariaLabel="Professional experience">
      <SectionHeading title="Experience" subtitle="Where I have worked" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load experience." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No experience entries published yet." />
      ) : (
        <ol className="timeline-rail space-y-8 pl-8">
          {items.map((item, index) => (
            <li key={item._id ?? `${item.organization}-${index}`} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[37px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-accent bg-background"
              />
              <Reveal delay={index * 0.05}>
                <article className="panel p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {item.logo ? (
                        <img
                          src={resolveImageUrl(item.logo)}
                          alt={`${item.organization} logo`}
                          className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                        />
                      ) : null}
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          {item.position}
                        </h3>
                        <p className="text-sm font-medium text-primary">{item.organization}</p>
                        {item.location ? <p className="text-xs text-faint">{item.location}</p> : null}
                      </div>
                    </div>
                    <Badge tone="primary">{formatDateRange(item.startDate, item.endDate)}</Badge>
                  </div>
                  {item.image ? (
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={`${item.position} at ${item.organization}`}
                      className="mt-3 h-32 w-full rounded-lg border border-border object-cover"
                      loading="lazy"
                    />
                  ) : null}
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
                  {item.achievements && item.achievements.length > 0 ? (
                    <div className="mt-4">
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-faint">
                        Key Achievements
                      </h4>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                        {item.achievements.map((achievement, i) => (
                          <li key={i}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {item.relatedSkills && item.relatedSkills.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.relatedSkills.map((skill) => (
                        <Badge key={skill} tone="neutral">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
