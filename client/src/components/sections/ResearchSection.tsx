import { Link } from 'react-router-dom';
import { useResource } from '../../hooks/useContent';
import type { Project, Publication, Research } from '../../../../shared/types';
import {
  Badge,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../ui/primitives';

export default function ResearchSection() {
  const { data, isLoading, isError, refetch } = useResource<Research>('research');
  const interests = (data ?? []).filter((item) => item.visibility !== false);

  const projects = useResource<Project>('projects');
  const publications = useResource<Publication>('publications');

  // Related references are stored as free-text titles (or _id) in the admin, so a
  // research topic can point at projects/publications that may not share a stable
  // id. Match on either to stay robust against both seeded and admin-entered data.
  // Titles are matched case-insensitively and trimmed so minor typing differences
  // don't silently drop the link on the public site.
  const normalize = (value: string) => value.trim().toLowerCase();

  const projectsById = new Map((projects.data ?? []).map((p) => [p._id, p] as const));
  const projectsByTitle = new Map(
    (projects.data ?? []).filter((p) => p.title).map((p) => [normalize(p.title), p] as const)
  );
  const publicationsById = new Map((publications.data ?? []).map((p) => [p._id, p] as const));
  const publicationsByTitle = new Map(
    (publications.data ?? []).filter((p) => p.title).map((p) => [normalize(p.title), p] as const)
  );

  const resolveProjects = (
    refs: string[] | undefined
  ): { linked: Project[]; unmatched: string[] } => {
    const linked: Project[] = [];
    const unmatched: string[] = [];
    for (const ref of refs ?? []) {
      const match = projectsById.get(ref) ?? projectsByTitle.get(normalize(ref));
      if (match && match.visibility !== false) linked.push(match);
      else unmatched.push(ref);
    }
    return { linked, unmatched };
  };

  const resolvePublications = (
    refs: string[] | undefined
  ): { linked: Publication[]; unmatched: string[] } => {
    const linked: Publication[] = [];
    const unmatched: string[] = [];
    for (const ref of refs ?? []) {
      const match = publicationsById.get(ref) ?? publicationsByTitle.get(normalize(ref));
      if (match && match.visibility !== false) linked.push(match);
      else unmatched.push(ref);
    }
    return { linked, unmatched };
  };

  const anyLoading = isLoading || projects.isLoading || publications.isLoading;
  const anyError = isError || projects.isError || publications.isError;

  return (
    <Section id="research" ariaLabel="Research interests">
      <SectionHeading title="Research" subtitle="What drives the work" />
      {anyLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : anyError ? (
        <ErrorState message="Could not load research interests." onRetry={() => void refetch()} />
      ) : interests.length === 0 ? (
        <EmptyState message="No research interests published yet." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {interests.map((interest, index) => {
            const { linked: linkedProjects, unmatched: unmatchedProjects } = resolveProjects(
              interest.relatedProjects
            );
            const { linked: linkedPublications, unmatched: unmatchedPublications } = resolvePublications(
              interest.relatedPublications
            );
            const hasRelated =
              linkedProjects.length > 0 ||
              unmatchedProjects.length > 0 ||
              linkedPublications.length > 0 ||
              unmatchedPublications.length > 0;
            return (
              <Reveal key={interest._id ?? interest.title} delay={index * 0.05}>
                <article className="panel flex h-full flex-col transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {interest.image ? (
                    <img
                      src={interest.image}
                      alt={interest.title}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-40 w-full items-center justify-center border-b border-border bg-elevated text-sm text-faint"
                    >
                      Image not uploaded
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {interest.title}
                    </h3>
                    {interest.shortDescription ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {interest.shortDescription}
                      </p>
                    ) : null}
                    {interest.keywords && interest.keywords.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {interest.keywords.map((keyword) => (
                          <Badge key={keyword} tone="neutral">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {hasRelated ? (
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        {linkedProjects.length > 0 || unmatchedProjects.length > 0 ? (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-faint">
                              Related projects
                            </h4>
                            <ul className="mt-1 space-y-1">
                              {linkedProjects.map((project) => (
                                <li key={project._id}>
                                  <Link
                                    to={`/projects/${project._id}`}
                                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                  >
                                    {project.title}
                                  </Link>
                                </li>
                              ))}
                              {unmatchedProjects.map((ref) => (
                                <li key={ref} className="text-sm text-muted">
                                  {ref}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {linkedPublications.length > 0 || unmatchedPublications.length > 0 ? (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-faint">
                              Related publications
                            </h4>
                            <ul className="mt-1 space-y-1">
                              {linkedPublications.map((publication) => (
                                <li key={publication._id}>
                                  <Link
                                    to={`/publications/${publication._id}`}
                                    className="block text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                                  >
                                    {publication.title}
                                    <span className="ml-1 text-xs text-faint">
                                      {publication.authors.slice(0, 2).join(', ')}
                                      {publication.authors.length > 2 ? ' et al.' : ''} · {publication.year}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                              {unmatchedPublications.map((ref) => (
                                <li key={ref} className="text-sm text-muted">
                                  {ref}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </Section>
  );
}
