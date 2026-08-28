// Dot2Recruit landing page — rebuilt to match the provided reference layout
// using the project's real content, colors, and assets.
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ── Shared icons ──────────────────────────────────────────────────────────────

function ArrowUpRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function Sparkle({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
    </svg>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${filled ? "text-[#FFA500]" : "text-gray-300"}`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function Check({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Plus({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Minus({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronLeft({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ── Reveal-on-scroll hook ─────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

// ── Data (sourced from the real project) ──────────────────────────────────────

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "/new-candidate", label: "New Candidate" },
  { href: "/candidates", label: "Candidates" },
  { href: "/analytics", label: "Reports" },
  { href: "#faq", label: "FAQ" },
];

const TAGS = ["Frontend Developer", "Backend Developer", "Full-Stack AI Automation", "UI Designer"];

const STATS = [
  { value: "46.2k+", label: "Applications processed in Dot2Recruit" },
  { value: "15min+", label: "Average AI screening time per candidate" },
  { value: "232+", label: "Candidates currently in pipeline" },
];

const FEATURES = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
        <line x1="9" y1="21" x2="15" y2="21" />
      </svg>
    ),
    title: "AI-Powered Matching",
    desc: "Let n8n and AI compare every CV to your job description and return structured scores.",
    link: "Explore matching",
    href: "/candidates",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Interview Scheduling",
    desc: "Track upcoming interviews, platforms, and feedback in one shared calendar view.",
    link: "View interviews",
    href: "/interviews",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    title: "Hiring Assistant",
    desc: "An AI assistant that learns your hiring preferences and past decisions over time.",
    link: "See the assistant",
    href: "/hiring-assistant",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: "Hiring Reports",
    desc: "See score averages, decision breakdowns, and screening throughput in real time.",
    link: "See reports",
    href: "/analytics",
  },
];

const JOBS = [
  { tags: ["Remote", "Full-time"], title: "Full-Stack AI Automation Developer", meta: "Posted 2h ago", company: "Dot2Recruit", location: "Remote", type: "primary" },
  { tags: ["Contract", "Design"], title: "Senior UI Designer", meta: "Posted 1d ago", company: "Dot2Recruit", location: "New York, NY", type: "outline" },
  { tags: ["On-site", "Engineering"], title: "Backend Developer", meta: "Posted 2d ago", company: "Dot2Recruit", location: "Berlin", type: "outline" },
  { tags: ["Remote", "Part-time"], title: "Frontend Developer", meta: "Posted 3d ago", company: "Dot2Recruit", location: "Global", type: "outline" },
];

const BENEFITS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Faster Screening",
    desc: "Cut first-round review time from days to minutes with automated scoring.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "Smarter Matching",
    desc: "Compare CVs against job descriptions using structured AI analysis.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: "Fewer Missed Hires",
    desc: "Surface strong-match candidates before they slip through the cracks.",
  },
];

const CHECKLIST = [
  "Upload a CV and job description in seconds",
  "Receive an overall score plus a hire decision",
  "Share results with your hiring team instantly",
];

const TESTIMONIALS = [
  {
    quote: "Dot2Recruit reduced our resume review time by 80% and helped us focus on the best candidates.",
    name: "Sarah Chen",
    role: "Head of Talent",
    rating: 5,
    initial: "S",
  },
  {
    quote: "The AI scores and decision reasons are surprisingly accurate. It became our first-round filter overnight.",
    name: "Marcus Johnson",
    role: "Engineering Manager",
    rating: 5,
    initial: "M",
  },
  {
    quote: "We onboarded the whole team in one afternoon. Multi-tenancy and shared feedback are game changers.",
    name: "Priya Patel",
    role: "Recruitment Lead",
    rating: 5,
    initial: "P",
  },
];

const TEAM_TABS = ["All", "Developers", "Designers", "Operations"];

const TEAM = [
  { name: "Alex Dom Bringer", role: "Frontend Developer", availability: "Open to work", location: "Remote", tags: ["React", "TypeScript"], category: "Developers", initial: "A" },
  { name: "Jamie Rivera", role: "UI Designer", availability: "Freelance", location: "New York", tags: ["Figma", "Design Systems"], category: "Designers", initial: "J" },
  { name: "Morgan Lee", role: "Full-Stack AI Automation", availability: "Open to work", location: "Berlin", tags: ["Next.js", "n8n"], category: "Developers", initial: "M" },
];

const FAQS = [
  { q: "How does AI screening work?", a: "Dot2Recruit sends the candidate CV and job description to an n8n workflow that uses an AI model to return a structured score, decision, and reasoning." },
  { q: "Is my data secure?", a: "All data is stored in your own Supabase project with row-level security and tenant isolation built in." },
  { q: "Can I invite team members?", a: "Yes. Each account is a tenant, and you can add colleagues to review candidates and feedback together." },
  { q: "What file formats are supported?", a: "Currently text-based CV and JD content is supported. Resume parsing from PDF/Word is on the roadmap." },
];

// TODO: replace blog posts with real Dot2Recruit content when available.
const POSTS = [
  { title: "Maximizing Your Recruitment Funnel", date: "Aug 15, 2026", readTime: "4 min read", gradient: "from-[#4A90E2] to-[#6BA8E8]" },
  { title: "How AI Shortlists Can Transform Hiring", date: "Aug 10, 2026", readTime: "5 min read", gradient: "from-[#6B5CE7] to-[#4A90E2]" },
  { title: "Behavioral Data in Candidate Screening", date: "Aug 5, 2026", readTime: "3 min read", gradient: "from-[#50C878] to-[#4A90E2]" },
];

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "New Candidate", href: "/new-candidate" },
      { label: "Candidates", href: "/candidates" },
      { label: "Reports", href: "/analytics" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Blog", href: "#insights" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Guide", href: "#" },
    ],
  },
];

// ── Illustrations ─────────────────────────────────────────────────────────────

function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 320" className="h-auto w-full max-w-md">
      <defs>
        <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="20" y="20" width="360" height="280" rx="24" fill="url(#heroGrad)" />
      <rect x="50" y="60" width="140" height="200" rx="16" fill="white" />
      <circle cx="120" cy="110" r="28" fill="#EBF3FC" />
      <path d="M120 96v28M106 110h28" stroke="#4A90E2" strokeWidth="3" strokeLinecap="round" />
      <rect x="70" y="155" width="100" height="8" rx="4" fill="#CBD5E1" />
      <rect x="70" y="171" width="80" height="8" rx="4" fill="#E2E8F0" />
      <rect x="70" y="187" width="90" height="8" rx="4" fill="#E2E8F0" />
      <rect x="210" y="60" width="150" height="90" rx="16" fill="white" />
      <rect x="230" y="80" width="110" height="8" rx="4" fill="#CBD5E1" />
      <rect x="230" y="96" width="90" height="8" rx="4" fill="#E2E8F0" />
      <circle cx="360" cy="105" r="16" fill="#50C878" />
      <path d="M352 105l6 6 12-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="210" y="170" width="150" height="90" rx="16" fill="white" />
      <rect x="230" y="190" width="110" height="8" rx="4" fill="#CBD5E1" />
      <rect x="230" y="206" width="70" height="8" rx="4" fill="#E2E8F0" />
    </svg>
  );
}

function MapIllustration() {
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-full">
      <circle cx="200" cy="150" r="110" fill="#EBF3FC" />
      <circle cx="200" cy="150" r="90" fill="#DBEAFE" />
      <path d="M140 150c10-30 40-50 60-50s50 20 60 50c-10 40-40 60-60 60s-50-20-60-60z" fill="#4A90E2" opacity="0.15" />
      <circle cx="160" cy="130" r="6" fill="#4A90E2" />
      <circle cx="250" cy="120" r="6" fill="#4A90E2" />
      <circle cx="230" cy="180" r="6" fill="#4A90E2" />
      <circle cx="180" cy="190" r="6" fill="#4A90E2" />
      <path d="M160 130l40 10 30 40" stroke="#4A90E2" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.5" />
      <path d="M250 120l-20 60" stroke="#4A90E2" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.5" />
    </svg>
  );
}

// ── Section components ────────────────────────────────────────────────────────

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src="/favicon.png" alt="Dot2Recruit logo" width={32} height={32} className="h-8 w-8 rounded-md object-contain" />
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>Dot2Recruit</span>
    </Link>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-landing bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-sm font-semibold text-ink transition hover:text-accent">
            Sign In
          </Link>
          <Link href="/signup" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover hover:shadow-card-hover">
            Get Started
          </Link>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-landing text-ink transition hover:border-accent hover:text-accent">
            <ArrowUpRight />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-landing text-ink md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      {open && (
        <div className="border-t border-landing px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3 border-t border-landing pt-4">
            <Link href="/login" className="text-sm font-semibold text-ink">Sign In</Link>
            <Link href="/signup" className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-4 mt-4 rounded-[2rem] bg-accent-soft px-6 py-12 lg:mx-8 lg:px-12 lg:py-20" data-reveal>
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-accent shadow-sm">
              <Sparkle className="h-3.5 w-3.5" /> AI-Powered Screening
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Modernizing Recruitment <br className="hidden sm:block" />
              <span className="inline-flex items-center gap-2 text-accent">
                <Sparkle className="h-8 w-8 lg:h-10 lg:w-10" /> Search Experience
              </span>
            </h1>
            <p className="max-w-lg text-base text-slate-600 lg:text-lg">
              AI-powered candidate screening for recruiters. Find, rank, and manage top talent faster with Dot2Recruit.
            </p>
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Enter a job title or skill"
                className="h-14 w-full rounded-full border border-landing bg-white pl-5 pr-36 text-sm text-ink shadow-sm placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/20"
              />
              <button className="absolute right-1.5 top-1.5 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-hover">
                <SearchIcon /> Search
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <span key={tag} className="rounded-full border border-landing bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  const partners = ["Next.js", "Supabase", "n8n", "Tailwind", "TypeScript", "Zod"];
  return (
    <section className="bg-white py-10" data-reveal>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center">
          <p className="max-w-[160px] text-sm font-semibold text-ink">Trusted by modern recruitment stacks</p>
          <div className="flex flex-1 flex-wrap items-center justify-around gap-6 lg:justify-between">
            {partners.map((name) => (
              <div key={name} className="flex items-center gap-2 grayscale opacity-60 transition hover:opacity-100">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-slate-600">{name[0]}</span>
                <span className="text-sm font-semibold text-slate-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-white py-14" data-reveal>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-8 divide-y divide-landing sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-extrabold text-ink lg:text-5xl">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: (typeof FEATURES)[0] }) {
  return (
    <div className="group relative rounded-2xl border border-landing bg-white p-6 shadow-card transition hover-lift">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-accent">{feature.icon}</div>
      <h3 className="text-lg font-bold text-ink">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
      <Link href={feature.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
        {feature.link} <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
      <div className="absolute right-4 top-4 text-slate-400 transition group-hover:text-accent">
        <ArrowUpRight className="h-5 w-5" />
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="bg-white py-20" data-reveal>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Popular Hiring Categories</h2>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover">
            Get Started <ArrowUpRight />
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="group relative row-span-2 rounded-3xl border border-landing bg-accent-soft p-8 shadow-card transition hover-lift lg:row-span-2">
            <h3 className="text-2xl font-bold text-ink">AI Resume Screening</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Parse CVs and job descriptions, then let the AI score every applicant in minutes.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Score 0-100", "Decision tags", "Missing skills"].map((b) => (
                <span key={b} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent shadow-sm">
                  {b}
                </span>
              ))}
            </div>
            <div className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent shadow-card">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div className="absolute right-8 top-12 animate-float rounded-xl bg-white p-3 shadow-card">
              <Sparkle className="h-6 w-6 text-accent" />
            </div>
            <div className="absolute left-8 top-24 animate-float rounded-xl bg-white p-3 shadow-card" style={{ animationDelay: "1s" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function JobCard({ job, index }: { job: (typeof JOBS)[0]; index: number }) {
  return (
    <div className="flex flex-col rounded-2xl border border-landing bg-white p-5 shadow-card transition hover-lift">
      <div className="flex flex-wrap gap-2">
        {job.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-accent-ghost px-2.5 py-0.5 text-[10px] font-semibold text-accent">
            {tag}
          </span>
        ))}
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink">{job.title}</h3>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {job.meta}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Image src="/favicon.png" alt={job.company} width={20} height={20} className="h-5 w-5 rounded object-contain" />
        <span className="text-xs font-semibold text-slate-700">{job.company}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {job.location}
      </div>
      <button className={`mt-auto rounded-full px-4 py-2 text-xs font-semibold transition ${index === 0 ? "bg-accent text-white hover:bg-accent-hover" : "border border-landing text-slate-700 hover:border-accent hover:text-accent"}`}>
        Apply Position
      </button>
    </div>
  );
}

function FeaturedJobs() {
  return (
    <section className="bg-white py-20" data-reveal>
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Featured Job Circulars</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Open roles currently tracked in Dot2Recruit. Apply or add your own openings.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {JOBS.map((job, i) => (
            <JobCard key={job.title} job={job} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section className="mx-4 rounded-[2rem] bg-accent-soft px-6 py-16 lg:mx-8 lg:px-12" data-reveal>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end">
          <div className="lg:max-w-sm">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Recruitment{" "}
              <span className="relative inline-block text-accent">
                Simplified
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent/30" />
              </span>{" "}
              with Dot2Recruit
            </h2>
          </div>
          <div className="grid flex-1 gap-6 sm:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-landing bg-white p-6 shadow-card transition hover-lift">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-landing text-accent">{b.icon}</div>
                <h3 className="text-lg font-bold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SplitSection() {
  return (
    <section className="bg-white py-20" data-reveal>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative rounded-[2rem] bg-accent-soft p-6 lg:p-10">
            <div className="absolute left-6 top-6 z-10 max-w-[220px] rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs font-semibold text-accent">Global talent pool</p>
              <p className="mt-1 text-sm font-bold text-ink">Screen candidates from anywhere</p>
            </div>
            <MapIllustration />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Onboard Your <span className="text-accent">Talent</span> From Anywhere
            </h2>
            <p className="text-slate-600">Dot2Recruit connects your hiring workflow across time zones. Invite team members, share feedback, and keep every candidate review in one place.</p>
            <ul className="space-y-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-light text-accent">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/candidates" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Explore now <ArrowUpRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: (typeof TESTIMONIALS)[0] }) {
  return (
    <div className="w-[280px] shrink-0 snap-start rounded-2xl bg-white p-6 shadow-card">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < testimonial.rating} />
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700">&quot;{testimonial.quote}&quot;</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">{testimonial.initial}</div>
        <div>
          <p className="text-sm font-bold text-ink">{testimonial.name}</p>
          <p className="text-xs text-slate-500">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };
  return (
    <section className="bg-white py-20" data-reveal>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="rounded-[2rem] bg-ink px-6 py-14 lg:px-12 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="flex flex-col justify-between">
              <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                Reviewed by the Community. Trusted by <span className="text-accent">Professionals</span>.
              </h2>
              <div className="mt-8 flex gap-3">
                <button onClick={() => scroll("left")} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10">
                  <ChevronLeft />
                </button>
                <button onClick={() => scroll("right")} className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-hover">
                  <ChevronRight />
                </button>
              </div>
            </div>
            <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {TESTIMONIALS.map((t) => (
                <TestimonialCard key={t.name} testimonial={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamCard({ member, featured }: { member: (typeof TEAM)[0]; featured: boolean }) {
  return (
    <div className="rounded-2xl border border-landing bg-white p-5 shadow-card transition hover-lift">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-light text-2xl font-bold text-accent">{member.initial}</div>
      <h3 className="mt-4 text-lg font-bold text-ink">{member.name}</h3>
      <p className="text-sm text-slate-500">{member.role}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Availability</p>
          <p className="text-xs font-semibold text-ink">{member.availability}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Location</p>
          <p className="text-xs font-semibold text-ink">{member.location}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {member.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-accent-ghost px-2.5 py-0.5 text-[10px] font-semibold text-accent">
            {tag}
          </span>
        ))}
      </div>
      <button className={`mt-5 w-full rounded-full py-2 text-xs font-semibold transition ${featured ? "bg-accent text-white hover:bg-accent-hover" : "border border-landing text-slate-700 hover:border-accent hover:text-accent"}`}>
        View Profile
      </button>
    </div>
  );
}

function Team() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? TEAM : TEAM.filter((m) => m.category === active);
  return (
    <section className="bg-white py-20" data-reveal>
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Hire by Profession</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Browse sample candidate profiles already screened by Dot2Recruit.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {TEAM_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${active === tab ? "bg-accent text-white" : "border border-landing bg-white text-slate-700 hover:border-accent"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member, i) => (
            <TeamCard key={member.name} member={member} featured={i === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-accent-soft py-20" data-reveal>
      <div className="mx-auto max-w-3xl px-4 lg:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">Frequently Asked Questions</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">Everything you need to know about running AI screenings with Dot2Recruit.</p>
        <div className="mt-10 space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-landing bg-white p-5 shadow-card">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between text-left">
                <span className="text-sm font-bold text-ink">{faq.q}</span>
                <span className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent">
                  {open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              {open === i && <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Blog() {
  return (
    <section id="insights" className="bg-white py-20" data-reveal>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">Insights & Updates</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">News from the product and tips for smarter hiring.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <article key={post.title} className="group cursor-pointer rounded-2xl border border-landing bg-white p-4 shadow-card transition hover-lift">
              <div className={`h-44 w-full rounded-xl bg-gradient-to-br ${post.gradient}`} />
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h3 className="mt-2 text-base font-bold text-ink transition group-hover:text-accent">{post.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCTA() {
  return (
    <footer className="bg-white pb-8" data-reveal>
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="rounded-[2rem] bg-ink px-6 py-14 lg:px-12 lg:py-20">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">Let&apos;s Contact</h2>
            <button className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white transition hover:scale-105 hover:bg-accent-hover">
              <ArrowUpRight className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-14 grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Logo light />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">AI-powered recruitment screening system built with Next.js, Supabase, and n8n.</p>
              <div className="mt-6 flex gap-3">
                {[
                  { label: "LinkedIn", d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
                  { label: "X", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  { label: "GitHub", d: "M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85.01 1.71.11 2.51.32 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d={social.d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white">{col.title}</h4>
                <ul className="mt-4 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-slate-400 transition hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Dot2Recruit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useReveal();
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <Stats />
        <Features />
        <FeaturedJobs />
        <Benefits />
        <SplitSection />
        <Testimonials />
        <Team />
        <FAQ />
        <Blog />
        <FooterCTA />
      </main>
    </div>
  );
}
