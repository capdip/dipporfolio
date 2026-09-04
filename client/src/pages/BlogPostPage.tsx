import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { BlogPost } from '../../../shared/types';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { keys } from '../hooks/useContent';
import { resolveImageUrl } from '../lib/resolveImageUrl';
import {
  Badge,
  ErrorState,
  Reveal,
  Section,
  Skeleton,
} from '../components/ui/primitives';

function renderContent(content: string): ReactNode[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      if (block.startsWith('### ')) {
        return <h3 key={index}>{block.replace(/^###\s+/, '')}</h3>;
      }
      if (block.startsWith('## ')) {
        return <h2 key={index}>{block.replace(/^##\s+/, '')}</h2>;
      }
      const lines = block.split('\n').map((line) => line.trim());
      if (lines.length > 0 && lines.every((line) => line.startsWith('- '))) {
        return (
          <ul key={index}>
            {lines.map((line, i) => (
              <li key={i}>{line.slice(2)}</li>
            ))}
          </ul>
        );
      }
      return <p key={index}>{block}</p>;
    });
}

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const postQuery = useQuery({
    queryKey: keys.item('blog', slug),
    queryFn: () => api.getBlogPostBySlug(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  const post: BlogPost | undefined = postQuery.data;

  useEffect(() => {
    if (post) {
      document.title = `${post.seoTitle ?? post.title} | Blog`;
    }
    return () => {
      document.title = '';
    };
  }, [post]);

  if (postQuery.isPending) {
    return (
      <main id="main-content" className="container-site py-16">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="mb-3 h-10 w-3/4" />
        <Skeleton className="mb-6 h-64 w-full rounded-2xl" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </main>
    );
  }

  if (postQuery.isError || !post) {
    return (
      <main id="main-content" className="container-site py-16">
        <ErrorState
          message={
            postQuery.error instanceof Error && postQuery.error.message.includes('404')
              ? 'This blog post could not be found.'
              : 'Could not load this blog post.'
          }
          onRetry={() => void postQuery.refetch()}
        />
        <div className="mt-6 text-center">
          <Link to="/blog" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            ← Back to blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content">
      <article>
        <header className="border-b border-border bg-elevated/40">
          <div className="container-site py-12">
            <Link
              to="/blog"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              ← Back to blog
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-faint">
              {post.category ? <Badge tone="accent">{post.category}</Badge> : null}
              {post.publicationDate ? <span>{formatDate(post.publicationDate)}</span> : null}
              {post.author ? <span>· By {post.author}</span> : null}
              {post.readingTime ? <span>· {post.readingTime} min read</span> : null}
            </div>
            <h1 className="mt-4 max-w-3xl font-heading text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              {post.title}
            </h1>
            {post.subtitle ? (
              <p className="mt-3 max-w-2xl font-heading text-lg font-medium text-muted">
                {post.subtitle}
              </p>
            ) : null}
            {post.tags && post.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </header>
        {post.coverImage ? (
          <div className="container-site mt-10">
            <img
              src={resolveImageUrl(post.coverImage)}
              alt={post.title}
              loading="lazy"
              className="max-h-[480px] w-full rounded-2xl border border-border object-cover shadow-lg"
            />
          </div>
        ) : null}
        <Section ariaLabel="Post content">
          <Reveal className="prose-content mx-auto max-w-3xl">
            <div
              style={
                post.contentFont
                  ? {
                      fontFamily: `'${post.contentFont}', Georgia, ui-sans-serif, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
                    }
                  : undefined
              }
            >
              {renderContent(post.content)}
            </div>
          </Reveal>
        </Section>
      </article>
    </main>
  );
}
