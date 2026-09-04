import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { BlogPost } from '../../../shared/types';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { keys } from '../hooks/useContent';
import { resolveImageUrl } from '../lib/resolveImageUrl';

// Google Fonts that can be used for blog content
const GOOGLE_FONT_NAMES = [
  'Merriweather',
  'Playfair Display',
  'Lora',
  'Inter',
  'Roboto',
  'Source Serif 4',
  'EB Garamond',
  'Crimson Text',
  'Nunito',
  'Montserrat',
];

/** Dynamically load a Google Font */
function loadGoogleFont(fontName: string) {
  if (!GOOGLE_FONT_NAMES.includes(fontName)) return;
  const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName).replace(/%20/g, '+')}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
  document.head.appendChild(link);
}
import {
  Badge,
  ErrorState,
  Reveal,
  Section,
  Skeleton,
} from '../components/ui/primitives';

function renderInlineMarkdown(text: string): ReactNode[] {
  // Process inline markdown: bold, italic, strikethrough, code, links, images
  const nodes: ReactNode[] = [];
  // Regex to match inline elements in order of priority
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[([^\]]+)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const [fullMatch, , linkText, linkUrl, imgAlt, imgSrc] = match;

    if (fullMatch.startsWith('`')) {
      // Inline code
      nodes.push(<code key={`c-${keyCounter++}`} className="rounded bg-elevated px-1.5 py-0.5 font-mono text-sm">{fullMatch.slice(1, -1)}</code>);
    } else if (fullMatch.startsWith('***')) {
      // Bold + italic
      nodes.push(<em key={`ei-${keyCounter++}`} className="font-bold italic">{fullMatch.slice(3, -3)}</em>);
    } else if (fullMatch.startsWith('**')) {
      // Bold
      nodes.push(<strong key={`b-${keyCounter++}`} className="font-bold">{fullMatch.slice(2, -2)}</strong>);
    } else if (fullMatch.startsWith('*')) {
      // Italic
      nodes.push(<em key={`i-${keyCounter++}`}>{fullMatch.slice(1, -1)}</em>);
    } else if (fullMatch.startsWith('~~')) {
      // Strikethrough
      nodes.push(<del key={`s-${keyCounter++}`} className="line-through opacity-70">{fullMatch.slice(2, -2)}</del>);
    } else if (fullMatch.startsWith('![')) {
      // Image
      nodes.push(<img key={`im-${keyCounter++}`} src={imgSrc} alt={imgAlt || ''} className="my-4 max-h-80 w-full rounded-xl border border-border object-contain" loading="lazy" />);
    } else if (fullMatch.startsWith('[')) {
      // Link
      nodes.push(<a key={`a-${keyCounter++}`} href={linkUrl} target="_blank" rel="noreferrer noopener" className="font-medium text-primary underline-offset-4 hover:underline">{linkText}</a>);
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderContent(content: string): ReactNode[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      if (block.startsWith('### ')) {
        return <h3 key={index}>{renderInlineMarkdown(block.replace(/^###\s+/, ''))}</h3>;
      }
      if (block.startsWith('## ')) {
        return <h2 key={index}>{renderInlineMarkdown(block.replace(/^##\s+/, ''))}</h2>;
      }
      const lines = block.split('\n').map((line) => line.trim());
      if (lines.length > 0 && lines.every((line) => line.startsWith('- '))) {
        return (
          <ul key={index} className="list-disc space-y-1 pl-5">
            {lines.map((line, i) => (
              <li key={i}>{renderInlineMarkdown(line.slice(2))}</li>
            ))}
          </ul>
        );
      }
      // Handle ordered lists (1. 2. 3.)
      if (lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line))) {
        return (
          <ol key={index} className="list-decimal space-y-1 pl-5">
            {lines.map((line, i) => (
              <li key={i}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>
            ))}
          </ol>
        );
      }
      // Handle blockquotes
      if (block.startsWith('> ')) {
        return (
          <blockquote key={index} className="my-4 border-l-4 border-primary/40 bg-elevated/50 px-4 py-3 text-muted italic">
            {renderInlineMarkdown(block.replace(/^>\s+/, ''))}
          </blockquote>
        );
      }
      // Handle horizontal rules
      if (block === '---' || block === '***' || block === '___') {
        return <hr key={index} className="my-8 border-border" />;
      }
      return <p key={index}>{renderInlineMarkdown(block)}</p>;
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

  // Load Google Font when post has a contentFont
  useEffect(() => {
    if (post?.contentFont) {
      loadGoogleFont(post.contentFont);
    }
  }, [post?.contentFont]);

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
        {post.featuredImage && post.featuredImage !== post.coverImage ? (
          <div className="container-site mt-6">
            <img
              src={resolveImageUrl(post.featuredImage)}
              alt={`${post.title} - featured`}
              loading="lazy"
              className="max-h-[360px] w-full rounded-2xl border border-border object-cover shadow-md"
            />
            <p className="mt-1 text-center text-xs text-faint">Featured image</p>
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
