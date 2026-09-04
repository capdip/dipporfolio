import type { Hobby } from '../../../../shared/types';
import { useResource } from '../../hooks/useContent';
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../ui/primitives';

export default function HobbiesSection() {
  const { data, isLoading, isError, refetch } = useResource<Hobby>('hobbies');
  const items = (data ?? []).filter((item) => item.visibility !== false);

  return (
    <Section id="hobbies" ariaLabel="Hobbies and interests">
      <SectionHeading title="Beyond the Lab" subtitle="Hobbies & interests" />
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load hobbies." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No hobbies published yet." />
      ) : (
        <ul className="flex flex-wrap justify-center gap-3">
          {items.map((item, index) => (
            <Reveal key={item._id ?? item.name} delay={index * 0.04} as="li">
              <div className="panel flex items-center gap-2 px-5 py-3 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                {item.icon ? (
                  <span aria-hidden="true" className="text-xl leading-none">
                    {item.icon}
                  </span>
                ) : null}
                <span className="text-sm font-medium text-foreground">{item.name}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      )}
    </Section>
  );
}
