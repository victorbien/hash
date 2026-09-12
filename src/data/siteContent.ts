export type NavItem = {
  label: string
  href: string
}

export const navItems: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Resources', href: '/resources' },
  { label: 'History', href: '/history' },
  { label: 'Get Involved', href: '/get-involved' },
  { label: 'Contact', href: '/contact' },
]

export const quickFacts = [
  { label: 'Founded', value: '2015', detail: 'Community-led response' },
  { label: 'Programs', value: 'HIV prevention, testing & support', detail: 'Rooted in community care' },
  { label: 'Reach', value: 'Philippines-wide', detail: 'Local and digital outreach' },
  { label: 'Approach', value: 'Stigma-free', detail: 'People-centred care' },
]

export const serviceHighlights = [
  {
    title: 'Community-Based HIV Screening',
    summary:
      'Accessible HIV screening delivered by trained community advocates and volunteers in local settings.',
    href: '/services#community-based-hiv-screening',
  },
  {
    title: 'PrEP & e-PrEP',
    summary:
      'Support for PrEP access, education, and community-led initiation models to reduce barriers to prevention.',
    href: '/services#prep',
  },
  {
    title: 'HIV Self-Testing',
    summary:
      'Confidential and stigma-free self-testing distribution with linkage support for follow-up care.',
    href: '/services#self-testing',
  },
  {
    title: 'Case Management',
    summary:
      'Follow-up support for treatment, wellness, and connection to services for people living with HIV and those at risk.',
    href: '/services#case-management',
  },
]

export const timelineEvents = [
  { year: '2015', title: 'HASH is established', description: 'A community-led organisation committed to expanding access to HIV prevention, treatment, care, and support in the Philippines.' },
  { year: '2018+', title: 'Community-based screening expands', description: 'HASH pioneers community-based HIV screening and builds practical service models for outreach and early detection.' },
  { year: '2020s', title: 'PrEP and self-testing scale up', description: 'The organisation expands community-led PrEP initiation, self-testing distribution, and digital support mechanisms.' },
  { year: '2024–2027', title: 'Strategic initiatives', description: 'HASH advances youth leadership, workplace HIV policy, harm reduction, and community-led monitoring initiatives.' },
]

export const resources = [
  {
    title: 'HASH HIV 101',
    description: 'Plain-language educational content explaining HIV basics, transmission, prevention, and common questions.',
    href: '/resources',
    type: 'Education',
  },
  {
    title: '2025 Annual Report',
    description: 'A snapshot of HASH’s programmes, partnerships, and service delivery progress.',
    href: '/resources',
    type: 'Report',
  },
  {
    title: 'Training Materials',
    description: 'Resources covering community screening, motivational dialogue, and workplace HIV education.',
    href: '/resources',
    type: 'Training',
  },
]

export const faqs = [
  {
    question: 'What does HASH do?',
    answer:
      'HASH works to improve access to HIV prevention, testing, treatment linkage, PrEP, self-testing, care, and community support in a stigma-free setting.',
  },
  {
    question: 'Who is HASH for?',
    answer:
      'HASH serves people affected by HIV, key populations, youth, partners, families, and communities across the Philippines, with a focus on accessible and community-centered care.',
  },
  {
    question: 'How can I get support?',
    answer:
      'You can connect with HASH through the contact page, outreach channels, or by reaching out via the organisation’s documented contact details and service pathways.',
  },
]

export const stats = [
  { value: '1,400+', label: 'CBS Motivators trained' },
  { value: '500+', label: 'Community Case Managers trained' },
  { value: '35,000+', label: 'Key population members reached' },
  { value: '3,000+', label: 'Linked to treatment' },
]
