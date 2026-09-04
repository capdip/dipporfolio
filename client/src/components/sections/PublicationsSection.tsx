import { Link } from 'react-router-dom';
import type { Publication } from '../../../../shared/types';
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

export default function PublicationsSection() {
  const { data, isLoading, isError, refetch } = useResource<Publication>('publications');
  const publications = (data ?? []).filter((item) => item.visibility !== false);
  const byYear = new Map<string, Publication[]>();
  for (const publication of publications) {
    const year = publication.year || 'Unknown';
    const bucket = byYear.get(year);
    if (bucket) bucket.push(publication);
    else byYear.set(year, [publication]);
  }
  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));

  return (
    <Section id="publications" ariaLabel="Publications">
      <SectionHeading title="Publications" subtitle="Peer-reviewed work" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load publications." onRetry={() => void refetch()} />
      ) : publications.length === 0 ? (
        <EmptyState message="No publications published yet." />
      ) : (
        <div className="space-y-12">
          {years.map((year) => (
            <div key={year}>
              <h3 className="mb-4 font-heading text-xl font-bold text-primary">{year}</h3>
              <ul className="space-y-4">
                {(byYear.get(year) ?? []).map((publication, index) => (
                  <Reveal key={publication._id ?? publication.title} delay={index * 0.04} as="li">
                    <article className="panel p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="primary">{publication.year}</Badge>
                        <Badge tone="accent">{publication.publicationType}</Badge>
                        {publication.publisher ? (
                          <span className="text-xs text-faint">{publication.publisher}</span>
                        ) : null}
                      </div>
                      <Link
                        to={`/publications/${publication._id}`}
                        className="mt-2 block font-heading text-base font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        {publication.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted">{publication.authors.join(', ')}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        {publication.doi ? (
                          <a
                            href={`https://doi.org/${publication.doi}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            DOI: {publication.doi}
                          </a>
                        ) : null}
                        {publication.url ? (
                          <a
                            href={publication.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-accent underline-offset-4 hover:underline"
                          >
                            Publisher link
                          </a>
                        ) : null}
                        {publication.pdf ? (
                          <a
                            href={publication.pdf}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-muted underline-offset-4 hover:underline"
                          >
                            PDF
                          </a>
                        ) : null}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
