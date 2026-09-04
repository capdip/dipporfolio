import { Link } from 'react-router-dom';
import type { BlogPost } from '../../../../shared/types';
import { excerpt, formatDate } from '../../lib/format';
import { useResource } from '../../hooks/useContent';
import { resolveImageUrl } from '../../lib/resolveImageUrl';
import {
  Badge,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../ui/primitives';

export default function BlogSection() {
  const { data, isLoading, isError, refetch } = useResource<BlogPost>('blog');
  const posts = (data ?? [])
    .filter((post) => post.status === 'published')
    .sort(
      (a, b) =>
        Number(b.featured ?? false) - Number(a.featured ?? false) ||
        (b.publicationDate ?? '').localeCompare(a.publicationDate ?? '')
    )
    .slice(0, 3);

  return (
    <Section id="blog" ariaLabel="Latest blog posts">
      <SectionHeading title="From the Blog" subtitle="Latest writing" />
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Could not load blog posts." onRetry={() => void refetch()} />
      ) : posts.length === 0 ? (
        <EmptyState message="No posts published yet." hint="New articles are on the way." />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post, index) => (
              <Reveal key={post._id ?? post.slug} delay={index * 0.05}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="panel group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {post.coverImage ? (
                    <img
                      src={resolveImageUrl(post.coverImage)}
                      alt={post.title}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                      {post.category ? <Badge tone="accent">{post.category}</Badge> : null}
                      {post.publicationDate ? <span>{formatDate(post.publicationDate)}</span> : null}
                    </div>
                    <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{excerpt(post.excerpt ?? post.content)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              View all posts
            </Link>
          </div>
        </>
      )}
    </Section>
  );
}
