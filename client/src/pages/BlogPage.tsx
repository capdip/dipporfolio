import { Link } from 'react-router-dom';
import type { BlogPost } from '../../../shared/types';
import { excerpt, formatDate } from '../lib/format';
import { useResource } from '../hooks/useContent';
import {
  Badge,
  CardSkeleton,
  EmptyState,
  ErrorState,
  Reveal,
  Section,
  SectionHeading,
} from '../components/ui/primitives';

export default function BlogPage() {
  const { data, isLoading, isError, refetch } = useResource<BlogPost>('blog');
  const posts = (data ?? [])
    .filter((post) => post.status === 'published')
    .sort(
      (a, b) =>
        Number(b.featured ?? false) - Number(a.featured ?? false) ||
        (b.publicationDate ?? '').localeCompare(a.publicationDate ?? '')
    );

  return (
    <main id="main-content">
      <Section ariaLabel="Blog">
        <SectionHeading title="Blog" subtitle="Notes & articles" />
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Could not load blog posts." onRetry={() => void refetch()} />
        ) : posts.length === 0 ? (
          <EmptyState message="No posts published yet." hint="Check back soon for new writing." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Reveal key={post._id ?? post.slug} delay={index * 0.04}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="panel group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                      className="h-44 w-full object-cover"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                      {post.featured ? <Badge tone="warning">Featured</Badge> : null}
                      {post.category ? <Badge tone="accent">{post.category}</Badge> : null}
                      {post.publicationDate ? <span>{formatDate(post.publicationDate)}</span> : null}
                      {post.readingTime ? <span>· {post.readingTime} min read</span> : null}
                    </div>
                    <h2 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary">
                      {post.title}
                    </h2>
                    {post.subtitle ? (
                      <p className="text-sm font-medium text-muted">{post.subtitle}</p>
                    ) : null}
                    <p className="text-sm leading-relaxed text-muted">
                      {excerpt(post.excerpt ?? post.content, 140)}
                    </p>
                    {post.tags && post.tags.length > 0 ? (
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                        {post.tags.map((tag) => (
                          <Badge key={tag} tone="neutral">
                            #{tag}
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
      </Section>
    </main>
  );
}
