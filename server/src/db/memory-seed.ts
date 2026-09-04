import type { BlogPost } from '../../../shared/types';
import {
  aboutSeed,
  conferenceSeed,
  educationSeed,
  experienceSeed,
  hobbySeed,
  internshipSeed,
  languageSeed,
  membershipSeed,
  projectSeed,
  publicationSeed,
  recommendationSeed,
  researchExperienceSeed,
  researchSeed,
  skillSeed,
  trainingSeed,
} from '../data/cv-seed-data';
import { siteSettingsSeed } from '../data/site-seed';
import { getEnv } from '../config/env';
import { hashPassword } from '../lib/password';
import { memDb } from './memory-backend';

const sampleBlogPosts: BlogPost[] = [
  {
    title: 'Why Antimicrobial Resistance Needs a One Health Lens',
    slug: 'amr-one-health-perspective',
    excerpt:
      'Resistance does not respect borders between clinics, farms and rivers. A look at why surveillance must span all three.',
    content:
      'Antimicrobial resistance (AMR) is one of the clearest examples of why microbiology cannot be studied in isolation.\n\n## The problem\n\nResistant strains emerging in clinical settings are frequently linked to environmental reservoirs. Wastewater, agricultural runoff and hospital effluents form a continuous loop of gene exchange.\n\n## What One Health changes\n\n- Surveillance across human, animal and environmental sectors\n- Shared diagnostics and open data standards\n- Stewardship programmes that span disciplines\n\n## Where I want to contribute\n\nMy work on molecular typing and public-health data management aims to make these connections visible and actionable.',
    tags: ['AMR', 'One Health', 'Public Health'],
    category: 'Research Notes',
    status: 'published',
    author: 'Dipesh Thapa',
    publicationDate: '2026-05-18',
    readingTime: 5,
    coverImage: '/images/hero.jpg',
    contentFont: 'Inter',
  },
  {
    title: 'From Pipette to Policy: Lessons from Public Health Training',
    slug: 'from-pipette-to-policy',
    excerpt: 'What a laboratory bench taught me about health systems.',
    content:
      'Moving between molecular biology labs and public-health classrooms reshaped how I think about evidence.\n\n## Bench skills travel further than you expect\n\nPrecision, documentation and reproducibility matter equally in epidemiology.',
    tags: ['Career', 'Public Health', 'Laboratory'],
    category: 'Reflections',
    status: 'published',
    author: 'Dipesh Thapa',
    publicationDate: '2026-06-02',
    readingTime: 4,
    coverImage: '/images/hero.jpg',
    contentFont: 'Inter',
  },
];

const mediaSeed = [
  {
    filename: 'hero.jpg',
    originalName: 'hero.jpg',
    mimeType: 'image/jpeg',
    size: 94215,
    url: '/images/hero.jpg',
    altText: 'Working at the Bunsen burner in the microbiology lab',
    category: 'site',
  },
];

export const seedMemoryData = async (): Promise<void> => {
  const now = new Date().toISOString();
  const putList = (name: string, docs: unknown[]) => {
    const col = memDb.collection(name);
    for (const doc of docs) void col.insertOne(JSON.parse(JSON.stringify(doc)) as Record<string, unknown>);
  };

  putList('about', [{ _id: 'seed-about', ...aboutSeed, isActive: true }]);
  putList('education', JSON.parse(JSON.stringify(educationSeed)));
  putList('research', JSON.parse(JSON.stringify(researchSeed)));
  putList('projects', JSON.parse(JSON.stringify(projectSeed)));
  putList('publications', JSON.parse(JSON.stringify(publicationSeed)));
  putList('experience', JSON.parse(JSON.stringify(experienceSeed)));
  putList('internships', JSON.parse(JSON.stringify(internshipSeed)));
  putList('research-experience', JSON.parse(JSON.stringify(researchExperienceSeed)));
  putList('skills', JSON.parse(JSON.stringify(skillSeed)));
  putList('conferences', JSON.parse(JSON.stringify(conferenceSeed)));
  putList('training', JSON.parse(JSON.stringify(trainingSeed)));
  putList('memberships', JSON.parse(JSON.stringify(membershipSeed)));
  putList('languages', JSON.parse(JSON.stringify(languageSeed)));
  putList('hobbies', JSON.parse(JSON.stringify(hobbySeed)));
  putList('recommendations', JSON.parse(JSON.stringify(recommendationSeed)));
  putList('blog_posts', JSON.parse(JSON.stringify(sampleBlogPosts)));
  putList('media', JSON.parse(JSON.stringify(mediaSeed)));
  putList('site_settings', [
    JSON.parse(
      JSON.stringify({
        _id: 'site_settings_singleton',
        ...siteSettingsSeed,
        createdAt: now,
        updatedAt: now,
      })
    ),
  ]);


  memDb.collection('cv_files').docs.set(
    'seed-cv-main',
    JSON.parse(
      JSON.stringify({
        _id: 'seed-cv-main',
        filename: 'Dipesh-Thapa-CV.pdf',
        originalName: 'Dipesh Thapa CV.pdf',
        label: 'Curriculum Vitae',
        size: 392118,
        mimeType: 'application/pdf',
        isPublic: true,
        active: true,
        notes: 'Bundled CV served from server/public/cv when no upload exists.',
        createdAt: now,
        updatedAt: now,
      })
    )
  );

  const env = getEnv();
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  memDb.collection('users').docs.set(
    'seed-user-admin',
    JSON.parse(
      JSON.stringify({
        _id: 'seed-user-admin',
        email: env.ADMIN_EMAIL,
        name: env.ADMIN_NAME,
        role: 'admin',
        passwordHash,
        tokenVersion: 0,
        createdAt: now,
      })
    )
  );
};

