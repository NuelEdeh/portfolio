// ============================================================
// CONTENT.TS — Edit this file to update your portfolio
// Every section of the site pulls from here.
// ============================================================

export const site = {
  name: "Nuel Edeh",
  title: "Product Manager · AI Builder",
  tagline: "Building platforms at scale. Shipping AI agents. Thinking in systems.",
  description:
    "PM who has shipped platform products at scale — from 60–80B daily DNS events at Cloudflare to product-led growth at a co-founded startup. Interested in the psychology of product decisions as much as the infrastructure underneath them.",
  email: "nueledeh92@gmail.com",
  linkedin: "https://linkedin.com/in/nueledeh",
  github: "https://github.com/nueledeh",
  location: "Toronto, Canada",
};

export const about = {
  headline: "I build PM-led products and AI agents at the intersection of infrastructure, security, and human behaviour.",
  body: [
    "I'm a Product Manager and AI builder with 6+ years of experience — spanning enterprise consulting, 0→1 product, and large-scale security infrastructure. I also build things: I'm AI-native by practice — I shipped a production MCP agent at Cloudflare and designed a second.",
    "At Cloudflare I owned the full DNS Security and Secure Web Gateway portfolio — spanning threat intelligence, L3–L7 inspection, policy enforcement, and Zero Trust network access — growing ARR 2.3× in under two years. I delivered FedRAMP High compliance uplift across multiple product lines, shipped a production MCP agent, and scoped a second agent for sales intelligence. I believe PMs should build things, not just describe them.",
    "I've read Rory Sutherland's Alchemy four times. I've been a Wealthsimple user since 2017. I care about the behavioural layer underneath every product decision as much as the system design above it.",
    "I'm currently exploring my next PM role — open to security, infrastructure, growth, and fintech platforms.",
  ],
};

export const experience = [
  {
    title: "Product Manager",
    company: "Cloudflare",
    period: "Feb 2024 – Jan 2026",
    area: "DNS Security & Secure Web Gateway · Zero Trust Platform",
    highlights: [
      "Grew DNS Filtering ARR 2.3× in under two years, scaling from ~35B to 60–80B requests/day",
      "Delivered FedRAMP High compliance uplift across multiple product lines",
      "Sponsored $4.6M TCV in enterprise deals across enterprise, government, and Fortune 500 accounts",
      "Shipped a production AI agent (MCP knowledge base) highlighted by senior leadership; scoped and architected a second for real-time sales intelligence",
      "Leader & Top Innovator — 2026 GigaOm DNS Security Radar; launched 2026 ISP & channel sales play",
      "Identified upstream identity bottleneck — surfaced retry storm risk across 10–15 platform-impacting incidents",
      "Owned all customer-facing incident comms protecting a $750K ACV DNS reseller processing billions of daily queries",
    ],
  },
  {
    title: "Co-founder & Head of Product",
    company: "Neat",
    period: "May 2020 – Jan 2024",
    area: "Developer SaaS · Product-led Growth · Side Venture",
    highlights: [
      "Grew to 3.96K+ DAUs with a 10× increase in user engagement",
      "62% increase in product usage via product-led GTM strategy",
      "5× improvement in retention through data-informed feature prioritization",
      "$120K+ in development services revenue",
    ],
  },
  {
    title: "Senior Consultant, Risk Assurance",
    company: "PwC Canada",
    period: "Sept 2020 – Feb 2023",
    area: "Cybersecurity · Enterprise Risk",
    highlights: [
      "Led 5-person cross-functional team delivering cybersecurity assessments for 9 enterprise clients in financial services and critical infrastructure",
      ">80% on-time delivery across engagements",
      "$360K in annual savings through compliance automation across multi-million-dollar client programmes",
    ],
  },
];

