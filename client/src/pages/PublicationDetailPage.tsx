import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Project, Publication } from '../../../shared/types';
import { api } from '../lib/api';
import { keys, useResource } from '../hooks/useContent';
import {
  Badge,
  ErrorState,
  Reveal,
  Section,
  Skeleton,
} from '../components/ui/primitives';

export default function PublicationDetailPage() {
  const { id = '' } = useParams();
  const [copied, setCopied] = useState(false);
  const publicationQuery = useQuery({
    queryKey: keys.item('publications', id),
    queryFn: () => api.getPublication(id),
    enabled: Boolean(id),
    retry: false,
  });
  const projectsQuery = useResource<Project>('projects');

  // relatedProject stores either a Mongo _id or a project title. Match against
  // the loaded projects so we can link to the project page; otherwise show the
  // raw value as text. `publication` is declared below after the pending/error
  // guards; here we only reference publicationQuery.data directly.
  const relatedProject = projectsQuery.data?.find(
    (p) => p._id === publicationQuery.data?.relatedProject || p.title === publicationQuery.data?.relatedProject
  );

  if (publicationQuery.isPending) {
    return (
      <main id="main-content" className="container-site py-16">
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="mb-3 h-10 w-3/4" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </main>
    );
  }

  if (publicationQuery.isError || !publicationQuery.data) {
    return (
      <main id="main-content" className="container-site py-16">
        <ErrorState
          message={
            publicationQuery.error instanceof Error &&
            publicationQuery.error.message.includes('404')
              ? 'This publication could not be found.'
              : 'Could not load this publication.'
          }
          onRetry={() => void publicationQuery.refetch()}
        />
        <div className="mt-6 text-center">
          <Link
            to="/#publications"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Back to all publications
          </Link>
        </div>
      </main>
    );
  }

  const publication: Publication = publicationQuery.data;
  const citation =
    publication.citation ??
    `${publication.authors.join(', ')} (${publication.year}). ${publication.title}.${
      publication.publisher ? ` ${publication.publisher}.` : ''
    }${publication.doi ? ` https://doi.org/${publication.doi}` : ''}`;

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main id="main-content">
      <div className="border-b border-border bg-elevated/40">
        <div className="container-site grid items-center gap-8 py-12 md:grid-cols-[1fr_280px]">
          <div>
            <Link
              to="/#publications"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              ← All publications
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="primary">{publication.year}</Badge>
              <Badge tone="accent">{publication.publicationType}</Badge>
              {publication.researchArea ? (
                <Badge tone="neutral">{publication.researchArea}</Badge>
              ) : null}
            </div>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {publication.title}
            </h1>
            <p className="mt-3 text-muted">{publication.authors.join(', ')}</p>
            {publication.publisher ? (
              <p className="mt-1 text-sm text-faint">{publication.publisher}</p>
            ) : null}
          </div>
          {publication.coverImage ? (
            <img
              src={publication.coverImage}
              alt={`Cover of ${publication.title}`}
              loading="lazy"
              className="w-full rounded-2xl border border-border object-cover shadow-lg"
            />
          ) : null}
        </div>
      </div>

      <Section ariaLabel="Publication details">
        <Reveal className="mx-auto max-w-3xl space-y-8">
          {publication.abstract ? (
            <div className="prose-content">
              <h2>Abstract</h2>
              {publication.abstract.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <div className="panel p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-base font-semibold text-foreground">Citation</h2>
              <button
                type="button"
                onClick={() => void copyCitation()}
                className="rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-elevated p-4 font-mono text-sm leading-relaxed text-muted">
              {citation}
            </pre>
          </div>

          {publication.relatedProject ? (
            <div className="panel p-6">
              <h2 className="font-heading text-base font-semibold text-foreground">Related project</h2>
              {relatedProject ? (
                <Link
                  to={`/projects/${relatedProject._id}`}
                  className="mt-2 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {relatedProject.title}
                </Link>
              ) : (
                <p className="mt-2 text-sm text-muted">{publication.relatedProject}</p>
              )}
            </div>
          ) : null}

          {publication.keywords && publication.keywords.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {publication.keywords.map((keyword) => (
                <Badge key={keyword} tone="neutral">
                  {keyword}
                </Badge>
              ))}
            </div>
          ) : null}

          {publication.doi || publication.url || publication.pdf ? (
            <div className="flex flex-wrap gap-3">
              {publication.doi ? (
                <a
                  href={`https://doi.org/${publication.doi}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
                >
                  View DOI
                </a>
              ) : null}
              {publication.url ? (
                <a
                  href={publication.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                >
                  Publisher page
                </a>
              ) : null}
              {publication.pdf ? (
                <a
                  href={publication.pdf}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-lg border border-accent/40 px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/10"
                >
                  Download PDF
                </a>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </Section>
    </main>
  );
}
