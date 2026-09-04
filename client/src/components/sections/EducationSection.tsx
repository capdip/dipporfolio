import type { Education } from '../../../../shared/types';
import { useEffect, useRef } from 'react';
import { formatDateRange } from '../../lib/format';
import { useResource } from '../../hooks/useContent';
import { useAnimations } from '../../animations';
import {
  Badge,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../ui/primitives';

export default function EducationSection() {
  const { data, isLoading, isError, refetch } = useResource<Education>('education');
  const animations = useAnimations();
  const timelineRef = useRef<HTMLOListElement>(null);
  
  const items = (data ?? [])
    .filter((item) => item.visibility !== false)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));

  // Initialize timeline animations
  useEffect(() => {
    if (timelineRef.current) {
      animations.animateTimeline(timelineRef.current);
    }
  }, [animations]);

  return (
    <Section id="education" ariaLabel="Education">
      <SectionHeading title="Education" subtitle="Academic journey" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load education history." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No education entries published yet." />
      ) : (
        <ol ref={timelineRef} data-timeline className="timeline-rail space-y-10 pl-8">
          <div data-timeline-line className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />
          {items.map((item, index) => (
            <li key={item._id ?? `${item.institution}-${index}`} data-timeline-item className="relative">
              <span
                data-timeline-marker
                aria-hidden="true"
                className="absolute -left-[37px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background"
              />
              <Reveal delay={index * 0.05}>
                <article data-timeline-content className="panel p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{formatDateRange(item.startDate, item.endDate)}</Badge>
                    {item.status ? <Badge tone="success">{item.status}</Badge> : null}
                  </div>
                  <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                    {item.qualification}
                  </h3>
                  <p className="text-sm font-medium text-primary">{item.institution}</p>
                  {item.field ? <p className="text-sm text-muted">{item.field}</p> : null}
                  {item.location ? <p className="text-xs text-faint">{item.location}</p> : null}
                  {item.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
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