// Case studies — each one becomes a full page at /work/:slug
export const caseStudies = [
  {
    slug: "dns-security-cloudflare",
    title: "Scaling DNS Security from $7M to $16M ARR",
    company: "Cloudflare",
    period: "2024–2026",
    tags: ["Security", "Platform", "Enterprise", "Zero Trust"],
    summary:
      "How I owned the full product lifecycle of Cloudflare's DNS Filtering platform — growing ARR 2.3×, scaling to 60–80B daily events, delivering FedRAMP High compliance, and closing $4.6M in named enterprise deals.",
    problem:
      "DNS Filtering was a 2-year-old product with strong early traction but growing technical debt, fragile enterprise relationships, and untapped platform potential within the Zero Trust architecture.",
    role: "I owned product vision, roadmap, customer relationships, and GTM for the entire DNS Security and Secure Web Gateway surface — spanning L3–L7 traffic inspection, threat intelligence, policy engines, and identity-aware filtering.",
    approach: [
      "Prioritised the architectural debt items that were blocking enterprise deals and causing customer churn risk, before shipping net-new features.",
      "Built cross-platform features (like Source Internal IP filtering via Magic WAN tunnels) that no competitor could easily replicate.",
      "Turned internal security expertise into customer-facing capabilities — CNAME chain filtering, EDNS request context categories, non-auth DNS filtering.",
      "Delivered FedRAMP High compliance uplift for Secure Web Gateway and DNS Filtering — driving product, policy, legal, and engineering workstreams to unlock regulated government and enterprise accounts.",
      "Authored the internal memo that led to hiring a TAM and 3 threat intelligence analysts, turning a reactive customer support function into a scalable product motion.",
    ],
    outcomes: [
      "ARR grew 2.3× in under two years",
      "Daily Gateway DNS volume: ~35B → 60–80B requests/day",
      "$4.6M TCV in enterprise deals sponsored as primary PM",
      "Delivered FedRAMP High compliance uplift across multiple product lines",
      "Launched 2026 ISP and channel sales play, cementing product as the Zero Trust platform anchor",
      "Leader & Top Innovator — 2026 GigaOm DNS Security Radar",
    ],
    learnings:
      "The biggest leverage in platform PM isn't the features — it's identifying the architectural constraints that silently cap your growth ceiling. The upstream identity processing bottleneck I surfaced affected reliability, throughput, and customer trust simultaneously. Fixing the frame of the problem matters more than shipping fast.",
  },
  {
    slug: "ai-agents-cloudflare",
    title: "Building AI Agents to Accelerate Product Workflows",
    company: "Cloudflare",
    period: "2025–2026",
    tags: ["AI", "MCP", "Agents", "Internal Tools"],
    summary:
      "I shipped a production AI agent using MCP servers — a knowledge base agent indexing internal wikis and codebases, highlighted by senior leadership as a flagship example. I also scoped and architected a second agent for real-time sales intelligence.",
    problem:
      "PM and engineering teams were losing hours to cross-platform technical questions that spanned multiple products, codebases, and wikis. Sales teams needed faster, richer account context before customer conversations.",
    role: "Self-initiated. Scoped, built, and deployed the knowledge agent independently. Scoped and architected the sales intelligence agent in detail before departure.",
    approach: [
      "Knowledge agent: indexed Cloudflare's internal wiki, GitLab codebase, Backstage API catalogue, and architecture reference docs to answer cross-platform technical questions via streaming LLM responses.",
      "Sales intelligence agent (scoped, not shipped): designed to pull customer data from internal CRM, usage metrics from Grafana, and market signals to produce real-time account briefs on demand.",
      "Both agents used MCP servers and LLM connectors, accessible to non-technical teams via simple interfaces.",
    ],
    outcomes: [
      "Production AI agent adopted across PM and engineering for cross-platform research",
      "Scoped second agent validated by senior technical leadership as a flagship internal tooling example",
      "Demonstrated that PMs can ship internal AI tooling without dedicated engineering support",
    ],
    learnings:
      "The hardest part wasn't the LLM integration — it was understanding which data sources to connect and how to structure the context window for each use case. The knowledge agent needed depth and freshness simultaneously. Data quality and retrieval design matter more than model choice.",
  },
  {
    slug: "neat-product-led-growth",
    title: "Product-Led Growth at a Co-founded Developer Tool",
    company: "Neat",
    period: "2020–2024",
    tags: ["Growth", "PLG", "Developer Tools", "SaaS"],
    summary:
      "Co-founded Neat, a GitHub notifications manager for developers. Grew it to 3.96K+ DAUs through product-led growth, behavioural design, and referral mechanics — alongside full-time roles.",
    problem:
      "Developer tools are notoriously hard to grow — users are skeptical of marketing, churn fast if value isn't immediate, and rarely refer friends unless the product is genuinely useful.",
    role: "Head of Product, co-founder. Owned strategy, roadmap, GTM, developer relations, and API integrations.",
    approach: [
      "Applied Rory Sutherland's reframing ideas from Alchemy to product positioning — focusing on reducing anxiety and cognitive load rather than feature volume.",
      "Designed referral and onboarding flows around behavioural nudges rather than conversion rate optimisation alone.",
      "Completed API integrations with GitHub and Linear to deepen utility and stickiness.",
    ],
    outcomes: [
      "10× increase in user engagement",
      "5× improvement in retention",
      "62% increase in product usage post-GTM strategy",
      "$120K+ in development services revenue from SMB customers",
    ],
    learnings:
      "Developer tools live or die on time-to-value. Every friction point in the first 10 minutes is an existential threat. We spent more time on the first-run experience than on any individual feature — and it showed in retention.",
  },
];

export const skills = [
  "Platform & Systems Thinking",
  "0→1 Product Delivery",
  "Zero Trust / Network Security",
  "FedRAMP & Regulatory Compliance",
  "Threat Intelligence Productization",
  "Product-led Growth",
  "Behavioural Product Design",
  "Enterprise GTM",
  "Cross-functional Leadership",
  "Incident Leadership & Comms",
  "AI Agent Design (MCP / LLMs)",
  "Analyst Relations",
  "Grafana · BigQuery · SQL",
  "Amplitude",
  "Salesforce",
  "API & Systems Design",
];

export const education = [
  {
    degree: "B.Eng. Chemical Engineering",
    school: "McGill University, Montreal",
    period: "2014–2019",
  },
];

export const courses = [
  "Complete SQL Bootcamp — Udemy",
  "Business Analytics — Udacity",
];
