import type { SiteSettings } from '../../../shared/types';

export const siteSettingsSeed: Omit<SiteSettings, '_id' | 'createdAt' | 'updatedAt'> = {
  siteName: 'Dipesh Thapa â€” Research Portfolio',
  siteDescription:
    'Interactive research portfolio of Dipesh Thapa â€” microbiology, biotechnology and international public health.',
  siteUrl: 'https://dipportfolio.github.io',
  contactEmail: 'tdipesh861@gmail.com',
  footer: {
    name: 'Dipesh Thapa',
    professionalTitle: 'Microbiologist Â· Biotechnologist Â· Public Health Researcher',
    customText:
      'Exploring the intersection of microbiology, biotechnology, public health and data.',
    copyright: 'Â© {year} Dipesh Thapa. All rights reserved.',
    email: 'tdipesh861@gmail.com',
    location: 'LÃ¼denscheid, Germany',
    showNavigation: true,
    showSocial: true,
  },
  theme: {
    defaultTheme: 'dark',
    accentColor: '#38bdf8',
    accentColorSecondary: '#a78bfa',
    fontFamilyHeading: 'Inter',
    fontFamilyBody: 'Inter',
    darkBackground: '#04070f',
    lightBackground: '#f7f9fc',
    radius: '0.75rem',
  },

  contactPurposes: [
    'PhD Opportunity',
    'Research Collaboration',
    'Academic Discussion',
    'Publication',
    'Professional Opportunity',
    'General Inquiry',
  ],
  socialLinks: {
    linkedin: 'https://www.linkedin.com/in/dipesh-thapa-6b0559215/',
    website: 'https://dipeshthapa23.com.np/',
    figshare: 'https://figshare.com/authors/Dipesh_Thapa/23756241',
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    orcid: 'https://orcid.org/',
  },
  reducedEffectsDefault: false,
};


