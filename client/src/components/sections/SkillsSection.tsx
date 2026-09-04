import type { Skill } from '../../../../shared/types';
import { proficiencyPercent } from '../../lib/format';
import { useResource } from '../../hooks/useContent';
import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../ui/primitives';

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical',
  laboratory: 'Laboratory',
  professional: 'Professional',
  communication: 'Communication',
  analytical: 'Analytical',
};

export default function SkillsSection() {
  const { data, isLoading, isError, refetch } = useResource<Skill>('skills');
  const skills = (data ?? []).filter((skill) => skill.visibility !== false);
  const grouped = new Map<string, Skill[]>();
  for (const skill of skills) {
    const category = skill.category || 'other';
    const bucket = grouped.get(category);
    if (bucket) bucket.push(skill);
    else grouped.set(category, [skill]);
  }
  const categories = [...grouped.keys()];

  return (
    <Section id="skills" ariaLabel="Skills">
      <SectionHeading title="Skills" subtitle="Toolbox" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load skills." onRetry={() => void refetch()} />
      ) : skills.length === 0 ? (
        <EmptyState message="No skills published yet." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal key={category} delay={index * 0.05}>
              <div className="panel h-full p-6">
                <h3 className="mb-4 font-heading text-base font-semibold uppercase tracking-wide text-primary">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <ul className="space-y-4">
                  {(grouped.get(category) ?? []).map((skill) => {
                    const percent = proficiencyPercent(skill.proficiency);
                    return (
                      <li key={skill._id ?? skill.name}>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-foreground">
                            {skill.icon ? `${skill.icon} ` : ''}
                            {skill.name}
                          </span>
                          {skill.proficiency ? (
                            <span className="text-xs text-faint">{skill.proficiency}</span>
                          ) : null}
                        </div>
                        <div
                          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-elevated"
                          role="meter"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${skill.name} proficiency`}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
}
