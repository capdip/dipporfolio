// Shared types between frontend and backend.
// These describe the content entities stored in Astra DB and exchanged over the REST API.

export type PublishingStatus = 'draft' | 'published' | 'hidden' | 'archived';

export interface BaseRecord {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CtaButton {
  id?: string;
  label: string;
  url: string;
  style?: 'primary' | 'secondary' | 'ghost';
  order: number;
  enabled?: boolean;
}

export interface SocialLinks {
  linkedin?: string;
  researchGate?: string;
  github?: string;
  twitter?: string;
  orcid?: string;
  scholar?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  figshare?: string;
}

export interface DateRange {
  start: string;
  end?: string;
}

export interface LinkRef {
  label: string;
  url: string;
}

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

export interface AboutContent extends BaseRecord {
  profileText?: string;
  researchMotivation?: string;
  biography?: string;
  academicSummary?: string;
  profileImage?: string;
  secondaryImage?: string;
  images?: string[];
  highlights?: string[];
  cta?: CtaButton;
  relatedLinks?: LinkRef[];
  sceneKey?: string;
  isActive?: boolean;
  keywords?: string[];
}

/* ------------------------------------------------------------------ */
/* Education                                                           */
/* ------------------------------------------------------------------ */

export interface Education extends BaseRecord {
  institution: string;
  qualification: string;
  field?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  status?: string;
  visibility?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Research                                                            */
/* ------------------------------------------------------------------ */

export interface Research extends BaseRecord {
  title: string;
  shortDescription?: string;
  icon?: string;
  image?: string;
  relatedProjects?: string[];
  relatedPublications?: string[];
  keywords?: string[];
  visibility?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export interface Project extends BaseRecord {
  title: string;
  subtitle?: string;
  description: string;
  researchArea?: string;
  dates?: DateRange;
  methodology?: string;
  objectives?: string;
  findings?: string;
  keywords?: string[];
  projectImage?: string;
  documents?: string[];
  relatedPublications?: string[];
  externalLinks?: LinkRef[];
  status?: PublishingStatus | string;
  featured?: boolean;
  visibility?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Publications                                                        */
/* ------------------------------------------------------------------ */

export interface Publication extends BaseRecord {
  title: string;
  authors: string[];
  year: string;
  publicationType: string;
  publisher?: string;
  doi?: string;
  abstract?: string;
  keywords?: string[];
  url?: string;
  pdf?: string;
  coverImage?: string;
  citation?: string;
  relatedProject?: string;
  researchArea?: string;
  featured?: boolean;
  visibility?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Experience / internships / research & community                     */
/* ------------------------------------------------------------------ */

export interface Experience extends BaseRecord {
  organization: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  responsibilities?: string[];
  description?: string;
  achievements?: string[];
  logo?: string;
  image?: string;
  relatedSkills?: string[];
  visibility?: boolean;
  order?: number;
}

export interface Internship extends BaseRecord {
  organization: string;
  department: string;
  dates?: DateRange;
  dateLabel?: string;
  location?: string;
  responsibilities?: string[];
  description?: string;
  skills?: string[];
  images?: string[];
  documents?: string[];
  visibility?: boolean;
  order?: number;
}

export interface ResearchExperience extends BaseRecord {
  organization: string;
  role: string;
  project?: string;
  date?: string;
  dateLabel?: string;
  location?: string;
  responsibilities?: string[];
  outcomes?: string[];
  image?: string;
  documents?: string[];
  relatedSkills?: string[];
  visibility?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Skills / languages / hobbies                                        */
/* ------------------------------------------------------------------ */

export type SkillCategory =
  | 'technical'
  | 'laboratory'
  | 'professional'
  | 'communication'
  | 'analytical';

export interface Skill extends BaseRecord {
  name: string;
  category: SkillCategory | string;
  proficiency?: string;
  icon?: string;
  visibility?: boolean;
  order?: number;
}

export interface Language extends BaseRecord {
  language: string;
  native?: boolean;
  proficiency?: string;
  order?: number;
  visibility?: boolean;
}

export interface Hobby extends BaseRecord {
  name: string;
  icon?: string;
  visibility?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Conferences / training                                              */
/* ------------------------------------------------------------------ */

export interface Conference extends BaseRecord {
  title: string;
  startDate?: string;
  endDate?: string;
  dateLabel: string;
  sortDate?: string;
  location?: string;
  eventType: string;
  organizer?: string;
  description?: string;
  certificate?: string;
  image?: string;
  link?: string;
  visibility?: boolean;
  order?: number;
}

export interface Training extends BaseRecord {
  title: string;
  provider?: string;
  dateLabel: string;
  sortDate?: string;
  location?: string;
  description?: string;
  topics?: string[];
  certificate?: string;
  image?: string;
  document?: string;
  hours?: string;
  visibility?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Memberships / recommendations                                       */
/* ------------------------------------------------------------------ */

export interface Membership extends BaseRecord {
  organization: string;
  membershipType?: string;
  membershipNumber?: string;
  dateLabel?: string;
  logo?: string;
  website?: string;
  description?: string;
  visibility?: boolean;
  order?: number;
}

export interface Recommendation extends BaseRecord {
  name: string;
  title: string;
  institution?: string;
  recommendationText?: string;
  email?: string;
  phone?: string;
  photo?: string;
  visibility?: boolean;
  publicVisibility?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */

export interface BlogPost extends BaseRecord {
  title: string;
  subtitle?: string;
  slug: string;
  author?: string;
  coverImage?: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  featuredImage?: string;
  /** Font family used to render the article body on the public page. */
  contentFont?: string;
  publicationDate?: string;
  updatedDate?: string;
  readingTime?: number;
  status: PublishingStatus | string;
  featured?: boolean;
}

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export type ContactStatus = 'unread' | 'read' | 'replied';

export interface ContactMessage extends BaseRecord {
  name: string;
  email: string;
  organization?: string;
  subject: string;
  purpose: string;
  message: string;
  status?: ContactStatus;
}

export interface ContactSubmissionInput {
  name: string;
  email: string;
  organization?: string;
  subject: string;
  purpose: string;
  message: string;
  honeypot?: string;
}

/* ------------------------------------------------------------------ */
/* Media library                                                       */
/* ------------------------------------------------------------------ */

export interface MediaAssignment {
  type: string;
  id: string;
}

export interface MediaItem extends BaseRecord {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  altText?: string;
  caption?: string;
  credits?: string;
  category?: string;
  roles?: string[];
  assignedTo?: MediaAssignment[];
  visibility?: boolean;
}

/* ------------------------------------------------------------------ */
/* CV manager                                                          */
/* ------------------------------------------------------------------ */

export interface CvFile extends BaseRecord {
  filename: string;
  originalName: string;
  label: string;
  size: number;
  mimeType: string;
  url?: string;
  isPublic: boolean;
  active: boolean;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/* Settings / theme                                                    */
/* ------------------------------------------------------------------ */

export interface FooterSettings {
  name?: string;
  professionalTitle?: string;
  customText?: string;
  copyright?: string;
  email?: string;
  location?: string;
  showNavigation?: boolean;
  showSocial?: boolean;
}

export interface ThemeSettings {
  defaultTheme: 'light' | 'dark';
  accentColor: string;
  accentColorSecondary: string;
  fontFamilyHeading: string;
  fontFamilyBody: string;
  darkBackground: string;
  lightBackground: string;
  radius: string;
}

export interface SiteSettings extends BaseRecord {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  contactEmail?: string;
  footer?: FooterSettings;
  theme?: ThemeSettings;
  contactPurposes?: string[];
  socialLinks?: SocialLinks;
  reducedEffectsDefault?: boolean;
}

/* ------------------------------------------------------------------ */
/* Auth / users / audit                                                */
/* ------------------------------------------------------------------ */

export type UserRole = 'admin' | 'editor';

export interface UserRecord extends BaseRecord {
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  lastLoginAt?: string;
  tokenVersion?: number;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthSuccess {
  token: string;
  user: PublicUser;
}

export interface AuditLogEntry extends BaseRecord {
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
}

/* ------------------------------------------------------------------ */
/* API envelope                                                        */
/* ------------------------------------------------------------------ */

export interface ApiErrorShape {
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiErrorShape;
}

export type { Education as EducationRecord };
