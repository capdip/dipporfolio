import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export const idSchema = z.string().min(1);
export const dateLabel = z.string().min(1).max(80);
export const optionalString = z.string().optional();
export const publishingStatus = z.enum(['draft', 'published', 'hidden', 'archived']);
export const visibilityFlag = z.boolean().optional().default(true);
export const orderField = z.number().int().nullable().optional();

const ctaButton = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  style: z.enum(['primary', 'secondary', 'ghost']).optional(),
  order: z.number().int(),
  enabled: z.boolean().optional(),
});

const linkRef = z.object({ label: z.string(), url: z.string() });

const socialLinks = z
  .object({
    linkedin: z.string().optional(),
    researchGate: z.string().optional(),
    github: z.string().optional(),
    twitter: z.string().optional(),
    orcid: z.string().optional(),
    scholar: z.string().optional(),
    website: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    figshare: z.string().optional(),
  })
  .optional();

const dateRange = z.object({
  start: z.string().min(1),
  end: z.string().optional(),
});
// Date-range fields accept null so cleared ranges can be unset server-side.
const nullableDateRange = dateRange.nullable().optional();

/* ------------------------------------------------------------------ */
/* Content entities                                                    */
/* ------------------------------------------------------------------ */

export const aboutUpdateSchema = z.object({
  profileText: z.string().max(4000).optional(),
  researchMotivation: z.string().max(4000).optional(),
  biography: z.string().max(8000).optional(),
  academicSummary: z.string().max(4000).optional(),
  profileImage: z.string().optional(),
  secondaryImage: z.string().optional(),
  images: z.array(z.string()).max(30).optional(),
  highlights: z.array(z.string()).max(12).optional(),
  cta: ctaButton.partial({ order: true }).extend({ label: z.string(), url: z.string(), order: z.number().int().optional() }).optional(),
  relatedLinks: z.array(linkRef).max(10).optional(),
  sceneKey: z.string().optional(),
  isActive: z.boolean().optional(),
  keywords: z.array(z.string()).max(30).optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(1).max(250),
  qualification: z.string().min(1).max(250),
  field: z.string().max(250).optional(),
  startDate: dateLabel,
  endDate: z.string().max(80).optional(),
  description: z.string().max(3000).optional(),
  location: z.string().max(200).optional(),
  status: z.string().max(60).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const researchSchema = z.object({
  title: z.string().min(1).max(200),
  shortDescription: z.string().max(1000).optional(),
  icon: z.string().max(60).optional(),
  image: z.string().optional(),
  relatedProjects: z.array(z.string()).optional(),
  relatedPublications: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const projectSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(300).optional(),
  description: z.string().min(1).max(8000),
  researchArea: z.string().max(200).optional(),
  dates: nullableDateRange,
  methodology: z.string().max(6000).optional(),
  objectives: z.string().max(6000).optional(),
  findings: z.string().max(6000).optional(),
  keywords: z.array(z.string()).optional(),
  projectImage: z.string().optional(),
  documents: z.array(z.string()).optional(),
  relatedPublications: z.array(z.string()).optional(),
  externalLinks: z.array(linkRef).optional(),
  status: publishingStatus.or(z.string()).default('published'),
  featured: z.boolean().optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const publicationSchema = z.object({
  title: z.string().min(1).max(500),
  authors: z.array(z.string().min(1)).min(1),
  year: z.string().min(4).max(10),
  publicationType: z.string().min(1).max(100),
  publisher: z.string().max(200).optional(),
  doi: z.string().max(160).optional(),
  abstract: z.string().max(12000).optional(),
  keywords: z.array(z.string()).optional(),
  url: z.string().max(600).optional(),
  pdf: z.string().max(600).optional(),
  coverImage: z.string().optional(),
  citation: z.string().max(2000).optional(),
  relatedProject: z.string().optional(),
  researchArea: z.string().max(200).optional(),
  featured: z.boolean().optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const experienceSchema = z.object({
  organization: z.string().min(1).max(250),
  position: z.string().min(1).max(250),
  location: z.string().max(200).optional(),
  startDate: dateLabel,
  endDate: z.string().max(80).optional(),
  responsibilities: z.array(z.string()).optional(),
  description: z.string().max(5000).optional(),
  achievements: z.array(z.string()).optional(),
  logo: z.string().optional(),
  image: z.string().optional(),
  relatedSkills: z.array(z.string()).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const internshipSchema = z.object({
  organization: z.string().min(1).max(250),
  department: z.string().min(1).max(300),
  dates: nullableDateRange,
  dateLabel: z.string().max(80).optional(),
  location: z.string().max(200).optional(),
  responsibilities: z.array(z.string()).optional(),
  description: z.string().max(5000).optional(),
  skills: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const researchExperienceSchema = z.object({
  organization: z.string().min(1).max(250),
  role: z.string().min(1).max(250),
  project: z.string().max(300).optional(),
  date: z.string().max(80).optional(),
  dateLabel: z.string().max(80).optional(),
  location: z.string().max(200).optional(),
  responsibilities: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  image: z.string().optional(),
  documents: z.array(z.string()).optional(),
  relatedSkills: z.array(z.string()).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const skillSchema = z.object({
  name: z.string().min(1).max(150),
  category: z.enum(['technical', 'laboratory', 'professional', 'communication', 'analytical']),
  proficiency: z.string().max(60).optional(),
  icon: z.string().max(60).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const conferenceSchema = z.object({
  title: z.string().min(1).max(400),
  startDate: z.string().max(40).optional(),
  endDate: z.string().max(40).optional(),
  dateLabel: dateLabel,
  sortDate: z.string().max(40).optional(),
  location: z.string().max(250).optional(),
  eventType: z.string().min(1).max(80),
  organizer: z.string().max(300).optional(),
  description: z.string().max(4000).optional(),
  certificate: z.string().optional(),
  image: z.string().optional(),
  link: z.string().max(600).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const trainingSchema = z.object({
  title: z.string().min(1).max(400),
  provider: z.string().max(250).optional(),
  dateLabel: dateLabel,
  sortDate: z.string().max(40).optional(),
  location: z.string().max(250).optional(),
  description: z.string().max(4000).optional(),
  topics: z.array(z.string()).optional(),
  certificate: z.string().optional(),
  image: z.string().optional(),
  document: z.string().optional(),
  hours: z.string().max(60).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const membershipSchema = z.object({
  organization: z.string().min(1).max(250),
  membershipType: z.string().max(150).optional(),
  membershipNumber: z.string().max(120).optional(),
  dateLabel: z.string().max(80).optional(),
  logo: z.string().optional(),
  website: z.string().max(400).optional(),
  description: z.string().max(2000).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const recommendationSchema = z
  .object({
    name: z.string().min(1).max(200),
    title: z.string().max(250),
    institution: z.string().max(250).optional(),
    recommendationText: z.string().max(4000).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(60).optional(),
    photo: z.string().optional(),
    // `visibility` is the canonical flag; `publicVisibility` is kept in sync
    // for backwards compatibility with older records/UI.
    publicVisibility: z.boolean().optional(),
    showEmail: z.boolean().optional().default(false),
    showPhone: z.boolean().optional().default(false),
    visibility: visibilityFlag,
    order: orderField,
  })
  .transform((data) => {
    const show = data.visibility ?? data.publicVisibility ?? true;
    return { ...data, visibility: show, publicVisibility: show };
  });

export const languageSchema = z.object({
  language: z.string().min(1).max(80),
  native: z.boolean().optional(),
  proficiency: z.string().max(60).optional(),
  order: orderField,
  visibility: visibilityFlag,
});

export const hobbySchema = z.object({
  name: z.string().min(1).max(120),
  icon: z.string().max(60).optional(),
  visibility: visibilityFlag,
  order: orderField,
});

export const blogPostSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(300).optional(),
  slug: z
    .string()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  author: z.string().max(150).optional(),
  coverImage: z.string().optional(),
  content: z.string().min(1),
  excerpt: z.string().max(600).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(250).optional(),
  seoDescription: z.string().max(400).optional(),
  canonicalUrl: z.string().max(600).optional(),
  featuredImage: z.string().optional(),
  contentFont: z.string().max(120).optional(),
  publicationDate: z.string().optional(),
  updatedDate: z.string().optional(),
  readingTime: z.number().int().positive().optional(),
  status: publishingStatus.default('draft'),
  featured: z.boolean().optional(),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().max(200).default(''),
  siteDescription: z.string().max(600).default(''),
  siteUrl: z.string().max(400).default(''),
  contactEmail: z.string().email().optional().or(z.literal('')),
  footer: z
    .object({
      name: z.string().optional(),
      professionalTitle: z.string().optional(),
      customText: z.string().max(600).optional(),
      copyright: z.string().max(300).optional(),
      email: z.string().optional(),
      location: z.string().max(200).optional(),
      showNavigation: z.boolean().optional(),
      showSocial: z.boolean().optional(),
    })
    .optional(),
  theme: z
    .object({
      defaultTheme: z.enum(['light', 'dark']).default('dark'),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#38bdf8'),
      accentColorSecondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#a78bfa'),
      fontFamilyHeading: z.string().max(120).default('Inter'),
      fontFamilyBody: z.string().max(120).default('Inter'),
      darkBackground: z.string().max(40).default('#04070f'),
      lightBackground: z.string().max(40).default('#f7f9fc'),
      radius: z.string().max(20).default('0.75rem'),
    })
    .optional(),
  contactPurposes: z.array(z.string().max(120)).max(20).optional(),
  socialLinks,
  reducedEffectsDefault: z.boolean().optional(),
});

export const contactMessageAdminSchema = z.object({
  status: z.enum(['unread', 'read', 'replied']).optional(),
});

export const contactSubmissionSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(150),
    email: z.string().email('Invalid email address').max(200),
    organization: z.string().max(200).optional(),
    subject: z.string().min(1, 'Subject is required').max(250),
    purpose: z.string().min(1, 'Purpose is required').max(120),
    message: z.string().min(1, 'Message is required').max(5000),
    honeypot: z.string().optional(),
  })
  .refine((data) => !data.honeypot || data.honeypot.trim() === '', {
    message: 'Spam detected',
    path: ['honeypot'],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(150),
  password: z.string().min(8).max(200),
  role: z.enum(['admin', 'editor']).default('editor'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  password: z.string().min(8).max(200).optional(),
  role: z.enum(['admin', 'editor']).optional(),
});

export const reorderSchema = z.object({
  ids: z.array(idSchema).min(1).max(500),
});

export const mediaMetadataSchema = z.object({
  altText: z.string().max(400).optional(),
  caption: z.string().max(600).optional(),
  credits: z.string().max(300).optional(),
  category: z.string().max(100).optional(),
  roles: z.array(z.string().max(60)).optional(),
  assignedTo: z
    .array(z.object({ type: z.string().max(80), id: z.string() }))
    .optional(),
  visibility: z.boolean().optional(),
});

export const cvFileSchema = z.object({
  label: z.string().min(1).max(200),
  isPublic: z.boolean().default(true),
  notes: z.string().max(500).optional(),
});

/** Registry used by the generic CRUD factory. */
export const resourceSchemas = {
  education: educationSchema,
  research: researchSchema,
  projects: projectSchema,
  publications: publicationSchema,
  experience: experienceSchema,
  internships: internshipSchema,
  'research-experience': researchExperienceSchema,
  skills: skillSchema,
  conferences: conferenceSchema,
  training: trainingSchema,
  memberships: membershipSchema,
  languages: languageSchema,
  hobbies: hobbySchema,
  recommendations: recommendationSchema,
  blog: blogPostSchema,
} as const;

export type ResourceName = keyof typeof resourceSchemas;
