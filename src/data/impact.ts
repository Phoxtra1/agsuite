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
  beneficiariesCount: number | string;
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
  achievements: string[];
  verifiedMetrics?: VerifiedMetric[];
  collaborationOpportunities: string[];
  contactLink: string;
}

export interface CollaborationCategory {
  title: string;
  description: string;
  examples: string[];
}

export const IMPACT_VIDEO_ID = "gA_OQ8rpX3Y";

export const IMPACT_INTRO = {
  headline: "Educational, Social and Community Initiatives by Amineva Global",
  positioning:
    "Amineva Impact represents Amineva Global's commitment to supporting meaningful educational, social and community development initiatives. Through targeted programmes and collaborative activities, it seeks to create opportunities, encourage personal development and contribute positively to communities.",
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

export const SCHOOL_ACTIVITY_IMAGES: MediaItem[] = [
  { type: "image", url: "/images/impact/IMG_20261028_084846.jpg", title: "Career Guidance in the Classroom", caption: "A facilitator speaking with learners during a school-based career development session.", altText: "A facilitator addressing learners in a classroom." },
  { type: "image", url: "/images/impact/odorkor-session-1.webp", title: "Classroom Career Discussion", caption: "Learners listening and participating during a career development session.", altText: "Students in a classroom during a career development session." },
  { type: "image", url: "/images/impact/IMG_20261028_084908.jpg", title: "Learner Participation", caption: "Learners taking part in a school engagement documented by Amineva Global.", altText: "Learners participating in a school activity." },
  { type: "image", url: "/images/impact/odorkor-session-2.webp", title: "A Full Classroom Engagement", caption: "A classroom of learners gathered for a career development and exploration session.", altText: "A large group of learners seated in a classroom." },
  { type: "image", url: "/images/impact/IMG_20261028_090003.jpg", title: "Student Engagement", caption: "A further moment from the programme's school activities.", altText: "Students during a school-based programme activity." },
  { type: "image", url: "/images/impact/IMG_20261028_090243.jpg", title: "Interactive Learning", caption: "Learners and facilitators during an interactive school session.", altText: "Learners and a facilitator during a classroom session." },
  { type: "image", url: "/edu......png", title: "Digital Learning & Computer Exposure", caption: "Learners and facilitators during a school-based digital learning engagement.", altText: "School learners with facilitators and computer equipment during an educational engagement." },
  { type: "image", url: "/edu...png", title: "Digital Learning & Computer Exposure", caption: "Learners and facilitators during a school-based digital learning engagement.", altText: "School learners with facilitators beside computer equipment." },
  { type: "image", url: "/saleria1.jpg", title: "Saleria 1", caption: "A documented moment from an Amineva Global school engagement.", altText: "Learners participating in a school-based career development programme." },
  { type: "image", url: "/saleria2.jpg", title: "Saleria 2", caption: "A further documented moment from an Amineva Global school engagement.", altText: "Learners participating in a school-based career development programme." },
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
        schoolName: "School Engagement",
        location: "Odorkor, Ghana",
        date: "October 2026",
        summary:
          "More than 600 learners were engaged during one school visit across Form One, Form Two and Form Three.",
        topicsCovered: [
          "Understanding standard vs emerging career fields",
          "Identifying personal strengths and interests",
          "Combining practical skills with classroom learning",
          "How to talk to parents about career goals",
        ],
        beneficiariesCount: "600+",
      },
    ],
    media: SCHOOL_ACTIVITY_IMAGES,
    progressUpdates: [
      {
        date: "Active Outreach",
        title: "Schools Interest & Direct Engagement",
        summary:
          "Strong enthusiasm and active participation from school heads and teachers eager to integrate structured career exploration sessions into their institutional programs.",
      },
      {
        date: "High Participation",
        title: "Learners Interest & Practical Discovery",
        summary:
          "More than 600 learners engaged across Form One, Form Two and Form Three during one school visit. Two additional school engagements were also conducted; their learner totals are recorded separately.",
      },
      {
        date: "Next Quarter",
        title: "Upcoming Programs & Workshops",
        summary:
          "Scheduled rollout of advanced career workbooks, interactive discovery toolkits, and mentor-led interactive workshops across participating schools.",
      },
      {
        date: "In Pipeline",
        title: "Pending Invitations & Partner Requests",
        summary:
          "Reviewing invitations from additional schools and community educational coordinators seeking to host the Amineva Impact career exploration program.",
      },
    ],
    achievements: [
      "Three school engagements completed, with activities delivered across different school settings.",
      "More than 600 learners engaged during one school visit. Learner totals from the other two school engagements are not included in this figure.",
      "Realization of career foundation and importance: Students developed early understanding of how academic focus connects directly to life goals.",
      "Discovery of practical abilities: Learners identified personal strengths, hands-on talents, and vocational curiosity beyond conventional textbooks.",
      "Career alignment & capacity building: Established foundational frameworks guiding students toward purposeful career selection and skills building.",
      "Pathways for a better future: Instilled confidence, clarity, and motivation for students to pursue lifelong educational and professional opportunities.",
    ],
    verifiedMetrics: [
      {
        label: "Schools Engaged",
        figure: "3",
        description: "Basic schools directly engaged with structured outreach",
      },
      {
        label: "Students Participated",
        figure: "600+",
        description: "Learners reached during one school visit",
      },
      {
        label: "Active Focus",
        figure: "Basic Schools",
        description: "Primary & Junior High School level outreach focus",
      },
      {
        label: "Program Status",
        figure: "Active",
        description: "Ongoing initiative under Amineva Global",
      },
    ],
    collaborationOpportunities: [
      "School Administration Invitations: Invite Amineva Impact to host career exploration sessions at your basic school.",
      "Educational Materials & Workbooks: Support the production and distribution of career exploration workbooks for learners.",
      "Guest Mentorship & Role Modeling: Professional guest speakers sharing real-world career journeys with students.",
      "Institutional Co-development: Partnering with educational boards and organizations to scale career awareness curricula.",
    ],
    contactLink: "/support",
  },
];

export const COLLABORATION_CATEGORIES: CollaborationCategory[] = [
  {
    title: "Educational Materials & Workbooks",
    description:
      "Supporting the printing and distribution of career workbooks, educational charts, and student discovery worksheets.",
    examples: [
      "Student career workbook distribution",
      "Essential stationery supplies",
      "Structured career exploration guides",
    ],
  },
  {
    title: "Professional Mentorship & Role Modeling",
    description:
      "Experienced professionals and educators joining outreach sessions as guest mentors or subject-matter advisors.",
    examples: [
      "Guest speaker sessions at school visits",
      "Practical skills demonstrations",
      "Mentorship and student guidance",
    ],
  },
  {
    title: "Institutional & School Partnerships",
    description:
      "Partnering with school administrations, educational directorates, and community organizations to expand career awareness.",
    examples: [
      "School outreach invitations",
      "Curriculum alignment sessions",
      "Cross-school workshops",
    ],
  },
  {
    title: "Program Development & Capacity Building",
    description:
      "Collaborating on the design, enhancement, and scaling of impactful youth development modules.",
    examples: [
      "Workshop content enrichment",
      "Teacher and counselor support materials",
      "Student development tracking",
    ],
  },
];
