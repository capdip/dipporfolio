export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'select'
  | 'tags'
  | 'image'
  | 'links'
  | 'ctas'
  | 'daterange';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  helpText?: string;
}

export interface ResourceSchema {
  label: string;
  singularLabel: string;
  fields: FieldDef[];
  defaultOrder: 'asc' | 'desc';
}

const visibilityField: FieldDef = { name: 'visibility', label: 'Visible on site', type: 'checkbox' };
const orderField: FieldDef = { name: 'order', label: 'Sort order', type: 'number' };

export const resourceSchemas: Record<string, ResourceSchema> = {
  education: {
    label: 'Education',
    singularLabel: 'Education entry',
    defaultOrder: 'asc',
    fields: [
      { name: 'institution', label: 'Institution', type: 'text', required: true },
      { name: 'qualification', label: 'Qualification', type: 'text', required: true },
      { name: 'field', label: 'Field of study', type: 'text' },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'location', label: 'Location', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['Completed', 'In Progress', 'Expected'],
      },
      { name: 'description', label: 'Description', type: 'textarea' },
      visibilityField,
      orderField,
    ],
  },
  research: {
    label: 'Research',
    singularLabel: 'Research topic',
    defaultOrder: 'asc',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'shortDescription', label: 'Short description', type: 'textarea' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'relatedProjects', label: 'Related projects', type: 'tags' },
      { name: 'relatedPublications', label: 'Related publications', type: 'tags' },
      { name: 'keywords', label: 'Keywords', type: 'tags' },
      visibilityField,
      orderField,
    ],
  },
  projects: {
    label: 'Projects',
    singularLabel: 'Project',
    defaultOrder: 'asc',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'researchArea', label: 'Research area', type: 'text' },
      { name: 'dates', label: 'Date range', type: 'daterange' },
      { name: 'methodology', label: 'Methodology', type: 'textarea' },
      { name: 'objectives', label: 'Objectives', type: 'textarea' },
      { name: 'findings', label: 'Findings', type: 'textarea' },
      { name: 'keywords', label: 'Keywords', type: 'tags', placeholder: 'Type and press Enter' },
      { name: 'projectImage', label: 'Project image', type: 'image' },
      { name: 'documents', label: 'Documents (URLs)', type: 'tags', placeholder: 'Paste URLs and press Enter' },
      { name: 'relatedPublications', label: 'Related publications', type: 'tags', placeholder: 'Type and press Enter', helpText: 'Add publication titles or IDs related to this project' },
      { name: 'externalLinks', label: 'External links', type: 'links' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['draft', 'published', 'hidden', 'archived'],
      },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      visibilityField,
      orderField,
    ],
  },
  publications: {
    label: 'Publications',
    singularLabel: 'Publication',
    defaultOrder: 'asc',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'authors', label: 'Authors', type: 'tags', required: true },
      { name: 'year', label: 'Year', type: 'text', required: true },
      {
        name: 'publicationType',
        label: 'Publication type',
        type: 'select',
        required: true,
        options: ['Journal Article', 'Conference Paper', 'Preprint', 'Book Chapter', 'Thesis', 'Other'],
      },
      { name: 'publisher', label: 'Publisher', type: 'text' },
      { name: 'doi', label: 'DOI', type: 'text' },
      { name: 'abstract', label: 'Abstract', type: 'textarea' },
      { name: 'keywords', label: 'Keywords', type: 'tags' },
      { name: 'url', label: 'URL', type: 'text' },
      { name: 'pdf', label: 'PDF URL', type: 'text' },
      { name: 'coverImage', label: 'Cover image', type: 'image' },
      { name: 'citation', label: 'Citation', type: 'textarea' },
      { name: 'relatedProject', label: 'Related project ID', type: 'text' },
      { name: 'researchArea', label: 'Research area', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      visibilityField,
      orderField,
    ],
  },
  experience: {
    label: 'Experience',
    singularLabel: 'Experience entry',
    defaultOrder: 'asc',
    fields: [
      { name: 'organization', label: 'Organization', type: 'text', required: true },
      { name: 'position', label: 'Position', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'responsibilities', label: 'Responsibilities', type: 'tags', placeholder: 'Type and press Enter' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe your role and responsibilities...', helpText: 'Detailed description of your experience' },
      { name: 'achievements', label: 'Achievements', type: 'tags', placeholder: 'Type and press Enter', helpText: 'Key achievements and accomplishments' },
      { name: 'logo', label: 'Logo', type: 'image', helpText: 'Upload or paste organization logo URL' },
      { name: 'image', label: 'Image', type: 'image', helpText: 'Upload or paste related image URL' },
      { name: 'relatedSkills', label: 'Related skills', type: 'tags', placeholder: 'Type and press Enter', helpText: 'Skills developed during this experience' },
      visibilityField,
      orderField,
    ],
  },
  internships: {
    label: 'Internships',
    singularLabel: 'Internship',
    defaultOrder: 'asc',
    fields: [
      { name: 'organization', label: 'Organization', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text', required: true },
      { name: 'dates', label: 'Date range', type: 'daterange' },
      { name: 'dateLabel', label: 'Date label', type: 'text', placeholder: 'e.g. Summer 2024' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'responsibilities', label: 'Responsibilities', type: 'tags' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'skills', label: 'Skills', type: 'tags' },
      { name: 'images', label: 'Images (URLs)', type: 'tags' },
      { name: 'documents', label: 'Documents (URLs)', type: 'tags' },
      visibilityField,
      orderField,
    ],
  },
  'research-experience': {
    label: 'Research Experience',
    singularLabel: 'Research experience entry',
    defaultOrder: 'asc',
    fields: [
      { name: 'organization', label: 'Organization', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'project', label: 'Project', type: 'text' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'dateLabel', label: 'Date label', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'responsibilities', label: 'Responsibilities', type: 'tags' },
      { name: 'outcomes', label: 'Outcomes', type: 'tags' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'documents', label: 'Documents (URLs)', type: 'tags' },
      { name: 'relatedSkills', label: 'Related skills', type: 'tags' },
      visibilityField,
      orderField,
    ],
  },
  skills: {
    label: 'Skills',
    singularLabel: 'Skill',
    defaultOrder: 'asc',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: ['technical', 'laboratory', 'professional', 'communication', 'analytical'],
      },
      {
        name: 'proficiency',
        label: 'Proficiency',
        type: 'select',
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
      { name: 'icon', label: 'Icon', type: 'text' },
      visibilityField,
      orderField,
    ],
  },
  conferences: {
    label: 'Conferences',
    singularLabel: 'Conference',
    defaultOrder: 'asc',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'startDate', label: 'Start date', type: 'date' },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'dateLabel', label: 'Date label', type: 'text', required: true },
      { name: 'sortDate', label: 'Sort date', type: 'date' },
      { name: 'location', label: 'Location', type: 'text' },
      {
        name: 'eventType',
        label: 'Event type',
        type: 'select',
        required: true,
        options: ['Conference', 'Symposium', 'Workshop', 'Seminar', 'Webinar', 'Other'],
      },
      { name: 'organizer', label: 'Organizer', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'certificate', label: 'Certificate image', type: 'image' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'link', label: 'Link', type: 'text' },
      visibilityField,
      orderField,
    ],
  },
  training: {
    label: 'Training',
    singularLabel: 'Training entry',
    defaultOrder: 'asc',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'provider', label: 'Provider', type: 'text' },
      { name: 'dateLabel', label: 'Date label', type: 'text', required: true },
      { name: 'sortDate', label: 'Sort date', type: 'date' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'topics', label: 'Topics', type: 'tags' },
      { name: 'certificate', label: 'Certificate image', type: 'image' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'document', label: 'Document URL', type: 'text' },
      { name: 'hours', label: 'Hours', type: 'text' },
      visibilityField,
      orderField,
    ],
  },
  memberships: {
    label: 'Memberships',
    singularLabel: 'Membership',
    defaultOrder: 'asc',
    fields: [
      { name: 'organization', label: 'Organization', type: 'text', required: true },
      { name: 'membershipType', label: 'Membership type', type: 'text' },
      { name: 'membershipNumber', label: 'Membership number', type: 'text' },
      { name: 'dateLabel', label: 'Date label', type: 'text' },
      { name: 'logo', label: 'Logo', type: 'image' },
      { name: 'website', label: 'Website', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      visibilityField,
      orderField,
    ],
  },
  languages: {
    label: 'Languages',
    singularLabel: 'Language',
    defaultOrder: 'asc',
    fields: [
      { name: 'language', label: 'Language', type: 'text', required: true },
      { name: 'native', label: 'Native speaker', type: 'checkbox' },
      {
        name: 'proficiency',
        label: 'Proficiency',
        type: 'select',
        options: ['Basic', 'Intermediate', 'Fluent', 'Native'],
      },
      orderField,
      visibilityField,
    ],
  },
  hobbies: {
    label: 'Hobbies',
    singularLabel: 'Hobby',
    defaultOrder: 'asc',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'icon', label: 'Icon', type: 'text' },
      visibilityField,
      orderField,
    ],
  },
  recommendations: {
    label: 'Recommendations',
    singularLabel: 'Recommendation',
    defaultOrder: 'asc',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'title', label: 'Title / position', type: 'text', required: true },
      { name: 'institution', label: 'Institution', type: 'text' },
      { name: 'recommendationText', label: 'Recommendation text', type: 'textarea' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'photo', label: 'Photo', type: 'image' },
      { name: 'visibility', label: 'Show publicly', type: 'checkbox' },
      { name: 'showEmail', label: 'Show email', type: 'checkbox' },
      { name: 'showPhone', label: 'Show phone', type: 'checkbox' },
      orderField,
    ],
  },
};

