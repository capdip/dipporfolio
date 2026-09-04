import type { ComponentType } from 'react';
import AboutSection from '../components/sections/AboutSection';
import BlogSection from '../components/sections/BlogSection';
import ConferencesSection from '../components/sections/ConferencesSection';
import ContactSection from '../components/sections/ContactSection';
import EducationSection from '../components/sections/EducationSection';
import ExperienceSection from '../components/sections/ExperienceSection';
import HobbiesSection from '../components/sections/HobbiesSection';
import InternshipsSection from '../components/sections/InternshipsSection';
import LanguagesSection from '../components/sections/LanguagesSection';
import MembershipsSection from '../components/sections/MembershipsSection';
import ProjectsSection from '../components/sections/ProjectsSection';
import PublicationsSection from '../components/sections/PublicationsSection';
import RecommendationsSection from '../components/sections/RecommendationsSection';
import ResearchExperienceSection from '../components/sections/ResearchExperienceSection';
import ResearchSection from '../components/sections/ResearchSection';
import SkillsSection from '../components/sections/SkillsSection';
import TrainingSection from '../components/sections/TrainingSection';

export type SectionComponent = ComponentType;

const BOUND_SECTIONS: Record<string, SectionComponent> = {
  about: AboutSection,
  research: ResearchSection,
  projects: ProjectsSection,
  publications: PublicationsSection,
  education: EducationSection,
  experience: ExperienceSection,
  internships: InternshipsSection,
  'research-experience': ResearchExperienceSection,
  skills: SkillsSection,
  conferences: ConferencesSection,
  training: TrainingSection,
  memberships: MembershipsSection,
  languages: LanguagesSection,
  hobbies: HobbiesSection,
  recommendations: RecommendationsSection,
  blog: BlogSection,
  contact: ContactSection,
};

export function resolveSectionComponent(sectionKey?: string): SectionComponent | null {
  if (sectionKey && BOUND_SECTIONS[sectionKey]) return BOUND_SECTIONS[sectionKey];
  return null;
}

export const CANONICAL_HOME_SECTIONS = [
  'research',
  'projects',
  'publications',
  'education',
  'experience',
  'internships',
  'research-experience',
  'skills',
  'conferences',
  'training',
  'memberships',
  'languages',
  'hobbies',
  'recommendations',
] as const;
