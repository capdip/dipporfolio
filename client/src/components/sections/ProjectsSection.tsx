import { Link } from 'react-router-dom';
import type { Project } from '../../../../shared/types';
import { useEffect, useRef } from 'react';
import { excerpt } from '../../lib/format';
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

export default function ProjectsSection() {
  const { data, isLoading, isError, refetch } = useResource<Project>('projects');
  const animations = useAnimations();
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const projects = (data ?? [])
    .filter((project) => project.visibility !== false)
    .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  // Initialize section animations
  useEffect(() => {
    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll('[data-section-card]') as NodeListOf<HTMLElement>;
      cards.forEach((card) => animations.animateCardHover(card));
    }
  }, [animations]);

  return (
    <Section id="projects" ariaLabel="Projects">
      <div ref={sectionRef} data-section>
        <div data-section-heading>
          <SectionHeading title="Projects" subtitle="Research in action" />
        </div>
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Could not load projects." onRetry={() => void refetch()} />
        ) : projects.length === 0 ? (
          <EmptyState message="No projects published yet." />
        ) : (
          <div data-section-content className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <Reveal key={project._id ?? project.title} delay={index * 0.05}>
                <Link
                  data-section-card
                  data-card-image={project.projectImage || undefined}
                  to={`/projects/${project._id}`}
                  className="panel group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1 focus-visible:shadow-lg"
                  aria-label={`View project: ${project.title}`}
                >
                  {project.projectImage ? (
                    <img
                      data-card-image
                      src={project.projectImage}
                      alt={project.title}
                      loading="lazy"
                      className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : null}
                  <div data-card-content className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-center gap-2">
                      {project.featured ? <Badge tone="warning">Featured</Badge> : null}
                      {project.researchArea ? <Badge tone="accent">{project.researchArea}</Badge> : null}
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary">
                      {project.title}
                    </h3>
                    {project.subtitle ? (
                      <p className="text-sm font-medium text-muted">{project.subtitle}</p>
                    ) : null}
                    <p className="text-sm leading-relaxed text-muted">{excerpt(project.description)}</p>
                    {project.keywords && project.keywords.length > 0 ? (
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                        {project.keywords.slice(0, 4).map((keyword) => (
                          <Badge key={keyword} tone="neutral">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
