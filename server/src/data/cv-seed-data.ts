/**
 * Structured dataset transcribed from the supplied source documents:
 *   - "Dipesh Thapa CV.pdf"
 *   - "Extra Certificates and Awards.pdf"
 *
 * This file is the canonical initial content seed for Astra DB.
 * Only information present in those documents appears here.
 * Empty/unknown fields stay undefined â€” the CMS can fill them later.
 */

import type {
  AboutContent,
  Conference,
  Education,
  Experience,
  Hobby,
  Internship,
  Language,
  Membership,
  Project,
  Publication,
  Recommendation,
  Research,
  ResearchExperience,
  Skill,
  Training,
} from '../../../shared/types';

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

export const aboutSeed: Omit<AboutContent, '_id' | 'createdAt' | 'updatedAt'> = {
  profileText:
    'My professional goal is to use my enthusiasm for scientific inquiry and my analytical abilities to contribute to groundbreaking research and creative solutions in the fast-paced disciplines of microbiology and public health.',
  biography:
    'Dipesh Thapa is a Nepalese researcher based in Germany with an academic background spanning microbiology, biotechnology and international public health management. He holds a Bachelor of Science in Microbiology (Balkumari College, Tribhuvan University) and a Master of Science in Biotechnology (National College, Tribhuvan University), and is pursuing a Master in International Public Health Management at the University of Europe for Applied Sciences, Germany.',
  academicSummary:
    'His work combines laboratory microbiology â€” bacterial isolation and characterization, antimicrobial-resistance studies and plantâ€“microbe interactions â€” with public-health practice gained through cholera vaccination campaign support, pathology laboratory internship and sales & application work with clinical biochemistry reagents.',
  profileImage: '/images/hero.jpg',
  highlights: [
    'B.Sc. Microbiology & M.Sc. Biotechnology (Tribhuvan University)',
    'Master in International Public Health Management (Germany)',
    '8 figshare publications including a thesis on AMR in Nepal',
    'Research Assistant â€” Cholera Vaccination Camp (GTA), Kathmandu',
    'Member of the American Society for Microbiology (ASM)',
  ],
  relatedLinks: [
    { label: 'Figshare author profile', url: 'https://figshare.com/authors/Dipesh_Thapa/23756241' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/dipesh-thapa-6b0559215/' },
  ],
  sceneKey: 'molecule-scene',
  isActive: true,
};

/* ------------------------------------------------------------------ */
/* Education                                                           */
/* ------------------------------------------------------------------ */

export const educationSeed: Education[] = [
  {
    institution: 'University of Europe for Applied Sciences',
    qualification: 'Master in International Public Health Management',
    startDate: '2025',
    endDate: '2026',
    location: 'Germany',
    status: 'In progress',
    visibility: true,
    order: 0,
  },
  {
    institution: 'National College affiliated by Tribhuvan University',
    qualification: 'Master of Science in Biotechnology',
    startDate: '2019',
    endDate: '2024',
    location: 'Nepal',
    status: 'Completed',
    visibility: true,
    order: 1,
  },
  {
    institution: 'Balkumari College affiliated by Tribhuvan University',
    qualification: 'Bachelor of Science in Microbiology',
    startDate: '2015',
    endDate: '2019',
    location: 'Nepal',
    status: 'Completed',
    visibility: true,
    order: 2,
  },
  {
    institution: 'Aroma English Higher Secondary School',
    qualification: 'Higher Secondary Education Board (HSEB)',
    startDate: '2012',
    endDate: '2014',
    location: 'Nepal',
    status: 'Completed',
    visibility: true,
    order: 3,
  },
  {
    institution: 'Small Heaven Model School',
    qualification: 'School Level Certification Examination',
    startDate: '2007',
    endDate: '2012',
    location: 'Nepal',
    status: 'Completed',
    visibility: true,
    order: 4,
  },
];

/* ------------------------------------------------------------------ */
/* Research (derived strictly from education, projects,                */
/* publications and experience present in the CV)                      */
/* ------------------------------------------------------------------ */

export const researchSeed: Research[] = [
  {
    title: 'Antimicrobial Resistance (AMR)',
    shortDescription:
      'Knowledge, attitudes and practices regarding antibiotic use and antimicrobial resistance in Nepal.',
    keywords: ['AMR', 'antibiotic use', 'KAP studies', 'Nepal'],
    relatedProjects: ['Knowledge, Attitudes and practices regarding Antibiotic Use and Antimicrobial Resistance (AMR) in Nepal'],
    relatedPublications: [
      'Knowledge, Attitudes, and Practices regarding Antibiotic Use and Antimicrobial Resistance (AMR) in Nepal',
    ],
    icon: 'shield-virus',
    visibility: true,
    order: 0,
  },
  {
    title: 'Public Health & Global Health',
    shortDescription:
      'Migration and global health challenges, vaccination campaigns and community health awareness.',
    keywords: ['global health', 'migration', 'vaccination', 'community outreach'],
    relatedPublications: [
      'MIGRATION AND GLOBAL HEALTH: CHALLENGES AND STRATEGIES',
      'An Extensive Review on Mental Health and Depression among Students Living Abroad',
    ],
    icon: 'globe-health',
    visibility: true,
    order: 1,
  },
  {
    title: 'Plantâ€“Microbe Interactions',
    shortDescription:
      'Nitrogen-fixing bacteria associated with common bean and phosphate-solubilizing microorganisms from soil samples.',
    keywords: ['nitrogen fixation', 'phosphate solubilization', 'Phaseolus vulgaris', 'soil microbiology'],
    relatedProjects: [
      'Screening of Potential Phosphate-Solubilizing Bacteria from Different Altitudes of Nepal and effect on a plant along with Phosphatase Enzyme',
    ],
    relatedPublications: [
      'Isolation and characterization of Nitrogen Fixing Bacteria associated with common bean (Phaseolus Vulgaris)',
      'Isolation and characterization of Phosphate solubilizing microorganisms from a soil sample',
    ],
    icon: 'leaf',
    visibility: true,
    order: 2,
  },
  {
    title: 'Clinical Microbiology & Diagnostics',
    shortDescription:
      'Detection of carbapenem-resistance genes in clinical isolates and diagnostic laboratory practice.',
    keywords: ['blaOXA-48', 'carbapenem resistance', 'clinical isolates', 'diagnostics'],
    relatedProjects: [
      'Detection of the blaOXA-48 Gene in Carbapenem-Resistant Bacterial Isolates from Respiratory Samples of Hospitalized Patients',
    ],
    icon: 'microscope',
    visibility: true,
    order: 3,
  },
  {
    title: 'Environmental & Food Microbiology',
    shortDescription:
      'Antimicrobial characteristics of soil Trichoderma isolates and water-quality analysis in beverage production.',
    keywords: ['Trichoderma', 'water quality', 'food microbiology', 'quality control'],
    relatedProjects: [
      'Isolation of Trichoderma from soil from different places in Nepal and observation of their antimicrobial characteristics.',
    ],
    icon: 'flask',
    visibility: true,
    order: 4,
  },
  {
    title: 'Digital Health & Telemedicine',
    shortDescription:
      'Technological innovations such as telemedicine as opportunities to enhance access to healthcare.',
    keywords: ['telemedicine', 'health technology', 'healthcare access'],
    relatedPublications: [
      'The Role of Technology in Modern HRM',
      'Technological innovations, particularly telemedicine, represent a significant opportunity to enhance access to healthcare and address global health challenges.',
    ],
    icon: 'cpu',
    visibility: true,
    order: 5,
  },
];

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

const PUB_TITLES = {
  nitrogenFixing:
    'Isolation and characterization of Nitrogen Fixing Bacteria associated with common bean (Phaseolus Vulgaris)',
  lgbt: 'A case study on lesbian, gay, bisexual, and transgender people in Bharatpur metropolitan',
  phosphateSoil:
    'Isolation and characterization of Phosphate solubilizing microorganisms from a soil sample',
  amrKap:
    'Knowledge, Attitudes, and Practices regarding Antibiotic Use and Antimicrobial Resistance (AMR) in Nepal',
} as const;

export const projectSeed: Project[] = [
  {
    title: 'Knowledge, Attitudes and practices regarding Antibiotic Use and Antimicrobial Resistance (AMR) in Nepal',
    description:
      "Master's thesis project investigating knowledge, attitudes and practices regarding antibiotic use and antimicrobial resistance (AMR) in Nepal.",
    researchArea: 'Antimicrobial Resistance (AMR)',
    methodology: 'KAP survey methodology (as stated in the source document).',
    keywords: ['AMR', 'antibiotics', 'KAP', 'Nepal', 'public health'],
    relatedPublications: [PUB_TITLES.amrKap],
    externalLinks: [
      {
        label: 'figshare record',
        url: 'https://figshare.com/articles/thesis/_b_Knowledge_Attitudes_and_Practices_regarding_Antibiotic_Use_and_Antimicrobial_Resistance_AMR_in_Nepal_b_/32567433',
      },
    ],
    featured: true,
    visibility: true,
    order: 0,
  },
  {
    title: 'Detection of the blaOXA-48 Gene in Carbapenem-Resistant Bacterial Isolates from Respiratory Samples of Hospitalized Patients',
    description:
      'Laboratory project on detection of the blaOXA-48 carbapenem-resistance gene in bacterial isolates from respiratory samples of hospitalized patients.',
    researchArea: 'Clinical Microbiology & Diagnostics',
    keywords: ['blaOXA-48', 'carbapenem-resistant', 'respiratory samples', 'hospitalized patients'],
    visibility: true,
    order: 1,
  },
  {
    title: 'Isolation of Trichoderma from soil from different places in Nepal and observation of their antimicrobial characteristics.',
    description:
      'Isolation of Trichoderma fungi from soil samples collected at different places in Nepal and observation of their antimicrobial characteristics.',
    researchArea: 'Environmental & Food Microbiology',
    keywords: ['Trichoderma', 'soil', 'antimicrobial characteristics', 'Nepal'],
    visibility: true,
    order: 2,
  },
  {
    title:
      'Screening of Potential Phosphate-Solubilizing Bacteria from Different Altitudes of Nepal and effect on a plant along with Phosphatase Enzyme',
    description:
      'Screening of potential phosphate-solubilizing bacteria from different altitudes of Nepal and their effect on plants along with phosphatase enzyme activity.',
    researchArea: 'Plantâ€“Microbe Interactions',
    keywords: ['phosphate-solubilizing bacteria', 'altitude', 'phosphatase enzyme', 'plant growth'],
    relatedPublications: [PUB_TITLES.phosphateSoil],
    visibility: true,
    order: 3,
  },
  {
    title: 'A case study on lesbian, gay, bisexual, and transgender people in Bharatpur metropolitan',
    description:
      'Case study on public views and lifestyles of LGBT people in the community of Bharatpur metropolitan.',
    researchArea: 'Public Health & Global Health',
    keywords: ['LGBT', 'public views', 'lifestyles', 'community', 'Bharatpur'],
    relatedPublications: [PUB_TITLES.lgbt],
    externalLinks: [
      {
        label: 'figshare record',
        url: 'https://figshare.com/articles/journal_contribution/_b_Public_views_and_lifestyles_of_LGBT_people_in_the_community_b_/32055831',
      },
    ],
    visibility: true,
    order: 4,
  },
];

/* ------------------------------------------------------------------ */
/* Publications                                                        */
/* ------------------------------------------------------------------ */

export const publicationSeed: Publication[] = [
  {
    title: 'Knowledge, Attitudes, and Practices regarding Antibiotic Use and Antimicrobial Resistance (AMR) in Nepal',
    authors: ['Dipesh Thapa', 'Monika Buda Magar', 'Thomas Rieger'],
    year: '2026',
    publicationType: 'Thesis',
    publisher: 'Figshare',
    doi: 'https://doi.org/10.6084/m9.figshare.32567433.v1',
    citation:
      'Thapa, Dipesh; Buda Magar, Monika; Rieger, Thomas (2026). Knowledge, Attitudes, and Practices regarding Antibiotic Use and Antimicrobial Resistance (AMR) in Nepal. figshare. Thesis. https://doi.org/10.6084/m9.figshare.32567433.v1',
    url: 'https://figshare.com/articles/thesis/_b_Knowledge_Attitudes_and_Practices_regarding_Antibiotic_Use_and_Antimicrobial_Resistance_AMR_in_Nepal_b_/32567433',
    researchArea: 'Antimicrobial Resistance (AMR)',
    relatedProject:
      'Knowledge, Attitudes and practices regarding Antibiotic Use and Antimicrobial Resistance (AMR) in Nepal',
    featured: true,
    visibility: true,
    order: 0,
  },
  {
    title: 'Isolation and characterization of Nitrogen Fixing Bacteria associated with common bean (Phaseolus Vulgaris)',
    authors: ['Dipesh Thapa'],
    year: '2026',
    publicationType: 'Journal contribution',
    publisher: 'Figshare',
    doi: 'https://doi.org/10.6084/m9.figshare.32098978.v1',
    citation:
      'Thapa, Dipesh (2026). Isolation and characterization of Nitrogen Fixing Bacteria associated with common bean (Phaseolus Vulgaris). figshare. Journal contribution. https://doi.org/10.6084/m9.figshare.32098978.v1',
    url: 'https://figshare.com/articles/journal_contribution/Isolation_and_characterization_of_Nitrogen_Fixing_Bacteria_associated_with_common_bean_i_Phaseolus_Vulgaris_i_/32098978',
    researchArea: 'Plantâ€“Microbe Interactions',
    featured: true,
    visibility: true,
    order: 1,
  },
  {
    title: 'Isolation and characterization of Phosphate solubilizing microorganisms from a soil sample',
    authors: ['Dipesh Thapa'],
    year: '2026',
    publicationType: 'Journal contribution',
    publisher: 'Figshare',
    doi: 'https://doi.org/10.6084/m9.figshare.32076495.v3',
    citation:
      'Thapa, Dipesh (2026). Isolation and characterization of Phosphate solubilizing microorganisms from a soil sample. figshare. Journal contribution. https://doi.org/10.6084/m9.figshare.32076495.v3',
    url: 'https://figshare.com/articles/journal_contribution/Isolation_and_characterization_of_Phosphate_solubilizing_microorganisms_from_a_soil_sample/32076495',
    researchArea: 'Plantâ€“Microbe Interactions',
    visibility: true,
    order: 2,
  },
  {
    title: 'MIGRATION AND GLOBAL HEALTH: CHALLENGES AND STRATEGIES',
    authors: ['Dipesh Thapa'],
    year: '2026',
    publicationType: 'Online resource',
    publisher: 'Figshare',
    doi: 'https://doi.org/10.6084/m9.figshare.32155782.v1',
    citation:
      'Thapa, Dipesh (2026). MIGRATION AND GLOBAL HEALTH: CHALLENGES AND STRATEGIES. figshare. Online resource. https://doi.org/10.6084/m9.figshare.32155782.v1',
    url: 'https://figshare.com/articles/online_resource/MIGRATION_AND_GLOBAL_HEALTH_CHALLENGES_AND_STRATEGIES/32155782',
    researchArea: 'Public Health & Global Health',
    featured: true,
    visibility: true,
    order: 3,
  },
  {
    title: 'An Extensive Review on Mental Health and Depression among Students Living Abroad',
    authors: ['Dipesh Thapa'],
    year: '2026',
    publicationType: 'Online resource',
    publisher: 'Figshare',
    doi: 'https://doi.org/10.6084/m9.figshare.32363955.v1',
    citation:
      'Thapa, Dipesh (2026). An Extensive Review on Mental Health and Depression among Students Living Abroad. figshare. Online resource. https://doi.org/10.6084/m9.figshare.32363955.v1',
    url: 'https://figshare.com/articles/online_resource/An_Extensive_Review_on_Mental_Health_and_Depression_among_Students_Living_Abroad/32363955',
    researchArea: 'Public Health & Global Health',
    visibility: true,
    order: 4,
  },
  {
    title: 'A case study on lesbian, gay, bisexual, and transgender people in Bharatpur metropolitan',
    authors: ['Dipesh Thapa'],
    year: '2026',
    publicationType: 'Journal contribution',
    publisher: 'Figshare',
    doi: 'https://doi.org/10.6084/m9.figshare.32055831.v3',
    citation:
      'Thapa, Dipesh (2026). A case study on lesbian, gay, bisexual, and transgender people in Bharatpur metropolitan. figshare. Journal contribution. https://doi.org/10.6084/m9.figshare.32055831.v3',
    url: 'https://figshare.com/articles/journal_contribution/_b_Public_views_and_lifestyles_of_LGBT_people_in_the_community_b_/32055831',
    researchArea: 'Public Health & Global Health',
    visibility: true,
    order: 5,
  },
  {
    title: 'The Role of Technology in Modern HRM',
    authors: ['Dipesh Thapa', 'Monika Buda Magar', 'Roshan Paudel', 'Tilak Sharma', 'Prativa Kumari Saud'],
    year: '2026',
    publicationType: 'Online resource',
    publisher: 'Figshare',
    doi: 'https://doi.org/10.6084/m9.figshare.32055072.v1',
    citation:
      'Thapa, Dipesh; Buda Magar, Monika; Paudel, Roshan; Sharma, Tilak; Kumari Saud, Prativa (2026). The Role of Technology in Modern HRM. figshare. Online resource. https://doi.org/10.6084/m9.figshare.32055072.v1',
    url: 'https://figshare.com/articles/online_resource/_b_The_Role_of_Technology_in_Modern_HRM_b_/32055072',
    researchArea: 'Digital Health & Telemedicine',
    visibility: true,
    order: 6,
  },
  {
    title:
      'Technological innovations, particularly telemedicine, represent a significant opportunity to enhance access to healthcare and address global health challenges.',
    authors: ['Monika Buda Magar', 'Dipesh Thapa'],
    year: '2026',
    publicationType: 'Online resource',
    publisher: 'Figshare',
    citation:
      'Buda Magar, Monika; Thapa, Dipesh (2026). Technological innovations, particularly telemedicine, represent a significant opportunity to enhance access to healthcare and address global health challenges. figshare. Online resource.',
    url: 'https://figshare.com/articles/online_resource/Technological_innovations_particularly_telemedicine_represent_a_significant_opportunity_to_enhance_access_to_healthcare_and_address_global_health_challenges_/32301819',
    researchArea: 'Digital Health & Telemedicine',
    visibility: true,
    order: 7,
  },
];

/* ------------------------------------------------------------------ */
/* Professional experience                                             */
/* ------------------------------------------------------------------ */

export const experienceSeed: Experience[] = [
  {
    organization: 'Coral Clinical Systems',
    position: 'Sales Executive and Application Officer',
    location: 'Kathmandu, Nepal',
    startDate: '12/2023',
    endDate: '02/2025',
    responsibilities: [
      'Promotion and Sales of Biochemistry Reagents.',
      'Client Relationship Management: managed relationships with clients to ensure satisfaction.',
      'Market Research: conducted market research to understand industry trends and customer needs.',
      'Technical Support: provided technical support to customers, ensuring effective use of products.',
      'Collaboration with R&D: worked with the R&D team to provide customer feedback.',
    ],
    visibility: true,
    order: 0,
  },
];

/* ------------------------------------------------------------------ */
/* Internships                                                         */
/* ------------------------------------------------------------------ */

export const internshipSeed: Internship[] = [
  {
    organization: 'Pokhara Natural Food And Beverage Private Limited',
    department: 'Water quality analysis and microbial research projects',
    dates: { start: '2023' },
    dateLabel: '2023',
    location: 'Nepal',
    description:
      'Internship focused on water quality analysis and microbial research projects.',
    visibility: true,
    order: 0,
  },
  {
    organization: 'Deepjyoti Pathology Laboratory',
    department: 'Pathology laboratory',
    dates: { start: '2022' },
    dateLabel: '2022',
    location: 'Nepal',
    visibility: true,
    order: 1,
  },
  {
    organization: 'United Beverage Pvt. Ltd.',
    department: 'Quality Control Department and Production Departments of the RTS beverage plant',
    dates: { start: '2019' },
    dateLabel: '2019',
    location: 'Chitwan, Nepal',
    visibility: true,
    order: 2,
  },
];

/* ------------------------------------------------------------------ */
/* Research / community experience                                     */
/* ------------------------------------------------------------------ */

export const researchExperienceSeed: ResearchExperience[] = [
  {
    organization: 'Group for Technical Assistance (GTA)',
    role: 'Research Assistant',
    project: 'Cholera Vaccination Camp',
    dateLabel: '2023',
    location: 'Kathmandu, Nepal',
    responsibilities: [
      'Vaccination Campaign Planning: assisted in organizing and planning cholera vaccination camps, ensuring smooth execution.',
      'Data Collection and Analysis: collected, managed, and analyzed data from vaccination drives to monitor the effectiveness and reach of the campaign.',
      'Community Outreach and Awareness: helped raise awareness about cholera prevention and the importance of vaccination through community outreach efforts.',
      'Logistical Coordination: coordinated with healthcare workers, volunteers, and local authorities to ensure timely vaccine delivery and distribution.',
      'Reporting and Documentation: documented findings, prepared reports, and contributed to research efforts to improve future vaccination strategies.',
    ],
    visibility: true,
    order: 0,
  },
];

/* ------------------------------------------------------------------ */
/* Skills                                                              */
/* ------------------------------------------------------------------ */

export const skillSeed: Skill[] = [
  { name: 'IBM Statistical Package for Sciences (SPSS)', category: 'technical', visibility: true, order: 0 },
  { name: 'Microsoft Office', category: 'technical', visibility: true, order: 1 },
  { name: 'Microsoft Word', category: 'technical', visibility: true, order: 2 },
  { name: 'Microsoft PowerPoint', category: 'technical', visibility: true, order: 3 },
  { name: 'Microsoft Excel', category: 'technical', visibility: true, order: 4 },
  { name: 'Google Drive', category: 'technical', visibility: true, order: 5 },
  { name: 'Video Making', category: 'technical', visibility: true, order: 6 },
  { name: 'Video Editing', category: 'technical', visibility: true, order: 7 },
  { name: 'Excellent analytical and problem solving abilities', category: 'analytical', visibility: true, order: 8 },
  { name: 'Logical thinking', category: 'analytical', visibility: true, order: 9 },
  { name: 'Strong written and verbal communication', category: 'communication', visibility: true, order: 10 },
  { name: 'Ability to work in group', category: 'professional', visibility: true, order: 11 },
];

/* ------------------------------------------------------------------ */
/* Languages & hobbies                                                 */
/* ------------------------------------------------------------------ */

export const languageSeed: Language[] = [
  { language: 'Nepali', native: true, visibility: true, order: 0 },
  { language: 'English', visibility: true, order: 1 },
  { language: 'Hindi', visibility: true, order: 2 },
  { language: 'German', visibility: true, order: 3 },
];

export const hobbySeed: Hobby[] = [
  { name: 'Sketch', visibility: true, order: 0 },
  { name: 'Football', visibility: true, order: 1 },
  { name: 'Volleyball', visibility: true, order: 2 },
];

/* ------------------------------------------------------------------ */
/* Memberships                                                         */
/* ------------------------------------------------------------------ */

export const membershipSeed: Membership[] = [
  {
    organization: 'American Society for Microbiology (ASM)',
    membershipType: 'Member',
    description: 'Membership listed under â€œConferences and Seminarsâ€ in the source CV.',
    visibility: true,
    order: 0,
  },
];

/* ------------------------------------------------------------------ */
/* Conferences / seminars / events                                     */
/* ------------------------------------------------------------------ */

export const conferenceSeed: Conference[] = [
  {
    title: 'ESCMID Global 2026 â€” 36th Congress of the European Society of Clinical Microbiology and Infectious Diseases',
    startDate: '17/04/2026',
    endDate: '21/04/2026',
    dateLabel: '17 â€“ 21 April 2026',
    sortDate: '2026-04-17',
    location: 'Munich, Germany (online participation)',
    eventType: 'Congress',
    organizer: 'European Society of Clinical Microbiology and Infectious Diseases (ESCMID)',
    description:
      'Participated online in ESCMID Global 2026. The congress was accredited by the European Accreditation Council for Continuing Medical Education (EACCMEÂ®).',
    certificate: '/uploads/certificates/awards-p34-X27.jpg',
    link: 'https://www.escmid.org/',
    visibility: true,
    order: 0,
  },
  {
    title:
      'International conference on â€œBiotechnological revolution in environmental, agricultural technologies and healthcare (BREATH)â€',
    startDate: '12/02/2021',
    endDate: '14/02/2021',
    dateLabel: '12/02/2021 â€“ 14/02/2021',
    sortDate: '2021-02-12',
    location: 'Kathmandu, Nepal',
    eventType: 'Conference',
    organizer: 'Biotechnology Society of Nepal (BSN)',
    description: 'General participation.',
    visibility: true,
    order: 1,
  },
  {
    title: 'International seminar on opportunities & Impact of Microbiology in Health & Environment',
    startDate: '28/07/2018',
    dateLabel: '28/07/2018',
    sortDate: '2018-07-28',
    location: 'Chitwan, Nepal',
    eventType: 'Seminar',
    organizer:
      'Balkumari College, Chitwan in association with the Microbiology Society, India',
    visibility: true,
    order: 2,
  },
  {
    title: 'â€œHealth Awareness & Health Appliance Distribution Programâ€',
    startDate: '26/03/2016',
    dateLabel: '26/03/2016',
    sortDate: '2016-03-26',
    location: 'Kalika-4, Latauli, Chitwan, Nepal',
    eventType: 'Awareness program',
    organizer: 'Rotaract Club of Ratnanagar',
    visibility: true,
    order: 3,
  },
  {
    title: 'National-wide cleanup event â€” Clean-up Nepal',
    startDate: '20/09/2015',
    dateLabel: '20/09/2015',
    sortDate: '2015-09-20',
    location: 'Narayani river bank, Chitwan, Nepal',
    eventType: 'Cleanup event',
    organizer: 'Clean-up Nepal',
    visibility: true,
    order: 4,
  },
  {
    title: 'One-day seminar entitled â€œStudent Motivationâ€',
    startDate: '27/06/2015',
    dateLabel: '27/06/2015',
    sortDate: '2015-06-27',
    location: 'Chitwan, Nepal',
    eventType: 'Seminar',
    organizer: 'Microbiology Department, Balkumari College',
    visibility: true,
    order: 5,
  },
  {
    title: 'Awareness program entitled â€œSwine Flu and Its Preventive Measureâ€',
    startDate: '01/04/2015',
    dateLabel: '01/04/2015',
    sortDate: '2015-04-01',
    location: 'Chitwan, Nepal',
    eventType: 'Awareness program',
    organizer: 'Microbiology Department, Balkumari College',
    visibility: true,
    order: 6,
  },
  {
    title: 'Volunteer program of Menâ€™s Room Reloaded',
    dateLabel: '2015',
    sortDate: '2015',
    eventType: 'Volunteering',
    visibility: true,
    order: 7,
  },
  {
    title: 'â€œKaryakram - 2012â€ â€” Professional Event Management workshop',
    startDate: '08/09/2012',
    dateLabel: '08/09/2012',
    sortDate: '2012-09-08',
    location: 'Chitwan, Nepal',
    eventType: 'Workshop',
    organizer: 'Management Students Association of Nepal (MSAN)',
    visibility: true,
    order: 8,
  },
];

/* ------------------------------------------------------------------ */
/* Trainings / workshops / certifications                              */
/* ------------------------------------------------------------------ */

export const trainingSeed: Training[] = [
  {
    title: 'Academic Writing in English for ESL Learners',
    provider: 'UCL (University College London) via FutureLearn',
    dateLabel: 'Issued 30 January 2026 Â· 3 weeks, 3 hours per week',
    sortDate: '2026-01-30',
    description:
      'Developed academic writing skills in English as a second language and advanced English writing at university level.',
    topics: [
      'Nature of academic writing and argumentative essays',
      'Critical thinking and usage of evidence',
      'Using external resources',
    ],
    certificate: 'https://www.futurelearn.com/certificates/a7xbuq8',
    visibility: true,
    order: 0,
  },
  {
    title: 'Developing Your Research Project',
    provider: 'University of Southampton via FutureLearn',
    dateLabel: 'Issued 30 January 2026 Â· 8 weeks, 1 hour per week Â· Overall score 97%',
    sortDate: '2026-01-29',
    description: 'Course designed to support individuals develop their own research projects.',
    topics: [
      'Research hypothesis and questions',
      'Research proposal writing',
      'Choosing an appropriate methodology',
      'Academic integrity and referencing',
    ],
    certificate: 'https://www.futurelearn.com/certificates/5srtmd4',
    visibility: true,
    order: 1,
  },
  {
    title: 'Why Research Matters',
    provider: 'Deakin University and Griffith University via FutureLearn',
    dateLabel: 'Issued 30 January 2026 Â· 2 weeks, 3 hours per week Â· Overall score 100%',
    sortDate: '2026-01-28',
    description:
      'Explored what research is and why it matters; equipped with tools for effective evidence-based decisions.',
    certificate: 'https://www.futurelearn.com/certificates/ji96xuw',
    visibility: true,
    order: 2,
  },
  {
    title: 'Introduction to Data Engineering with Microsoft Azure 1',
    provider: 'FutureLearn',
    dateLabel: 'Issued 30 January 2026 Â· 6 weeks, 4 hours per week',
    sortDate: '2026-01-27',
    description:
      'Explored data platform technologies, storage management in Azure, data pipelines with Azure Data Factory and analytics with Azure Synapse.',
    topics: ['Azure Data Platform', 'Azure Data Factory', 'Azure Synapse Analytics', 'Apache Spark pools'],
    certificate: 'https://www.futurelearn.com/certificates/g8z9a8g',
    visibility: true,
    order: 3,
  },
  {
    title: 'Learn About Current Digital Workplace Trends',
    provider: 'University of Leeds, Click Start and Institute of Coding via FutureLearn',
    dateLabel: 'Issued 29 January 2026 Â· 2 weeks, 3 hours per week Â· Overall score 93%',
    sortDate: '2026-01-26',
    description:
      'Demystified the world of digital technology using up-to-date case studies; explored the Fourth Industrial Revolution.',
    certificate: 'https://www.futurelearn.com/certificates/6bwsc9t',
    visibility: true,
    order: 4,
  },
  {
    title: 'Introduction to Data Analytics with Python',
    provider: 'FutureLearn',
    dateLabel: 'Issued 29 January 2026 Â· 4 weeks, 3 hours per week',
    sortDate: '2026-01-25',
    description:
      'Python programming for data analytics using Pandas and data visualisation with Seaborn.',
    topics: ['Python basics', 'Pandas', 'Seaborn', 'Data visualisation'],
    certificate: 'https://www.futurelearn.com/certificates/63xc4qz',
    visibility: true,
    order: 5,
  },
  {
    title: 'Dynamics 365: Customer Engagement for Sales',
    provider: 'CloudSwyft Global Systems, Inc. via FutureLearn',
    dateLabel: 'Issued 29 January 2026 Â· 3 weeks, 5 hours per week Â· Overall score 83%',
    sortDate: '2026-01-24',
    description:
      'Practical course covering the sales cycle, managing customer details, and utilizing analytics tools with client needs.',
    certificate: 'https://www.futurelearn.com/certificates/6bml8yd',
    visibility: true,
    order: 6,
  },
  {
    title: 'Two-day workshop called Digital Marketing',
    provider: 'RPA Academy',
    dateLabel: '15/10/2022 â€“ 16/10/2022',
    sortDate: '2022-10-15',
    visibility: true,
    order: 7,
  },
  {
    title: 'One-day seminar on â€œDrug Discovery and Metabolomicsâ€',
    provider: '',
    dateLabel: '',
    sortDate: '2022',
    visibility: true,
    order: 8,
  },
  {
    title: 'Proposal Writing and Poster Preparation',
    provider: 'Balkumari College',
    dateLabel: '09/09/2017 (one day)',
    sortDate: '2017-09-09',
    visibility: true,
    order: 9,
  },
  {
    title:
      'Training & Workshop under International Student Exchange Program (ISEP): Bacterial Identification, Bio-Inoculant Production Technology, and Molecular Biology Techniques',
    provider: 'Shardanagar (Baramati), India',
    dateLabel: '08/01/2019 â€“ 12/01/2019 (one week)',
    sortDate: '2019-01-08',
    location: 'Shardanagar (Baramati), India',
    topics: [
      'Bacterial identification',
      'Bio-inoculant production technology',
      'Molecular biology techniques',
    ],
    visibility: true,
    order: 10,
  },
  {
    title: 'Proficiency in Web Design (84-hour course)',
    provider: 'Heartsun Technology Pvt. Ltd.',
    dateLabel: 'Completed June 2012',
    sortDate: '2012-06',
    description:
      'Fundamentals of internet, HTML, Macromedia Flash, Macromedia Dreamweaver, Adobe Photoshop CS2 and web hosting.',
    hours: '84 hours',
    visibility: true,
    order: 11,
  },
  {
    title: 'Mastering Lab Accuracy Through Control & Calibration In Diagnostic Laboratories',
    provider: '',
    dateLabel: '',
    sortDate: '9999',
    visibility: true,
    order: 12,
  },
];

/* ------------------------------------------------------------------ */
/* Recommendations (contact details private until enabled by admin)     */
/* ------------------------------------------------------------------ */

export const recommendationSeed: Recommendation[] = [
  {
    name: 'Dr. Gorkha Raj Giri',
    title: 'Post Graduate Supervisor',
    recommendationText:
      'I have known Dr. Gorakh Raj Giri since 2019, and his vision and insightful guidance during my postgraduate thesis were instrumental in inspiring me to pursue a career in research. His unwavering support not only shaped my academic journey but also strengthened my passion for scientific exploration.',
    email: 'girigorakh21@gmail.com',
    publicVisibility: false,
    showEmail: false,
    showPhone: false,
    order: 0,
  },
  {
    name: 'Sunil Bhandari',
    title: 'Undergraduate Supervisor',
    recommendationText:
      'I have known Mr. Sunil Bhandari since 2015. His vision and insightful guidance during my undergraduate thesis inspired and motivated me to pursue a career in research. His support played a key role in shaping my academic journey and passion for scientific exploration.',
    email: 'sunilbhandariv@gmail.com',
    phone: '(+1) 7014910174',
    publicVisibility: false,
    showEmail: false,
    showPhone: false,
    order: 1,
  },
  {
    name: 'Nabin Ghimire',
    title: 'Post Graduate Lecturer',
    recommendationText:
      'I have known Mr. Nabin Ghimire for several years, having first encountered him in 2019 when he was my postgraduate lecturer for the M.Sc. Biotechnology program.',
    email: 'ng0063@uah.edu',
    phone: '(+1) 2566949965',
    publicVisibility: false,
    showEmail: false,
    showPhone: false,
    order: 2,
  },
];

