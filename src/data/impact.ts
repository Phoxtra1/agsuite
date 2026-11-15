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
  headline: "A social initiative of Amineva Global",
  positioning:
    "Amineva Impact is a social initiative of Amineva Global. It brings together programmes and partnerships that respond to social needs, widen access to opportunities and contribute to human development, educational advancement and stronger communities. Its work is open to people and communities across different ages and circumstances, and will grow in response to identified needs and available capacity.",
  mission:
    "To help individuals and communities access the knowledge, opportunities and support they need to develop their abilities, improve their circumstances and participate meaningfully in society.",
  objectives: [
    "Identify social, educational and community needs where purposeful programmes can make a practical contribution.",
    "Develop and support initiatives that widen access to knowledge, learning, skills and meaningful opportunities.",
    "Encourage informed choices, personal development, participation and confidence across different stages of life.",
    "Work with schools, institutions, professionals, businesses and community partners to extend the reach and effectiveness of programmes.",
    "Implement activities responsibly, learn from the people they serve and assess progress through clear evidence and feedback.",
    "Build sustainable programmes that can respond to changing needs without being limited to one age group or area of intervention.",
  ],
};

export const FOCUS_AREAS: FocusArea[] = [
  { id: "career-development", title: "Career Development and Exploration", description: "Helping learners discover their interests, understand a wider range of career pathways and make informed choices about education and future work.", icon: Compass },
  { id: "youth-empowerment", title: "Youth Empowerment and Skills Development", description: "Supporting young people to build confidence, useful capabilities, initiative and the skills needed to participate meaningfully in society.", icon: Users },
  { id: "mentorship", title: "Mentorship and Professional Exposure", description: "Creating opportunities to learn from experienced professionals, explore real working environments and gain guidance from positive role models.", icon: Award },
  { id: "community-development", title: "Community Development", description: "Working with communities and local partners on practical responses to shared needs, participation and stronger community wellbeing.", icon: HeartHandshake },
  { id: "social-initiatives", title: "Social Development Initiatives", description: "Developing and supporting initiatives that respond to identified social needs and improve access to opportunities and support.", icon: Globe },
  { id: "education", title: "Education and Educational Development", description: "Contributing to educational access, supportive learning environments and resources that help individuals continue to learn and grow.", icon: GraduationCap },
];

export const SCHOOL_ACTIVITY_IMAGES: MediaItem[] = [
  { type: "image", url: "/patg1.jpg", title: "25th Anniversary Career Session", caption: "Career awareness at the school's 25th anniversary celebration.", altText: "Career development and exploration at a school's 25th anniversary celebration." },
  { type: "image", url: "/patg2.jpg", title: "Career Pathways with Learners", caption: "Introducing students to different career directions.", altText: "Students taking part in career awareness during the anniversary celebration." },
  { type: "image", url: "/patg3.jpg", title: "School Anniversary Outreach", caption: "Career development activities during the anniversary event.", altText: "Career development outreach during a school's anniversary celebration." },
  { type: "image", url: "/patg4.jpg", title: "Learner Career Guidance", caption: "Sharing career guidance with students at the celebration.", altText: "Learners receiving career guidance during a school's anniversary celebration." },
  { type: "image", url: "/images/impact/IMG_20261028_084846.jpg", title: "Career Guidance in the Classroom", caption: "A facilitator speaking with learners during a school-based career development session.", altText: "A facilitator addressing learners in a classroom." },
  { type: "image", url: "/images/impact/IMG_20261028_084908.jpg", title: "Learner Participation", caption: "Learners taking part in a school engagement documented by Amineva Global.", altText: "Learners participating in a school activity." },
  { type: "image", url: "/images/impact/IMG_20261028_090003.jpg", title: "Student Engagement", caption: "A further moment from the programme's school activities.", altText: "Students during a school-based programme activity." },
  { type: "image", url: "/images/impact/IMG_20261028_090243.jpg", title: "Interactive Learning", caption: "Learners and facilitators during an interactive school session.", altText: "Learners and a facilitator during a classroom session." },
  { type: "image", url: "/edu......png", title: "Digital Learning & Computer Exposure", caption: "Learners and facilitators during a school-based digital learning engagement.", altText: "School learners with facilitators and computer equipment during an educational engagement." },
  { type: "image", url: "/edu...png", title: "Digital Learning & Computer Exposure", caption: "Learners and facilitators during a school-based digital learning engagement.", altText: "School learners with facilitators beside computer equipment." },
  { type: "image", url: "/saleria1.jpg", title: "Career Exploration in the Classroom", caption: "Learners taking part in an Amineva Global career development and exploration session.", altText: "Learners participating in a school-based career development programme." },
  { type: "image", url: "/saleria2.jpg", title: "Learner Participation and Discovery", caption: "A further moment showing learners engaged in the career development programme.", altText: "Learners participating in a school-based career development programme." },
];

export const INITIATIVES: Initiative[] = [
  {
    id: "career-development",
    title: "Career Development and Exploration Program",
    tagline:
      "Broadening horizons and supporting informed career exploration for basic-school learners.",
    status: "active",
    category: "Career Development and Exploration",
    overview:
      "The Career Development and Exploration Program is the first active programme under Amineva Impact. Designed specifically for basic-school learners, it brings structured career awareness into classrooms, helping students discover interests, explore non-traditional professions, and recognize the value of practical skills early in their educational journey.",
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
          "More than 600 learners engaged across Form One, Form Two and Form Three during one school visit. Four additional schools were also engaged; their learner totals are recorded separately.",
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
          "Reviewing invitations from additional schools and community educational coordinators seeking to host the Career Development and Exploration Program.",
      },
    ],
    achievements: [
      "Five schools engaged through the Career Development and Exploration Program.",
      "More than 600 learners engaged during one school visit. Learner totals from the other two school engagements are not included in this figure.",
      "Realization of career foundation and importance: Students developed early understanding of how academic focus connects directly to life goals.",
      "Discovery of practical abilities: Learners identified personal strengths, hands-on talents, and vocational curiosity beyond conventional textbooks.",
      "Career alignment & capacity building: Established foundational frameworks guiding students toward purposeful career selection and skills building.",
      "Pathways for a better future: Instilled confidence, clarity, and motivation for students to pursue lifelong educational and professional opportunities.",
    ],
    verifiedMetrics: [
      {
        label: "Schools Engaged",
        figure: "5",
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