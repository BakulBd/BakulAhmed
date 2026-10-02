import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true, focusable: false } as const;
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function Mail(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3.5 6.5 7.3 5.2a2 2 0 0 0 2.4 0l7.3-5.2" /></g></svg>);
}
export function Phone(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="M6.2 3.5h3l1.4 3.6-1.8 1.4a12 12 0 0 0 5.7 5.7l1.4-1.8 3.6 1.4v3a1.9 1.9 0 0 1-2.1 1.9A16.5 16.5 0 0 1 4.3 5.6 1.9 1.9 0 0 1 6.2 3.5Z" /></svg>);
}
export function Briefcase(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><rect x="2.5" y="7.5" width="19" height="12" rx="2.5" /><path d="M8.5 7.5v-1a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1M2.5 12.5h19" /></g></svg>);
}
export function Pin(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></g></svg>);
}
export function GitHub(p: P) {
  return (<svg {...base} fill="currentColor" {...p}><path d="M12 .5A11.5 11.5 0 0 0 8.4 22.9c.6.1.8-.25.8-.56v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.35-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.15.08 1.75 1.18 1.75 1.18 1 1.75 2.7 1.25 3.35.95.1-.75.4-1.25.7-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.16 1.18a11 11 0 0 1 5.76 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.15v3.19c0 .31.21.67.81.56A11.5 11.5 0 0 0 12 .5Z" /></svg>);
}
export function LinkedIn(p: P) {
  return (<svg {...base} fill="currentColor" {...p}><path d="M5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3 9h4v12H3V9Zm6.5 0h3.8v1.6h.06c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.77 2.4 4.77 5.53V21h-4v-5.5c0-1.3-.02-3-1.9-3-1.9 0-2.2 1.4-2.2 2.9V21h-4V9Z" /></svg>);
}
export function Facebook(p: P) {
  return (<svg {...base} fill="currentColor" {...p}><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.24-1.46 1.5-1.46H16.5V4.45c-.27-.04-1.2-.12-2.3-.12-2.27 0-3.83 1.39-3.83 3.94V10.5H7.9v3h2.47V21h3.13Z" /></svg>);
}
export function Instagram(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></g></svg>);
}
export function ArrowUpRight(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="M7 17 17 7m0 0H9m8 0v8" /></svg>);
}
export function Chevron(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="m6 9 6 6 6-6" /></svg>);
}
export function Code(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="m8.5 8-4.5 4 4.5 4M15.5 8l4.5 4-4.5 4M13.5 4.5l-3 15" /></svg>);
}
export function Spark(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7L4.5 10.9 10.1 9 12 3.5ZM18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" /></svg>);
}
export function Puzzle(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="M10 4.5a1.8 1.8 0 0 1 3.6 0v.8h2.6a1 1 0 0 1 1 1v2.6h.8a1.8 1.8 0 0 1 0 3.6h-.8v2.6a1 1 0 0 1-1 1h-2.6v.8a1.8 1.8 0 0 1-3.6 0v-.8H7.4a1 1 0 0 1-1-1v-2.6h-.8a1.8 1.8 0 0 1 0-3.6h.8V6.5a1 1 0 0 1 1-1H10v-1Z" /></svg>);
}
export function Users(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><circle cx="9.5" cy="8" r="3.2" /><path d="M3.5 20a6 6 0 0 1 12 0M16.5 5.2a3.2 3.2 0 0 1 0 5.9M17.8 14.4A6 6 0 0 1 20.5 20" /></g></svg>);
}
export function Calendar(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></g></svg>);
}
export function Send(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z" /></svg>);
}
export function Download(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="M12 3.5v11m0 0 4.5-4.5M12 14.5 7.5 10M4.5 17v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V17" /></svg>);
}

export function Globe(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><circle cx="12" cy="12" r="9" /><path d="M3.2 9.5h17.6M3.2 14.5h17.6M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" /></g></svg>);
}
export function Codeforces(p: P) {
  return (
    <svg {...base} fill="currentColor" {...p}>
      <rect x="2.5" y="10" width="5" height="10" rx="1.4" />
      <rect x="9.5" y="4.5" width="5" height="15.5" rx="1.4" />
      <rect x="16.5" y="8" width="5" height="12" rx="1.4" />
    </svg>
  );
}
export function Award(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><circle cx="12" cy="9" r="5.5" /><path d="m8.5 13.8-1.3 6.7 4.8-2.6 4.8 2.6-1.3-6.7" /></g></svg>);
}

/* Navigation: one glyph per page, drawn to sit together in the tab bar. */
export function NavAbout(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><circle cx="12" cy="8.4" r="3.6" /><path d="M5 20.2a7 7 0 0 1 14 0" /></g></svg>);
}
export function NavResume(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><path d="M6.5 3.5h7.6l4.4 4.4v10.6a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M14 3.7V8h4.3M8.5 12.5h7M8.5 16h5" /></g></svg>);
}
export function NavPortfolio(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></g></svg>);
}
export function NavBlog(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><path d="M4 20h4.2L19.4 8.8a2.4 2.4 0 0 0-3.4-3.4L4.8 16.6 4 20Z" /><path d="m14.6 6.8 2.6 2.6M13 20h7" /></g></svg>);
}
export function NavContact(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><path d="M20.5 11.6a8.1 8.1 0 0 1-11.9 7.2L3.5 20.5l1.7-4.7A8.1 8.1 0 1 1 20.5 11.6Z" /><path d="M8.6 11.8h.01M12.2 11.8h.01M15.8 11.8h.01" strokeWidth="2.4" /></g></svg>);
}
export function ArrowUp(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="M12 19V5m0 0-6 6m6-6 6 6" /></svg>);
}
export function Copy(p: P) {
  return (<svg {...base} {...p}><g {...stroke}><rect x="8.5" y="8.5" width="12" height="12" rx="2.6" /><path d="M15.5 8.5V6.1a2.6 2.6 0 0 0-2.6-2.6H6.1a2.6 2.6 0 0 0-2.6 2.6v6.8a2.6 2.6 0 0 0 2.6 2.6h2.4" /></g></svg>);
}
export function Check(p: P) {
  return (<svg {...base} {...p}><path {...stroke} d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
}

export const iconMap = {
  mail: Mail, phone: Phone, briefcase: Briefcase, pin: Pin,
  github: GitHub, linkedin: LinkedIn, facebook: Facebook, instagram: Instagram,
  navAbout: NavAbout, navResume: NavResume, navPortfolio: NavPortfolio, navBlog: NavBlog, navContact: NavContact,
  code: Code, spark: Spark, puzzle: Puzzle, users: Users, globe: Globe, award: Award, codeforces: Codeforces,
} as const;

export type IconName = keyof typeof iconMap;
