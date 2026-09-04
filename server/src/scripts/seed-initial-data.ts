import path from 'path';
import dotenv from 'dotenv';
import { getDb } from '../db/database';
import { hashPassword } from '../lib/password';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Seed initial data for the portfolio site.
 * This creates default hero, about, settings, and 3D scenes if they don't exist.
 */
async function seedInitialData() {
  try {
    console.log('Starting database seed...');
    const db = getDb();

    // Seed default hero content
    const heroCollection = db.collection('hero');
    const existingHero = await heroCollection.findOne({});
    if (!existingHero) {
      await heroCollection.insertOne({
        name: 'Dipesh Thapa',
        title: 'Researcher & Scientist',
        subtitle: 'Exploring the frontiers of microbiology and molecular biology',
        description: 'Passionate researcher dedicated to advancing scientific understanding through innovative studies and collaborative research.',
        email: 'dipesh@example.com',
        phone: '+977-XXXXXXXXXX',
        location: 'Nepal',
        profileImage: '/uploads/photo-1787331982549-fd302a08.jpg',
        backgroundImage: '',
        sceneKey: 'hero-scene',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/dipeshthapa',
          github: 'https://github.com/dipeshthapa',
          researchGate: 'https://researchgate.net/profile/Dipesh-Thapa',
        },
        ctaButtons: [
          {
            label: 'View CV',
            url: '/api/cv/download',
            style: 'primary',
            order: 1,
            enabled: true,
          },
          {
            label: 'Contact Me',
            url: '#contact',
            style: 'secondary',
            order: 2,
            enabled: true,
          },
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✓ Seeded default hero content');
    }

    // Seed default about content
    const aboutCollection = db.collection('about');
    const existingAbout = await aboutCollection.findOne({});
    if (!existingAbout) {
      await aboutCollection.insertOne({
        profileText: 'Dedicated microbiology researcher with expertise in molecular biology techniques and a passion for scientific discovery.',
        researchMotivation: 'Driven by curiosity to understand complex biological systems and contribute to solutions for global health challenges.',
        biography: 'I am a researcher specializing in microbiology and molecular biology. My work focuses on understanding microbial interactions and developing innovative approaches to address biological challenges. With a strong foundation in laboratory techniques and data analysis, I strive to contribute meaningful insights to the scientific community.',
        academicSummary: 'Background in microbiology with extensive training in molecular biology techniques, bioinformatics, and research methodology.',
        profileImage: '/uploads/photo-1787331982549-fd302a08.jpg',
        secondaryImage: '',
        highlights: [
          'Published research in peer-reviewed journals',
          'Experienced in advanced molecular techniques',
          'Strong background in data analysis and bioinformatics',
          'Collaborative researcher with international experience',
        ],
        sceneKey: 'bio-scene',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✓ Seeded default about content');
    }

    // Seed default site settings
    const settingsCollection = db.collection('site_settings');
    const existingSettings = await settingsCollection.findOne({ _id: 'site_settings_singleton' });
    if (!existingSettings) {
      await settingsCollection.insertOne({
        _id: 'site_settings_singleton',
        siteName: 'Dipesh Thapa - Portfolio',
        siteDescription: 'Research portfolio of Dipesh Thapa, microbiology researcher',
        siteUrl: 'https://dipportfolio.github.io',
        contactEmail: 'dipesh@example.com',
        contactPurposes: ['Collaboration', 'Inquiry', 'Job Opportunity', 'General Question'],
        footer: {
          name: 'Dipesh Thapa',
          professionalTitle: 'Researcher & Scientist',
          customText: 'Advancing science through dedicated research and collaboration.',
          copyright: `© ${new Date().getFullYear()} Dipesh Thapa. All rights reserved.`,
          email: 'dipesh@example.com',
          location: 'Nepal',
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
        seo: {
          pageTitleTemplate: '%s | Dipesh Thapa',
          metaDescription: 'Research portfolio of Dipesh Thapa, microbiology researcher and scientist.',
          canonicalBase: 'https://dipportfolio.github.io',
          structuredDataEnabled: true,
        },
        socialLinks: {
          linkedin: 'https://linkedin.com/in/dipeshthapa',
          github: 'https://github.com/dipeshthapa',
          researchGate: 'https://researchgate.net/profile/Dipesh-Thapa',
        },
        reducedEffectsDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✓ Seeded default site settings');
    }

    // Seed default 3D scenes
    const scenesCollection = db.collection('three-scenes');
    const existingScenes = await scenesCollection.find({}).toArray();
    if (existingScenes.length === 0) {
      const defaultScenes = [
        {
          sceneKey: 'hero-scene',
          name: 'Hero - DNA Helix',
          enabled: true,
          particleDensity: 'medium',
          rotationSpeed: 0.2,
          colorPrimary: '#38bdf8',
          colorAccent: '#a78bfa',
          showGrid: true,
          showParticles: true,
          cameraDistance: 9,
          description: 'DNA helix animation for hero section',
        },
        {
          sceneKey: 'bio-scene',
          name: 'Bio - Microbiology',
          enabled: true,
          particleDensity: 'high',
          rotationSpeed: 0.3,
          colorPrimary: '#22c55e',
          colorAccent: '#3b82f6',
          showGrid: true,
          showParticles: true,
          cameraDistance: 12,
          description: 'Microbiology themed scene',
        },
        {
          sceneKey: 'molecule-scene',
          name: 'Molecule',
          enabled: true,
          particleDensity: 'medium',
          rotationSpeed: 0.15,
          colorPrimary: '#f59e0b',
          colorAccent: '#ef4444',
          showGrid: false,
          showParticles: true,
          cameraDistance: 8,
          description: 'Molecular structure visualization',
        },
        {
          sceneKey: 'network-scene',
          name: 'Network',
          enabled: true,
          particleDensity: 'low',
          rotationSpeed: 0.1,
          colorPrimary: '#8b5cf6',
          colorAccent: '#ec4899',
          showGrid: true,
          showParticles: true,
          cameraDistance: 15,
          description: 'Network connections visualization',
        },
      ];
      await scenesCollection.insertMany(defaultScenes);
      console.log('✓ Seeded default 3D scenes');
    }

    // Ensure admin user exists
    const usersCollection = db.collection('users');
    const existingAdmin = await usersCollection.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const defaultPassword = await hashPassword('admin123456');
      await usersCollection.insertOne({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        passwordHash: defaultPassword,
        tokenVersion: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✓ Created default admin user (email: admin@example.com, password: admin123456)');
    }

    console.log('Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedInitialData();
