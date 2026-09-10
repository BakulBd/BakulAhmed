/**
 * Single source of truth for every word on the site.
 * Content is taken from Bakul Ahmed's CV (August 2026).
 *
 * Entries marked VERIFY are best guesses — confirm them before publishing.
 */

export const site = {
  /**
   * Set NEXT_PUBLIC_SITE_URL in .env.local (see .env.example). Canonical URLs,
   * Open Graph and the sitemap all derive from it. bakul.app and me.bakul.tech
   * are your other two live sites, so this one needs its own domain.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://bakul.tech",
  name: "Bakul Ahmed",
  title: "Computer Science Engineer & Technology Builder",
  tagline: "I build software, explore AI, and lead technology-driven initiatives.",
  description:
    "Bakul Ahmed — Computer Science Engineering undergraduate (CGPA 3.96/4.00) at Green University of Bangladesh. Full-stack developer, AI/ML explorer and General Secretary of the Green University Computer Club.",
  locale: "en_US",
} as const;

export const profile = {
  name: "Bakul Ahmed",
  role: "Computer Science Engineer & Technology Builder",
  roleChip: "General Secretary, GUCC",
  /** Cycled by the animated hero headline. */
  roles: [
    "Full-Stack Developer",
    "AI / ML Explorer",
    "Competitive Programmer",
    "Technical Leader",
    "Student Mentor",
  ],
  intro:
    "Computer Science undergraduate with a strong foundation in data structures, algorithms and modern software development — building full-stack products, exploring applied AI, and leading technology initiatives at my university.",
  status: "Open to opportunities",
  location: "Dhaka, Bangladesh",
  cv: "/Bakul_Ahmed_CV.pdf",
  /**
   * Portraits for the sidebar frame, in the order they are shown. Both are
   * square, which is what the frame expects — it is aspect-square, so
   * object-cover fits them edge to edge with no crop.
   */
  photos: ["/pp/bakul1.jpeg", "/pp/bakul2.jpg"] as string[],
} as const;

export const contactDetails = [
  { label: "Email", value: "that.bakul@gmail.com", href: "mailto:that.bakul@gmail.com", icon: "mail" },
  { label: "Phone", value: "+880 1786-685665", href: "tel:+8801786685665", icon: "phone" },
  { label: "Studying at", value: "Green University of Bangladesh", icon: "briefcase" },
  { label: "Location", value: "Dhaka, Bangladesh", icon: "pin" },
] as const;

