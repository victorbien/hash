export type NavItem = {
  label: string
  href: string
}

export const navItems: NavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Resources', href: '/resources' },
  { label: 'History', href: '/history' },
  { label: 'Volunteer', href: '/volunteer' },
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
  { year: '2015', title: 'HASH is established', description: 'Community advocates establish HASH to expand access to HIV prevention, treatment, care, and support in the Philippines.' },
  { year: '2015–2017', title: 'Community-Based Screening guidelines take shape', description: 'With UNAIDS and the Health Action Information Network (HAIN), HASH works with stakeholders to develop Community-Based Screening (CBS) operating guidelines and a training manual, leading to a pilot in the Philippines.' },
  { year: '2016', title: 'Learning and advocacy at the International AIDS Conference', description: 'HASH’s Executive Director attends the conference in Durban, South Africa. The experience of community-based screening in other countries informs HASH’s advocacy for more community-based programmes.' },
  { year: '2018', title: 'Community-Based Screening rolls out', description: 'CBS becomes a key programme under the Global Fund and Save the Children. HASH reports training more than 60 new trainers and more than 200 CBS motivators during the year.' },
  { year: '2018', title: 'Greater Manila Area CBS pilot launches', description: 'HASH pilots community-based screening to reach people who may be reluctant to visit clinics, while beginning to recruit volunteers.' },
  { year: '2018', title: 'HASH joins the International AIDS Conference in Amsterdam', description: 'HASH’s Executive Director attends the conference in the Netherlands, connecting the organisation with international HIV response discussions.' },
  { year: '2018–2019', title: 'Community partner for the Global Fund response in NCR', description: 'HASH conducts community-based screening in the National Capital Region under a Global Fund partnership with LoveYourself.' },
  { year: '2019', title: 'Community outreach receives international attention', description: 'Founder Desi Andrew Ching is featured by The Wall Street Journal for using dating apps to connect with young people and offer discreet HIV screening.' },
  { year: '2019', title: 'Community-Based Screening receives a Ripple Award', description: 'HASH’s CBS programme is recognised with the Ripple Award’s “Project of the Year” for its grassroots approach.' },
  { year: '2020', title: 'New CBS motivators join the response', description: 'Shortly before COVID-19 restrictions, HASH trains two batches of CBS motivators at the Cocoon Hotel. The trained volunteers later contribute to HASH’s operations and communications.' },
  { year: '2020', title: 'Project HEAD delivers ARVs during lockdowns', description: 'HASH launches the HASH Emergency ARV Delivery response to help clients receive antiretroviral medication during COVID-19 lockdowns.' },
  { year: '2020', title: '#HASHOnline brings HIV education to digital spaces', description: 'With in-person activities restricted, HASH hosts online sessions on HIV 101, SOGIE, and mental health, and moves CBS training to virtual platforms.' },
  { year: '2021', title: 'Pop-up testing reaches community venues', description: 'During the pandemic, HASH brings pop-up HIV awareness and testing events to venues frequented by men who have sex with men, beginning with partner venues in Metro Manila.' },
  { year: '2021', title: 'HASH takes part in an APCASO–APCRG scoping exercise', description: 'HASH participates in a regional scoping exercise with APCASO and APCRG.' },
  { year: '2022', title: 'Community-led monitoring is launched', description: 'HASH, ACHIEVE, and TLF SHARE launch a community-led monitoring platform at a World AIDS Day commemoration at Quezon City Hall.' },
  { year: '2022', title: 'Civil society partners build knowledge of RA 11166', description: 'Through an APCASO capacity-building initiative, 40 individuals receive training on the Philippine HIV and AIDS Policy Act (RA 11166), and 10 civil society organisations are engaged to share the learning with their communities.' },
  { year: '2022', title: 'Regional demand generation work begins', description: 'HASH contributes to an APCOM and DFAT regional project to increase condom and lubricant demand and access for men who have sex with men, including young MSM, through civil society mapping and messaging.' },
  { year: '2022', title: 'HASH attends the International AIDS Conference in Montreal', description: 'HASH representatives Ching, Aremm Castrillo, and Alfred Pecayo attend the conference in Canada.' },
  { year: '2023–2026', title: 'Community-led monitoring develops across the Philippines', description: 'HASH participates with civil society leads TLF SHARE and ACHIEVE in conceptualising and piloting community-led monitoring in the Philippines.' },
  { year: '2023', title: 'Prevention packs support regional outreach', description: 'As part of an APCOM and DFAT initiative, HASH contributes to demand generation and distributes prevention packs with novelty items.' },
  { year: '2023', title: 'Community members train for CBS in Eastern Samar', description: 'With support from the TELUS Community Board, HASH trains more than 25 community members in Community-Based Screening during San Julian Pride in Borongan, Eastern Samar.' },
  { year: '2024', title: 'HASH presents community research in Lima', description: 'HASH travels to Lima, Peru, for a poster presentation at the International AIDS Conference and takes part in a ViiV community meeting.' },
  { year: '2024', title: 'Hakdaw Kabataan brings testing and PrEP to barangays', description: 'In August, HASH, the Quezon City SK Federation, and UNAIDS launch Hakdaw Kabataan, supporting Sangguniang Kabataan leaders to become CBS motivators and offer free HIV testing and PrEP in their barangays.' },
  { year: '2024', title: 'Quezon City community screening partnership sets reach targets', description: 'A project with ACHIEVE and DFAT sets a target of reaching 1,500 key-population individuals through CBS across Quezon City and engaging at least 20 barangay units. These are project targets, not reported completion figures.' },
  { year: '2024', title: 'Pride month event promotes free HIV screening and PrEP', description: 'HASH partners in a free HIV screening and PrEP event at the Quezon City Hall Compound during the city’s Pride month celebrations in June.' },
  { year: '2024', title: 'TALA partnership brings HIV education to students', description: 'HASH partners with TALA to deliver HIV awareness seminars, screening, and counselling. FEU High School students also donate CBS supplies for volunteers.' },
  { year: '2024–2025', title: 'Digital engagement expands through CODE', description: 'With the Elton John AIDS Foundation and APCOM, HASH works on community-led online and digital engagement, including mobilisation, CBS and self-testing support, TESTMNL, task-force formation, and community feedback on an APCOM survey app.' },
  { year: '2024–2025', title: 'Harm-reduction outreach and peer capacity building', description: 'An NCR initiative with the Asia Pacific Network and Positive Action Foundation includes chemsex outreach and capacity building for peer educators and CBS motivators on chemsex, community support, and mental health.' },
  { year: '2025', title: 'Testing and PrEP partnerships continue', description: 'HASH reports conducting several HIV testing and PrEP event partnerships with the Court of Appeals.' },
  { year: '2024–2027', title: 'Strategic initiatives continue', description: 'HASH’s wider strategic work includes youth leadership, workplace HIV policy, harm reduction, and community-led monitoring.' },
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
