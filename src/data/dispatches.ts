export type PlatformLinks = {
  substack?: string;
  medium?: string;
  linkedin?: string;
  twitter?: string;
};

export type Dispatch = {
  number: string;
  date: string;
  title: string;
  subtitle: string;
  path: string;
  readTime: string;
  words?: string;
  external?: PlatformLinks;
  relatedWorks?: string[];
  tags?: string[];
};

export const DISPATCHES: Dispatch[] = [
  {
    number: "08",
    date: "31 October 2026",
    title: "The curious case of building.",
    subtitle:
      "The wall between having an idea and building it just came down. This is what happens when you build out of pure curiosity.",
    path: "/notes/the-curious-case-of-building",
    readTime: "5 min read",
    words: "~1,100 words",
    external: {
      substack: "https://substack.com/@afsalali",
      medium: "https://medium.com/@afsalali1238",
      linkedin: "https://www.linkedin.com/in/afsalali1238/",
      twitter: "https://x.com/afsalali1238",
    },
    relatedWorks: ["provia", "pharmarab", "physioarab", "kine", "nxtdoorchef", "terrarium", "novibe"],
    tags: ["Curiosity", "Frontier AI", "Operators", "Building in Public", "Dubai"],
  },
  {
    number: "07",
    date: "30 October 2026",
    title: "The first hit is free.",
    subtitle:
      "AI, usage limits, and the unfinished horse: why cognitive offloading feels like genius until the rate limit hits.",
    path: "/notes/the-first-hit-is-free",
    readTime: "4 min read",
    words: "~700 words",
    external: {
      substack: "https://substack.com/@afsalali",
      medium: "https://medium.com/@afsalali1238",
      linkedin: "https://www.linkedin.com/in/afsalali1238/",
      twitter: "https://x.com/afsalali1238",
    },
    relatedWorks: ["incubator", "novibe", "mindbench"],
    tags: ["Cognition", "Usage Limits", "Productivity", "Vibe Coding"],
  },
  {
    number: "06",
    date: "21 October 2026",
    title: "The reality test.",
    subtitle:
      "Building is easy because it only involves you. Finding customers is brutal because strangers have zero bias toward your baby.",
    path: "/notes/the-reality-test",
    readTime: "6 min read",
    words: "~1,400 words",
    external: {
      substack: "https://substack.com/@afsalali",
      medium: "https://medium.com/@afsalali1238",
      linkedin: "https://www.linkedin.com/in/afsalali1238/",
      twitter: "https://x.com/afsalali1238",
    },
    relatedWorks: ["crafters-united", "provia", "nxtdoorchef"],
    tags: ["Distribution", "Founder Ego", "Customer Validation", "Revenue"],
  },
  {
    number: "05",
    date: "24 September 2026",
    title: "The WhatsApp operating system.",
    subtitle:
      "What building NxtDoorChef and Kasper in Dubai taught me about local trust, disintermediation, and the death of platform taxes.",
    path: "/notes/the-whatsapp-operating-system",
    readTime: "5 min read",
    words: "~1,200 words",
    external: {
      substack: "https://substack.com/@afsalali",
      medium: "https://medium.com/@afsalali1238",
      linkedin: "https://www.linkedin.com/in/afsalali1238/",
      twitter: "https://x.com/afsalali1238",
    },
    relatedWorks: ["nxtdoorchef", "kasper", "crafters-united"],
    tags: ["Hyperlocal", "WhatsApp", "Zero-Fee", "Logistics", "Dubai"],
  },
  {
    number: "04",
    date: "30 August 2026",
    title: "The 15-minute rule.",
    subtitle:
      "Why infinite-scroll habit and health apps get abandoned, and the case for bounded daily loops.",
    path: "/notes/the-15-minute-rule",
    readTime: "5 min read",
    words: "~1,100 words",
    external: {
      substack: "https://substack.com/@afsalali",
      medium: "https://medium.com/@afsalali1238",
      linkedin: "https://www.linkedin.com/in/afsalali1238/",
      twitter: "https://x.com/afsalali1238",
    },
    relatedWorks: ["kine", "provia", "pharmarab", "bodhi-pomodoro"],
    tags: ["Product Design", "Habits", "Clinical Tech", "Attention"],
  },
  {
    number: "03",
    date: "28 July 2026",
    title: "The empathy moat.",
    subtitle:
      "Why building for someone you love beats every synthetic product persona and corporate metrics deck.",
    path: "/notes/the-empathy-moat",
    readTime: "5 min read",
    words: "~1,200 words",
    external: {
      substack: "https://substack.com/@afsalali",
      medium: "https://medium.com/@afsalali1238",
      linkedin: "https://www.linkedin.com/in/afsalali1238/",
      twitter: "https://x.com/afsalali1238",
    },
    relatedWorks: ["provia", "pharmarab", "physioarab"],
    tags: ["Empathy", "Audience of One", "Healthcare", "Deira"],
  },
  {
    number: "02",
    date: "20 June 2026",
    title: "The moat moved.",
    subtitle:
      "Ideas were cheap. Then building was. Now even being first is. Why customer loyalty is dead and your product is not your baby.",
    path: "/notes/the-moat-moved",
    readTime: "8 min read",
    words: "~1,900 words",
    external: {
      substack: "https://substack.com/@afsalali",
      medium: "https://medium.com/@afsalali1238",
      linkedin: "https://www.linkedin.com/in/afsalali1238/",
      twitter: "https://x.com/afsalali1238",
    },
    relatedWorks: ["incubator", "novibe", "mindbench", "cv-pipeline"],
    tags: ["Moats", "Economics", "First Mover", "Bootstrapping"],
  },
  {
    number: "01",
    date: "14 May 2026",
    title: "The Energy Ledger.",
    subtitle:
      "AI tokens are the new currency. And every token is an IOU on physical energy. The physics of 'hello' and the great ESG hypocrisy.",
    path: "/notes/the-energy-ledger",
    readTime: "8 min read",
    words: "~1,850 words",
    external: {
      substack: "https://substack.com/@afsalali",
      medium: "https://medium.com/@afsalali1238",
      linkedin: "https://www.linkedin.com/in/afsalali1238/",
      twitter: "https://x.com/afsalali1238",
    },
    relatedWorks: ["novibe", "mindbench", "doomscholar"],
    tags: ["Thermodynamics", "Energy", "ESG", "Compute"],
  },
];

export function getDispatchByPath(path: string): Dispatch | undefined {
  return DISPATCHES.find((d) => d.path === path);
}

export function getNextAndPrevDispatches(path: string): { prev?: Dispatch; next?: Dispatch } {
  const index = DISPATCHES.findIndex((d) => d.path === path);
  if (index === -1) return {};
  // List is newest first (08 down to 01)
  const prev = index < DISPATCHES.length - 1 ? DISPATCHES[index + 1] : undefined;
  const next = index > 0 ? DISPATCHES[index - 1] : undefined;
  return { prev, next };
}

export function getRelatedNotesForProject(projectId: string): Dispatch[] {
  return DISPATCHES.filter((d) => d.relatedWorks?.includes(projectId));
}
