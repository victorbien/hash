insert into public.cms_content (
  content_type, title, slug, summary, body, category, status, display_order, featured
)
values
  ('home', 'Compassionate HIV support rooted in community care.', 'hero', 'HASH works to make HIV prevention, testing, treatment linkage, and support more accessible, stigma-free, and human-centered for people across the Philippines.', '', 'Homepage', 'published', 0, true),
  ('home', 'Who we are', 'who-we-are', 'A community-based organisation working for better HIV outcomes.', 'HASH brings together prevention, testing, treatment linkage, community support, and advocacy to make care more accessible and more humane.', 'Homepage', 'published', 1, false),
  ('home', 'Founded', 'founded', '2015', 'Community-led response', 'Quick fact', 'published', 2, false),
  ('home', 'Programs', 'programs', 'HIV prevention, testing & support', 'Rooted in community care', 'Quick fact', 'published', 3, false),
  ('home', 'Reach', 'reach', 'Philippines-wide', 'Local and digital outreach', 'Quick fact', 'published', 4, false),
  ('home', 'Approach', 'approach', 'Stigma-free', 'People-centred care', 'Quick fact', 'published', 5, false),
  ('home', 'Why HASH', 'why-hash', 'Evidence-informed, community-led, and deeply human.', 'HASH combines grassroots trust with practical, organised care pathways to support communities affected by HIV and related health challenges.', 'Homepage', 'published', 6, false),
  ('home', 'Prevention', 'prevention', '', 'HASH promotes HIV prevention through community education, prevention programmes, screening, and access to PrEP and self-testing support.', 'Homepage', 'published', 7, false),
  ('home', 'Care', 'care', '', 'The organisation links people to treatment and care, while building systems that help communities navigate support more confidently.', 'Homepage', 'published', 8, false),
  ('home', 'Advocacy', 'advocacy', '', 'HASH works with partners, leaders, and communities to strengthen HIV awareness, policy, and accountability across settings.', 'Homepage', 'published', 9, false),
  ('about', 'Mission', 'mission', '', 'HASH works to ensure that people affected by HIV have access to quality, stigma-free, community-centered services. The organisation focuses on prevention, testing, treatment linkage, PrEP, HIV self-testing, youth engagement, workplace HIV policies, harm reduction, community-led monitoring, digital health, and advocacy.', 'About HASH', 'published', 0, false),
  ('about', 'Approach', 'approach', '', 'HASH takes a community-led, people-centered approach to HIV care. It combines service delivery with education, outreach, and partnership-building to reduce barriers and strengthen trust for the people it serves.', 'About HASH', 'published', 1, false),
  ('about', 'Founded in 2015', 'founded-in-2015', '', 'Founded in 2015 by community advocates committed to improving HIV response in the Philippines.', 'Key milestones', 'published', 2, false),
  ('about', 'Community-based screening', 'community-based-screening', '', 'Pioneered Community-Based HIV Screening (CBS) as part of a practical, localised prevention and testing model.', 'Key milestones', 'published', 3, false),
  ('about', 'Community care pathways', 'community-care-pathways', '', 'Built community case management, self-testing distribution, and PrEP support pathways.', 'Key milestones', 'published', 4, false),
  ('about', 'Strategic initiatives, 2024–2027', 'strategic-initiatives-2024-2027', '', 'Continued partnerships and strategic initiatives from 2024–2027 in youth leadership, workplace HIV policy, and community-led monitoring.', 'Key milestones', 'published', 5, false),
  ('service', 'Community-Based HIV Screening', 'community-based-hiv-screening', 'Accessible HIV screening delivered by trained community advocates and volunteers in local settings.', '', 'HIV services', 'published', 0, true),
  ('service', 'PrEP & e-PrEP', 'prep-e-prep', 'Support for PrEP access, education, and community-led initiation models to reduce barriers to prevention.', '', 'HIV prevention', 'published', 1, true),
  ('service', 'HIV Self-Testing', 'hiv-self-testing', 'Confidential and stigma-free self-testing distribution with linkage support for follow-up care.', '', 'HIV prevention', 'published', 2, true),
  ('service', 'Case Management', 'case-management', 'Follow-up support for treatment, wellness, and connection to services for people living with HIV and those at risk.', '', 'Care and support', 'published', 3, true),
  ('resource', 'HASH HIV 101', 'hash-hiv-101', 'Plain-language educational content explaining HIV basics, transmission, prevention, and common questions.', '', 'Education', 'published', 0, true),
  ('resource', '2025 Annual Report', '2025-annual-report', 'A snapshot of HASH’s programmes, partnerships, and service delivery progress.', '', 'Report', 'draft', 1, false),
  ('resource', 'Training Materials', 'training-materials', 'Resources covering community screening, motivational dialogue, and workplace HIV education.', '', 'Training', 'draft', 2, false),
  ('volunteer', 'How volunteers contribute', 'how-volunteers-contribute', 'HASH describes its work as community-led, with community advocates and volunteers contributing to accessible services and education. Specific volunteer assignments and eligibility are confirmed by HASH.', '', 'Volunteer information', 'published', 0, false),
  ('home', 'Impact figures — approval required', 'impact-figures-review', 'CBS Motivators trained: 1,400+; Community Case Managers trained: 500+; Key population members reached: 35,000+; Linked to treatment: 3,000+.', 'These figures were present in the prior website content and require HASH verification before publication.', 'Impact', 'draft', 10, false)
on conflict (content_type, slug) do nothing;
