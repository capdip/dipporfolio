import { describe, expect, it } from 'vitest';
import {
  ApiResponse,
  BlogPost,
  ContactSubmissionInput,
  Research,
} from '../shared/types';

describe('shared type contracts', () => {
  it('blog post requires slug, content and status', () => {
    const post: BlogPost = {
      title: 'CRISPR off-target effects',
      slug: 'crispr-off-target-effects',
      content: '## Summary\nBody text.',
      status: 'published',
      authors: ['Dipesh Thapa'],
      year: '2026',
      publicationType: 'Blog',
    };
    expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    expect(['draft', 'published', 'hidden', 'archived']).toContain(post.status);
  });

  it('research interest carries related records and keywords', () => {
    const interest: Research = {
      title: 'Molecular microbiology',
      icon: '🧬',
      image: '/uploads/example.jpg',
      relatedProjects: ['proj-1'],
      relatedPublications: ['pub-1'],
      keywords: ['biofilm', 'CRISPR'],
      visibility: true,
      order: 1,
    };
    expect(interest.keywords?.length).toBeGreaterThan(0);
    expect(interest.relatedProjects).toContain('proj-1');
  });

  it('contact submission carries honeypot field for spam filtering', () => {
    const input: ContactSubmissionInput = {
      name: 'Jane Doe',
      email: 'jane@lab.org',
      subject: 'Collaboration',
      purpose: 'Collaboration',
      message: 'Interested in your work on protein folding.',
      honeypot: '',
    };
    expect(input.honeypot).toBe('');
  });

  it('api envelope wraps payloads', () => {
    const envelope: ApiResponse<string[]> = { success: true, data: ['a'] };
    expect(envelope.success).toBe(true);
    expect(envelope.data?.length).toBe(1);
  });
});
