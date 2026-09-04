import { Link } from 'react-router-dom';
import type { Publication } from '../../../shared/types';
import { useResource } from '../hooks/useContent';
import { Badge, CardSkeleton, EmptyState, ErrorState, Reveal, Section, SectionHeading } from '../components/ui/primitives';

const typeColors: Record<string, string> = {
  Thesis: 'primary',
  'Journal contribution': 'accent',
  'Online resource': 'neutral',
  'Conference paper': 'success',
  Book: 'warning',
};

export default function PublicationsPage() {
  const { data, isLoading, isError, refetch } = useResource<Publication>('publications');

  const publications = (data ?? [])
    .filter((p) => p.visibility !== false)
    .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));

  return (
    <main id="main-content">
      <Section ariaLabel="Publications">
        <SectionHeading
          title="Publications"
          subtitle="Peer-reviewed records and research outputs"
        />
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
          All publications are indexed on{' '}
          <a
            href="https://figshare.com/authors/Dipesh_Thapa/23756241"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary underline-offset-2 hover:underline"
          >
            Figshare
          </a>{' '}
          and include full DOI links for citation.
        </p>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Could not load publications." onRetry={() => void refetch()} />
        ) : publications.length === 0 ? (
          <EmptyState message="No publications published yet." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {publications.map((pub, index) => (
              <Reveal key={pub._id ?? pub.title} delay={index * 0.04}>
                <Link
                  to={`/publications/${pub._id}`}
                  className="panel group flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1 focus-visible:shadow-lg"
                  aria-label={`View publication: ${pub.title}`}
                >
                  {pub.coverImage ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-elevated">
                      <img
                        src={pub.coverImage}
                        alt={`Cover of ${pub.title}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge tone="primary">{pub.year}</Badge>
                      <Badge tone={(typeColors[pub.publicationType] as 'primary' | 'accent' | 'neutral' | 'success' | 'warning') ?? 'neutral'}>
                        {pub.publicationType}
                      </Badge>
                      {pub.researchArea ? (
                        <Badge tone="accent">{pub.researchArea}</Badge>
                      ) : null}
                      {pub.featured ? (
                        <Badge tone="warning">Featured</Badge>
                      ) : null}
                    </div>
                    <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
                      {pub.title}
                    </h3>
                    <p className="mt-1 text-xs text-faint">
                      {pub.authors.join(', ')}
                    </p>
                    {pub.publisher ? (
                      <p className="mt-1 text-xs text-muted">{pub.publisher}</p>
                    ) : null}
                    {pub.citation ? (
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-faint italic">
                        {pub.citation}
                      </p>
                    ) : null}
                    {pub.doi ? (
                      <p className="mt-auto pt-3 text-xs text-primary break-all">
                        DOI: {pub.doi.replace('https://doi.org/', '')}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}
