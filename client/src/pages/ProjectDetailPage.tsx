import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Project, Publication } from '../../../shared/types';
import { api } from '../lib/api';
import { formatDateRange } from '../lib/format';
import { keys } from '../hooks/useContent';
import { resolveImageUrl } from '../lib/resolveImageUrl';
import {
  Badge,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
  Skeleton,
} from '../components/ui/primitives';

function ProseBlock({ title, text }: { title: string; text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className="prose-content">
      <h2>{title}</h2>
      {text.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id = '' } = useParams();
  const projectQuery = useQuery({
    queryKey: keys.item('projects', id),
    queryFn: () => api.getProject(id),
    enabled: Boolean(id),
    retry: false,
  });

  if (projectQuery.isPending) {
    return (
      <main id="main-content" className="container-site py-16">
        <Skeleton className="mb-6 h-64 w-full rounded-2xl" />
        <Skeleton className="mb-3 h-8 w-2/3" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </main>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <main id="main-content" className="container-site py-16">
        <ErrorState
          message={
            projectQuery.error instanceof Error && projectQuery.error.message.includes('404')
              ? 'This project could not be found.'
              : 'Could not load this project.'
          }
          onRetry={() => void projectQuery.refetch()}
        />
        <div className="mt-6 text-center">
          <Link
            to="/#projects"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Back to all projects
          </Link>
        </div>
      </main>
    );
  }

  const project: Project = projectQuery.data;
  // Use server-resolved related publications (includes hidden publications)
  const resolvedPubs = (project as unknown as Record<string, unknown>)._resolvedRelatedPublications as Publication[] | undefined;
  const relatedPublications = resolvedPubs ?? [];

  return (
    <main id="main-content">
      <div className="relative overflow-hidden border-b border-border bg-elevated/40">
        {project.projectImage ? (
          <img
            src={resolveImageUrl(project.projectImage)}
            alt={project.title}
            className="h-64 w-full object-cover md:h-80"
          />
        ) : null}
        <div className="container-site py-12">
          <Link
            to="/#projects"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            ← All projects
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {project.featured ? <Badge tone="warning">Featured</Badge> : null}
            {project.status ? <Badge tone="success">{project.status}</Badge> : null}
            {project.researchArea ? <Badge tone="accent">{project.researchArea}</Badge> : null}
            {project.dates?.start ? (
              <Badge tone="neutral">
                {formatDateRange(project.dates.start, project.dates.end)}
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            {project.title}
          </h1>
          {project.subtitle ? (
            <p className="mt-2 font-heading text-lg font-medium text-muted">{project.subtitle}</p>
          ) : null}
          {project.keywords && project.keywords.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.keywords.map((keyword) => (
                <Badge key={keyword} tone="primary">
                  {keyword}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Section ariaLabel="Project details">
        <Reveal className="mx-auto max-w-3xl space-y-10">
          <p className="text-lg leading-relaxed text-muted">{project.description}</p>
          <ProseBlock title="Objectives" text={project.objectives} />
          <ProseBlock title="Methodology" text={project.methodology} />
          <ProseBlock title="Findings" text={project.findings} />

          {(project.documents?.length ?? 0) > 0 || (project.externalLinks?.length ?? 0) > 0 ? (
            <div className="panel p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Documents & links
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(project.documents ?? []).map((document) => (
                  <li key={document}>
                    <a
                      href={document}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {document.split('/').pop() ?? document}
                    </a>
                  </li>
                ))}
                {(project.externalLinks ?? []).map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-medium text-accent underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {relatedPublications.length > 0 ? (
            <div>
              <SectionHeading title="Related publications" align="left" />
              <ul className="space-y-3">
                {relatedPublications.map((publication) => (
                  <li key={publication._id}>
                    <Link
                      to={`/publications/${publication._id}`}
                      className="panel block p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <span className="font-medium text-foreground">{publication.title}</span>
                      <span className="ml-2 text-xs text-faint">
                        {publication.authors.join(', ')} · {publication.year}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Reveal>
      </Section>
    </main>
  );
}
