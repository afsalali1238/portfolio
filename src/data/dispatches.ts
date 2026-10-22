export type Dispatch = {
  number: string;
  date: string;
  title: string;
  subtitle: string;
  path: string;
  readTime: string;
};

export const DISPATCHES: Dispatch[] = [
  {
    number: "06",
    date: "21 October 2026",
    title: "The reality test.",
    subtitle:
      "Building is easy because it only involves you. Finding customers is brutal because strangers have zero bias toward your baby.",
    path: "/notes/the-reality-test",
    readTime: "4 min read",
  },
  {
    number: "05",
    date: "24 September 2026",
    title: "The WhatsApp operating system.",
    subtitle:
      "What building NxtDoorChef in Dubai taught me about local trust, disintermediation, and the death of platform taxes.",
    path: "/notes/the-whatsapp-operating-system",
    readTime: "4 min read",
  },
  {
    number: "04",
    date: "30 August 2026",
    title: "The 15-minute rule.",
    subtitle:
      "Why infinite-scroll habit and health apps get abandoned, and the case for bounded daily loops.",
    path: "/notes/the-15-minute-rule",
    readTime: "3 min read",
  },
  {
    number: "03",
    date: "28 July 2026",
    title: "The empathy moat.",
    subtitle:
      "Why building for someone you love beats every synthetic product persona and corporate metrics deck.",
    path: "/notes/the-empathy-moat",
    readTime: "4 min read",
  },
  {
    number: "02",
    date: "20 June 2026",
    title: "The moat moved.",
    subtitle: "Ideas were cheap. Then building was. Now even being first is.",
    path: "/notes/the-moat-moved",
    readTime: "3 min read",
  },
  {
    number: "01",
    date: "14 May 2026",
    title: "The Energy Ledger.",
    subtitle: "AI tokens are the new currency. And every token is an IOU on physical energy.",
    path: "/notes/the-energy-ledger",
    readTime: "4 min read",
  },
];
