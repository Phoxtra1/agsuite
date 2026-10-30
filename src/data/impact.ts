import {
  GraduationCap,
  Compass,
  Users,
  Award,
  HeartHandshake,
  Globe,
  LucideIcon,
} from "lucide-react";

export interface FocusArea {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ActivityHighlight {
  title: string;
  description: string;
}

export interface SchoolEngagement {
  schoolName: string;
  location: string;
  date: string;
  summary: string;
  topicsCovered: string[];
  beneficiariesCount: number;
}

export interface VerifiedMetric {
  label: string;
  figure: string;
  description: string;
}

export interface MediaItem {
  type: "image" | "video";
  url: string;
  title: string;
  caption: string;
  altText: string;
}

export interface ProgressUpdate {
  date: string;
  title: string;
  summary: string;
}

export interface Initiative {
  id: string;
  title: string;
  tagline: string;
  status: "active" | "completed" | "planned";
  category: string;
  overview: string;
  purpose: string;
  objectives: string[];
  targetAudience: string[];
  activities: ActivityHighlight[];
  schoolEngagements?: SchoolEngagement[];
  media: MediaItem[];
  progressUpdates: ProgressUpdate[];
  outcomes: string[];
  verifiedMetrics?: VerifiedMetric[];
  collaborationOpportunities: string[];
  contactLink: string;
}

export interface CollaborationCategory {
  title: string;
  description: string;
  examples: string[];
}

export const IMPACT_INTRO = {
  headline: "Educational, Social and Community Initiatives by Amineva Global",
  positioning:
    "Amineva Impact represents Amineva Global's commitment to supporting meaningful educational, social and community development initiatives. Through targeted programmes and collaborative activities, it seeks to create opportunities, encourage personal development and contribute positively to communities.",
  relationship:
    "Amineva Impact operates as an initiative platform under Amineva Global. It is not an independent legal entity, NGO, or charity, but a structured framework through which Amineva Global organizes, documents, and scales its corporate social responsibility and community engagements.",
};

export const FOCUS_AREAS: FocusArea[] = [
  {
    id: "education",
    title: "Education & Educational Development",
    description:
      "Strengthening learning environments, basic school support, educational access, and foundational literacy and learning resources.",
    icon: GraduationCap,
  },
  {
    id: "career-awareness",
    title: "Career Awareness & Exploration",
    description:
      "Introducing early-stage career insights to help students discover diverse professional paths, practical skills, and self-directed research.",
    icon: Compass,
  },
  {
    id: "youth-empowerment",
    title: "Youth Empowerment & Skills Development",
    description:
      "Equipping young learners with problem-solving, digital literacy, and essential soft skills alongside traditional academic curricula.",
    icon: Users,
  },
  {
    id: "mentorship",
    title: "Mentorship & Professional Exposure",
    description:
      "Connecting learners with experienced professionals and sector experts to provide practical guidance and real-world exposure.",
    icon: Award,
  },
  {
    id: "community-development",
    title: "Community Development",
    description:
      "Supporting localized community projects, institutional capacity support, and social welfare programs.",
    icon: HeartHandshake,
  },
  {
    id: "social-initiatives",
    title: "Social & Developmental Initiatives",
    description:
      "Collaborating with local and continental partners to address broader social challenges and support developmental growth.",
    icon: Globe,
  },
];

export const INITIATIVES: Initiative[] = [
  {
    id: "career-development",
    title: "Career Development & Exploration Initiative",
    tagline:
      "Broadening horizons and inspiring career clarity for basic-school learners.",
    status: "active",
    category: "Career Awareness & Youth Empowerment",
    overview:
      "The Career Development & Exploration Initiative is the inaugural active programme under Amineva Impact. Designed specifically for basic-school learners, it brings structured career awareness into classrooms, helping students discover interests, explore non-traditional professions, and recognize the value of practical skills early in their educational journey.",
    purpose:
      "To bridge the gap between early academic education and long-term career awareness, giving young learners the confidence and tools to research, understand, and pursue diverse professional pathways.",
    objectives: [
      "Help learners understand diverse career opportunities beyond the small set of professions commonly encountered in everyday surroundings.",
      "Enable students to discover their individual interests, strengths, and natural abilities through structured self-reflection.",
      "Appreciate the critical importance of practical, technical, and vocational skills alongside traditional academic education.",
      "Begin exploring career pathways from an early stage, fostering long-term educational purpose and focus.",
      "Develop the confidence and curiosity to independently research and understand future opportunities.",
      "Emphasise and foster the vital role of parental and family support in early career exploration and decision-making.",
    ],
    targetAudience: [
      "Basic-school students (Primary & Junior High School learners)",
      "Teachers, school counsellors, and school administrators",
      "Parents and guardians supporting learner development",
    ],
    activities: [
      {
        title: "School Career Outreach & Interactive Workshops",
        description:
          "Facilitated school engagements featuring interactive presentations, career discovery exercises, and guided group discussions.",
      },
      {
        title: "Career Pathway Exploration Sessions",
        description:
          "Deep-dive sessions breaking down emerging industries, technology roles, creative arts, trade professions, and public service careers.",
      },
      {
        title: "Parental Engagement & Guidance Briefings",
        description:
          "Informational sessions highlighting how parents and family members can support and encourage children's career exploration.",
      },
      {
        title: "Practical Skills & Vocational Awareness",
        description:
          "Demonstrations and discussions illustrating how hands-on skills complement academic learning in real-world professions.",
      },
    ],
    schoolEngagements: [
      {
        schoolName: "Community Basic School Engagement",
        location: "Ashanti Region, Ghana",
        date: "October 2024",
        summary:
          "Interactive career awareness outreach engaging junior high school learners on future career choices, practical skills, and independent goal setting.",
        topicsCovered: [
          "Understanding standard vs emerging career fields",
          "Identifying personal strengths and interests",
          "Combining practical skills with classroom learning",
          "How to talk to parents about career goals",
        ],
        beneficiariesCount: 180,
      },
    ],
    media: [
      {
        type: "image",
        url: "/placeholder.svg",
        title: "Basic School Classroom Workshop",
        caption:
          "Students participating in interactive career discovery exercises and self-assessment worksheets.",
        altText:
          "Basic school learners during a career development workshop conducted under Amineva Impact.",
      },
      {
        type: "image",
        url: "/placeholder.svg",
        title: "Career Guidance Session",
        caption:
          "Facilitators explaining diverse career paths in technology, agriculture, science, and trade.",
        altText:
          "Facilitator sharing career insights with basic-school students.",
      },
    ],
    progressUpdates: [
      {
        date: "Q4 2024",
        title: "Inaugural School Outreach Successfully Conducted",
        summary:
          "Successfully launched the first school engagement series engaging basic-school students with interactive career discovery materials.",
      },
      {
        date: "Q1 2025",
        title: "Expansion of Learning Materials & Institutional Outreach",
        summary:
          "Developing structured career exploration worksheets and expanding invitations to additional basic schools.",
      },
    ],
    outcomes: [
      "Over 180 basic-school learners directly engaged in initial career awareness workshops.",
      "High level of student engagement with self-discovery exercises and career research prompts.",
      "Positive feedback from school heads and educators regarding the clarity and relevance of basic-level career guidance.",
      "Framework established for continuous school visits and institutional collaborations.",
    ],
    verifiedMetrics: [
      {
        label: "Learners Engaged",
        figure: "180+",
        description: "Basic-school students reached during initial outreach",
      },
      {
        label: "Active Focus",
        figure: "Basic Schools",
        description: "Primary & Junior High School level outreach focus",
      },
      {
        label: "Programme Status",
        figure: "Active",
        description: "Ongoing initiative under Amineva Impact",
      },
    ],
    collaborationOpportunities: [
      "School Administration Invitations: Invite Amineva Impact to host career exploration sessions at your basic school.",
      "Logistical & Mobility Support: Assist with transportation and venue setup for school outreach visits.",
      "Educational Materials & Printing: Support the production and printing of career exploration workbooks for learners.",
      "Guest Mentorship: Professional guest speakers willing to share real-world career experiences with students.",
    ],
    contactLink: "/support",
  },
];

export const COLLABORATION_CATEGORIES: CollaborationCategory[] = [
  {
    title: "Operational & Logistical Support",
    description:
      "Assisting with event organization, venue arrangements, and on-ground coordination during school and community outreach visits.",
    examples: [
      "Outreach venue coordination",
      "Equipment and AV setup support",
      "Volunteer coordination",
    ],
  },
  {
    title: "Transportation & Mobility",
    description:
      "Providing or supporting travel arrangements for facilitators and outreach materials to reach underserved community basic schools.",
    examples: [
      "Facilitator transportation",
      "Material dispatch and distribution",
      "Inter-district outreach logistics",
    ],
  },
  {
    title: "Educational Materials & Printing",
    description:
      "Supporting the printing and distribution of career workbooks, educational charts, and student discovery worksheets.",
    examples: [
      "Printing student workbooks",
      "Providing stationery supplies",
      "Publishing guidance brochures",
    ],
  },
  {
    title: "Professional Mentorship & Expertise",
    description:
      "Experienced professionals and educators joining outreach sessions as guest mentors or subject-matter advisors.",
    examples: [
      "Guest speaker roles at school visits",
      "Technical skills demonstration",
      "Curriculum review and advisory",
    ],
  },
];
