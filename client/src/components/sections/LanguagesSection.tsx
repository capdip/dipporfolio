import type { Language } from '../../../../shared/types';
import { proficiencyPercent } from '../../lib/format';
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

export default function LanguagesSection() {
  const { data, isLoading, isError, refetch } = useResource<Language>('languages');
  const items = (data ?? []).filter((item) => item.visibility !== false);

  return (
    <Section id="languages" ariaLabel="Languages">
      <SectionHeading title="Languages" subtitle="Communication" />
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load languages." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No languages published yet." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const percent = proficiencyPercent(item.proficiency);
            return (
              <Reveal key={item._id ?? item.language} delay={index * 0.05}>
                <div className="panel p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {item.language}
                    </h3>
                    {item.native ? <Badge tone="success">Native</Badge> : null}
                  </div>
                  {item.proficiency ? (
                    <p className="mt-1 text-sm text-muted">{item.proficiency}</p>
                  ) : null}
                  <div
                    className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated"
                    role="meter"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.language} proficiency`}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </Section>
  );
}
