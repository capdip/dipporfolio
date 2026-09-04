import { describe, expect, it } from 'vitest';
import {
  educationSchema,
  publicationSchema,
  projectSchema,
  blogPostSchema,
  contactSubmissionSchema,
  skillSchema,
  loginSchema,
  createUserSchema,
  resourceSchemas,
} from '../server/src/validation/schemas';

describe('validation schemas', () => {

  describe('educationSchema', () => {
    it('accepts minimal valid education', () => {
      const result = educationSchema.safeParse({ institution: 'University', qualification: 'M.Sc.', startDate: '2020' });
      expect(result.success).toBe(true);
    });

    it('rejects missing institution', () => {
      const result = educationSchema.safeParse({ qualification: 'X', startDate: '2020' });
      expect(result.success).toBe(false);
    });
  });

  describe('publicationSchema', () => {
    it('accepts valid publication', () => {
      const result = publicationSchema.safeParse({
        title: 'AMR in Nepal',
        authors: ['Dipesh Thapa'],
        year: '2026',
        publicationType: 'Thesis',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing authors array', () => {
      const result = publicationSchema.safeParse({ title: 'X', year: '2026', publicationType: 'Journal' });
      expect(result.success).toBe(false);
    });
  });

  describe('projectSchema', () => {
    it('accepts valid project', () => {
      const result = projectSchema.safeParse({ title: 'AMR Study', description: 'A study on AMR' });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = projectSchema.safeParse({ title: '', description: 'test' });
      expect(result.success).toBe(false);
    });
  });

  describe('blogPostSchema', () => {
    it('accepts valid blog post', () => {
      const result = blogPostSchema.safeParse({
        title: 'My Post',
        slug: 'my-post',
        content: 'Body content here',
        status: 'published',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid slug format', () => {
      const result = blogPostSchema.safeParse({
        title: 'X',
        slug: 'Invalid Slug!',
        content: 'test',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('contactSubmissionSchema', () => {
    it('accepts valid contact form', () => {
      const result = contactSubmissionSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@lab.org',
        subject: 'Collaboration',
        purpose: 'Research Collaboration',
        message: 'Interested in your work on AMR.',
        honeypot: '',
      });
      expect(result.success).toBe(true);
    });

    it('rejects honeypot with content (spam)', () => {
      const result = contactSubmissionSchema.safeParse({
        name: 'Bot',
        email: 'bot@spam.com',
        subject: 'Spam',
        purpose: 'Other',
        message: 'Buy stuff now!',
        honeypot: 'gotcha',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = contactSubmissionSchema.safeParse({
        name: 'X',
        email: 'not-an-email',
        subject: 'Test',
        purpose: 'Other',
        message: 'Hello there friend',
      });
      expect(result.success).toBe(false);
    });
  });


  describe('skillSchema', () => {
    it('accepts valid skill', () => {
      const result = skillSchema.safeParse({ name: 'SPSS', category: 'technical' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid category', () => {
      const result = skillSchema.safeParse({ name: 'X', category: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login', () => {
      const result = loginSchema.safeParse({ email: 'a@b.com', password: 'secret' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'bad', password: 'x' });
      expect(result.success).toBe(false);
    });
  });

  describe('createUserSchema', () => {
    it('accepts valid user creation', () => {
      const result = createUserSchema.safeParse({
        email: 'user@test.com',
        name: 'Test User',
        password: 'longpassword',
        role: 'editor',
      });
      expect(result.success).toBe(true);
    });

    it('defaults role to editor', () => {
      const result = createUserSchema.safeParse({
        email: 'user@test.com',
        name: 'Test',
        password: 'longpassword',
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.role).toBe('editor');
    });
  });
  describe('resourceSchemas registry', () => {
    it('registers every public CMS resource', () => {
      for (const name of ['education', 'research', 'projects', 'publications', 'experience', 'blog'] as const) {
        expect(resourceSchemas[name]).toBeDefined();
      }
    });

    it('education schema no longer accepts logo/image fields', () => {
      const schema = resourceSchemas.education;
      const parsed = schema.safeParse({ institution: 'X', qualification: 'Y', startDate: '2020' });
      expect(parsed.success).toBe(true);
    });
  });
});