export const socials = [
  { label: "GitHub", href: "https://github.com/BakulBd", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/cyberbokul", icon: "linkedin" },
  { label: "Codeforces", href: "https://codeforces.com/profile/BakulBd", icon: "codeforces" }, // VERIFY handle
  { label: "Email", href: "mailto:that.bakul@gmail.com", icon: "mail" },
] as const;

/**
 * Your other portfolios. Linked from the home grid and the footer so visitors
 * can jump to whichever version they prefer.
 */
export const versions = [
  {
    name: "Classic",
    tag: "Text-forward",
    href: "https://me.bakul.tech",
    blurb: "A pared-back, text-first portfolio — work, experiments, research and an archive of unbuilt ideas.",
  },
  {
    name: "Digital",
    tag: "3D & interactive",
    href: "https://bakul.app",
    blurb: "A machine-room take on the same story: subsystems, rack modules and an assembly-line timeline.",
  },
] as const;

/**
 * Four lighting moods. One scene, re-lit: each mood supplies the sky, the
 * horizon glow, the particle hue and the accent pair, and carries the
 * light/dark theme that goes with it.
 */
export type Mood = {
  id: "dawn" | "day" | "dusk" | "night";
  label: string;
  icon: "dawn" | "day" | "dusk" | "night";
  /** Every mood is dark: the hour is expressed in the sky, not the surfaces. */
  theme: "dark";
  /** Hero line shown while this mood is active. */
  line: string;
};

export const moods: Mood[] = [
  { id: "dawn", label: "Dawn", icon: "dawn", theme: "dark", line: "Early commits, before the campus wakes." },
  { id: "day", label: "Day", icon: "day", theme: "dark", line: "Deep-work hours — building and shipping." },
  { id: "dusk", label: "Dusk", icon: "dusk", theme: "dark", line: "Club meetings, code reviews, contest prep." },
  { id: "night", label: "Night", icon: "night", theme: "dark", line: "Late-night commits and long training runs." },
];

export const nav = [
  { label: "About", href: "/" },
  { label: "Resume", href: "/resume" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

/* ------------------------------------------------------------------ *
 * About
 * ------------------------------------------------------------------ */

export const about = {
  paragraphs: [
    "I am a **Computer Science and Engineering** undergraduate at **Green University of Bangladesh**, carrying a **CGPA of 3.96/4.00**, with a strong foundation in data structures, algorithms and modern software development.",
    "Most of my work is full-stack and hands-on: real-time multiplayer systems with **Next.js, Three.js and Colyseus**, an AI-powered university platform on **Firebase and TensorFlow.js**, and a **VS Code extension** for studying how developers understand AI-generated code. I work across **Python, C/C++, Java, JavaScript and TypeScript**.",
    "Alongside building, I lead. I serve as **General Secretary of the Green University Computer Club**, where I run club operations and coordinate university-wide technology events, and I mentor undergraduate students in the **Department of Artificial Intelligence and Data Science**.",
    "My longer-term interest is applied AI research — my coursework and projects span Artificial Intelligence, Machine Learning, Natural Language Processing and Data Mining, and I am looking for opportunities where I can keep building at that intersection.",
  ],
} as const;

export type Stat = { value: number; suffix: string; label: string; decimals?: number };

/** Animated figures on the About page. */
export const stats: Stat[] = [
  { value: 3.96, suffix: "/4.00", label: "CGPA", decimals: 2 },
  { value: 100, suffix: "+", label: "Problems solved" },
  { value: 6, suffix: "", label: "VC’s Awards" },
  { value: 800, suffix: "+", label: "Codeforces rating" },
];

/** "What I’m Doing" cards. */
export const services = [
  {
    title: "Full-Stack Development",
    icon: "code",
    text: "Building production web applications with React, Next.js, TypeScript and Node.js — from data model and real-time sync through to containerised deployment.",
  },
  {
    title: "AI & Machine Learning",
    icon: "spark",
    text: "Applying machine learning, NLP and LLM integration to practical problems: proctoring, plagiarism detection, OCR and automated evaluation workflows.",
  },
  {
    title: "Problem Solving",
    icon: "puzzle",
    text: "100+ problems solved across online judges with a Codeforces rating above 800, grounded in data structures, algorithms and OOP fundamentals.",
  },
  {
    title: "Technology Leadership",
    icon: "users",
    text: "Leading club operations as General Secretary of GUCC, coordinating university-wide events such as HackTheAI and GitAICampusVerse, and mentoring students.",
  },
] as const;

/* ------------------------------------------------------------------ *
 * Resume
 * ------------------------------------------------------------------ */

export type TimelineEntry = {
  title: string;
  org: string;
  period: string;
  location?: string;
  points: string[];
};

export const education: TimelineEntry[] = [
  {
    title: "B.Sc. in Computer Science and Engineering",
    org: "Green University of Bangladesh",
    period: "Sep 2023 — Oct 2027 (expected)",
    location: "Dhaka, Bangladesh",
    points: [
      "CGPA: 3.96 / 4.00.",
      "Relevant coursework: Data Structures and Algorithms, Object-Oriented Programming, Database Management Systems, Computer Architecture, Digital Logic Design, Operating Systems, Computer Networks, Software Engineering.",
      "AI track: Artificial Intelligence, Machine Learning, Data Mining, Natural Language Processing, Compiler Design.",
    ],
  },
];

export const experience: TimelineEntry[] = [
  {
    title: "General Secretary",
    org: "Green University Computer Club (GUCC)",
    period: "Mar 2026 — Present",
    location: "Green University of Bangladesh",
    points: [
      "Lead club operations, coordinate executive activities, and oversee academic, technical and student-focused initiatives.",
      "Coordinate with faculty, students and external organisations to execute major events, collaborations and technology-focused programmes.",
    ],
  },
  {
    title: "Student Mentor",
    org: "Department of Artificial Intelligence and Data Science",
    period: "Oct 2025 — Present",
    location: "Green University of Bangladesh",
    points: [
      "Mentored undergraduate students for one year, providing academic guidance, peer support and assistance with coursework and university activities.",
      "Ran mentoring and peer-learning sessions to strengthen communication, collaboration, problem-solving and academic engagement.",
    ],
  },
  {
    title: "Joint Information Secretary & Web Developer",
    org: "Green University Computer Club (GUCC)",
    period: "Mar 2025 — Feb 2026",
    location: "Green University of Bangladesh",
    points: [
      "Managed club communications and contributed to planning and executing technical and academic events, including HackTheAI and GitAICampusVerse.",
      "Developed and maintained the club website and managed digital communications, improving online engagement and event outreach.",
    ],
  },
];

export const skills = [
  { group: "Languages", items: ["Python", "C/C++", "Java", "JavaScript", "TypeScript", "SQL"] },
  {
    group: "AI & Data",
    items: ["Machine Learning", "Artificial Intelligence", "NLP", "Data Mining", "Data Analysis", "LLM Integration"],
  },
  {
    group: "Frameworks & Tools",
    items: ["React", "Next.js", "Node.js", "Three.js", "Colyseus", "Docker", "Git", "Linux"],
  },
  {
    group: "Core Concepts",
    items: ["Data Structures & Algorithms", "OOP", "DBMS", "Computer Networks", "Operating Systems"],
  },
] as const;

/* ------------------------------------------------------------------ *
 * Portfolio
 * ------------------------------------------------------------------ */

export type Project = {
  slug: string;
  name: string;
  subtitle: string;
  category: "Full-stack" | "AI / ML" | "Developer tools";
  summary: string;
  points: string[];
  stack: string[];
  year: string;
  image: string;
  imageAlt: string;
  repo?: string;
  demo?: string;
};

export const projects: Project[] = [
  {
    slug: "web-game",
    name: "Web Game Platform",
    subtitle: "Full-Stack Multiplayer Game",
    category: "Full-stack",
    summary:
      "Real-time multiplayer 3D game platform with authoritative server state, physics and containerised deployment.",
    points: [
      "Developed a real-time multiplayer 3D game platform using Next.js, Three.js, Node.js and Colyseus.",
      "Implemented client-server synchronisation, physics simulation, WebSockets and containerised deployment with Docker.",
    ],
    stack: ["Next.js", "TypeScript", "Three.js", "Node.js", "Colyseus", "Docker"],
    year: "2026",
    image: "/work/web-game.svg",
    imageAlt: "Abstract preview: networked 3D game clients synchronising against an authoritative server.",
    repo: "https://github.com/BakulBd/web-game",
  },
  {
    slug: "epistemic-guard",
    name: "Epistemic Guard",
    subtitle: "AI-Assisted Programming Research",
    category: "Developer tools",
    summary:
      "VS Code extension for studying how developers understand AI-generated code, through metacognitive explanations and repair tasks.",
    points: [
      "Built a VS Code extension for studying AI-assisted programming through metacognitive explanations and code-repair tasks.",
      "Integrated LLM-based evaluation, telemetry and automated experimental workflows for analysing developers’ understanding of AI-generated code.",
    ],
    stack: ["TypeScript", "VS Code API", "LLM", "Node.js"],
    year: "2026",
    image: "/work/epistemic-guard.svg",
    imageAlt: "Abstract preview: an editor pane with AI explanations and a code-repair task flow.",
    repo: "https://github.com/BakulBd/epistemic-guard",
  },
  {
    slug: "green-guardian",
    name: "Green Guardian",
    subtitle: "AI-Powered University Platform",
    category: "AI / ML",
    summary:
      "Full-stack university platform with AI exam proctoring, plagiarism detection, OCR and academic analytics.",
    points: [
      "Built a full-stack university platform with student, teacher, admin and classroom management workflows.",
      "Implemented AI exam proctoring, plagiarism detection, OCR, AI-assisted marking and academic analytics.",
    ],
    stack: ["Next.js", "TypeScript", "Firebase", "TensorFlow.js", "Gemini AI"],
    year: "2026",
    image: "/work/green-guardian.svg",
    imageAlt: "Abstract preview: a proctoring and analytics dashboard with detection overlays.",
    repo: "https://github.com/BakulBd/GreenGuardian",
    demo: "https://green.bakul.app",
  },
];

/* ------------------------------------------------------------------ *
 * Certifications & Awards
 * ------------------------------------------------------------------ */

export type Award = {
  title: string;
  org: string;
  detail: string;
  year: string;
};

export const awards: Award[] = [
  {
    title: "Vice-Chancellor’s Award",
    org: "Green University of Bangladesh",
    detail: "Recipient across six academic semesters for outstanding academic performance.",
    year: "2023 — 2026",
  },
  {
    title: "Code in Place",
    org: "Stanford University",
    detail: "Completed the 2023 Python programming course.",
    year: "2023",
  },
  {
    title: "Competitive Programming",
    org: "Codeforces & online judges",
    detail: "Solved 100+ programming problems across multiple online judges; Codeforces rating 800+.",
    year: "Ongoing",
  },
];

/* ------------------------------------------------------------------ *
 * Blog — PLACEHOLDER. Replace with real posts, or remove "Blog" from nav.
 * ------------------------------------------------------------------ */

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image: string;
  imageAlt: string;
  href?: string;
};

export const posts: Post[] = [
  {
    slug: "authoritative-multiplayer",
    title: "Keeping a 3D multiplayer game in sync without trusting the client",
    excerpt:
      "Notes on authoritative server state, interpolation and the physics reconciliation loop behind my Colyseus and Three.js game platform.",
    date: "2026-06-12",
    category: "Engineering",
    image: "/work/web-game.svg",
    imageAlt: "Networked 3D game clients synchronising against an authoritative server.",
  },
  {
    slug: "understanding-ai-code",
    title: "Do we actually understand the code the model wrote?",
    excerpt:
      "What building Epistemic Guard taught me about metacognition, code-repair tasks and measuring comprehension of AI-generated code.",
    date: "2026-03-30",
    category: "AI research",
    image: "/work/epistemic-guard.svg",
    imageAlt: "An editor pane with AI explanations and a code-repair task flow.",
  },
  {
    slug: "shipping-green-guardian",
    title: "Shipping an AI university platform that teachers will actually use",
    excerpt:
      "Proctoring, plagiarism detection and OCR are the easy part. The hard part is workflows people trust.",
    date: "2026-01-18",
    category: "Product",
    image: "/work/green-guardian.svg",
    imageAlt: "A proctoring and analytics dashboard with detection overlays.",
  },
];

/* ------------------------------------------------------------------ *
 * Contact
 * ------------------------------------------------------------------ */

export const contact = {
  heading: "Let’s build something useful.",
  supporting:
    "Have an idea, an opportunity, or a project in mind? Send a message and I’ll get back to you.",
} as const;
