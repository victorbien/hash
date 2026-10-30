update public.cms_content
set title = '2015–2017: Community-Based Screening guidelines take shape',
    body = 'With UNAIDS and the Health Actions Initiative Network (HAIN), HASH worked with stakeholders to develop Community-Based Screening (CBS) operating guidelines and a training manual, leading to a pilot in the Philippines.',
    display_order = 1
where content_type = 'about'
  and slug = 'community-based-screening'
  and body = 'Pioneered Community-Based HIV Screening (CBS) as part of a practical, localised prevention and testing model.';

update public.cms_content
set title = '2018: Community-Based Screening rolls out',
    body = 'CBS became a key programme under the Global Fund and Save the Children. HASH reports training more than 60 new trainers and more than 200 CBS motivators during the year.',
    display_order = 3
where content_type = 'about'
  and slug = 'community-care-pathways'
  and body = 'Built community case management, self-testing distribution, and PrEP support pathways.';

update public.cms_content
set display_order = 0
where content_type = 'about'
  and slug = 'founded-in-2015';

update public.cms_content
set display_order = 29
where content_type = 'about'
  and slug = 'strategic-initiatives-2024-2027'
  and body = 'Continued partnerships and strategic initiatives from 2024–2027 in youth leadership, workplace HIV policy, and community-led monitoring.';

insert into public.cms_content (
  content_type, title, slug, summary, body, category, status, display_order, featured
)
values
  ('about', '2016: Learning and advocacy at the International AIDS Conference', 'history-2016-international-aids-conference', '', 'HASH’s Executive Director attended the conference in Durban, South Africa. Learning about community-based screening in other countries informed HASH’s advocacy for more community-based programmes.', 'Key milestones', 'published', 2, false),
  ('about', '2018: Greater Manila Area CBS pilot launches', 'history-2018-greater-manila-cbs-pilot', '', 'HASH piloted community-based screening to reach people who may be reluctant to visit clinics, while beginning to recruit volunteers.', 'Key milestones', 'published', 4, false),
  ('about', '2018: HASH joins the International AIDS Conference in Amsterdam', 'history-2018-international-aids-conference', '', 'HASH’s Executive Director attended the conference in the Netherlands, connecting the organisation with international HIV response discussions.', 'Key milestones', 'published', 5, false),
  ('about', '2018–2019: Community partner for the Global Fund response in NCR', 'history-2018-2019-global-fund-ncr', '', 'HASH conducted community-based screening in the National Capital Region under a Global Fund partnership with LoveYourself.', 'Key milestones', 'published', 6, false),
  ('about', '2019: Community outreach receives international attention', 'history-2019-wall-street-journal-feature', '', 'Founder Desi Andrew Ching was featured by The Wall Street Journal for using dating apps to connect with young people and offer discreet HIV screening.', 'Key milestones', 'published', 7, false),
  ('about', '2019: Community-Based Screening receives a Ripple Award', 'history-2019-ripple-award', '', 'HASH’s Community-Based Screening programme received the Ripple Award’s “Project of the Year” recognition for its grassroots approach.', 'Key milestones', 'published', 8, false),
  ('about', '2020: New CBS motivators join the response', 'history-2020-cbs-motivator-training', '', 'Shortly before COVID-19 restrictions, HASH trained two batches of CBS motivators at the Cocoon Hotel. The trained volunteers later contributed to HASH’s operations and communications.', 'Key milestones', 'published', 9, false),
  ('about', '2020: Project HEAD delivers ARVs during lockdowns', 'history-2020-project-head-arv-delivery', '', 'HASH launched the HASH Emergency ARV Delivery response to help clients receive antiretroviral medication during COVID-19 lockdowns.', 'Key milestones', 'published', 10, false),
  ('about', '2020: #HASHOnline brings HIV education to digital spaces', 'history-2020-hashonline', '', 'With in-person activities restricted, HASH hosted online sessions on HIV 101, SOGIE, and mental health, and moved CBS training to virtual platforms.', 'Key milestones', 'published', 11, false),
  ('about', '2021: Pop-up testing reaches community venues', 'history-2021-pop-up-community-testing', '', 'During the pandemic, HASH brought pop-up HIV awareness and testing events to venues frequented by men who have sex with men, beginning with partner venues in Metro Manila.', 'Key milestones', 'published', 12, false),
  ('about', '2021: HASH takes part in an APCASO–APCRG scoping exercise', 'history-2021-apcaso-apcrg-scoping', '', 'HASH participated in a regional scoping exercise with APCASO and APCRG.', 'Key milestones', 'published', 13, false),
  ('about', '2022: Community-led monitoring is launched', 'history-2022-clm-launch', '', 'HASH, ACHIEVE, and TLF SHARE launched a community-led monitoring platform at a World AIDS Day commemoration at Quezon City Hall.', 'Key milestones', 'published', 14, false),
  ('about', '2022: Civil society partners build knowledge of RA 11166', 'history-2022-ra11166-capacity-building', '', 'Through an APCASO capacity-building initiative, 40 individuals received training on the Philippine HIV and AIDS Policy Act (RA 11166), and 10 civil society organisations were engaged to share the learning with their communities.', 'Key milestones', 'published', 15, false),
  ('about', '2022: Regional demand generation work begins', 'history-2022-apcom-dfat-demand-generation', '', 'HASH contributed to an APCOM and DFAT regional project to increase condom and lubricant demand and access for men who have sex with men, including young MSM, through civil society mapping and messaging.', 'Key milestones', 'published', 16, false),
  ('about', '2022: HASH attends the International AIDS Conference in Montreal', 'history-2022-international-aids-conference', '', 'HASH representatives Ching, Aremm Castrillo, and Alfred Pecayo attended the conference in Canada.', 'Key milestones', 'published', 17, false),
  ('about', '2023–2026: Community-led monitoring develops across the Philippines', 'history-2023-2026-community-led-monitoring', '', 'HASH participated with civil society leads TLF SHARE and ACHIEVE in conceptualising and piloting community-led monitoring in the Philippines.', 'Key milestones', 'published', 18, false),
  ('about', '2023: Prevention packs support regional outreach', 'history-2023-prevention-packs', '', 'As part of an APCOM and DFAT initiative, HASH contributed to demand generation and distributed prevention packs with novelty items.', 'Key milestones', 'published', 19, false),
  ('about', '2023: Community members train for CBS in Eastern Samar', 'history-2023-san-julian-pride-training', '', 'With support from the TELUS Community Board, HASH trained more than 25 community members in Community-Based Screening during San Julian Pride in Borongan, Eastern Samar.', 'Key milestones', 'published', 20, false),
  ('about', '2024: HASH presents community research in Lima', 'history-2024-international-aids-conference', '', 'HASH travelled to Lima, Peru, for a poster presentation at the International AIDS Conference and took part in a ViiV community meeting.', 'Key milestones', 'published', 21, false),
  ('about', '2024: Hakdaw Kabataan brings testing and PrEP to barangays', 'history-2024-hakdaw-kabataan', '', 'In August, HASH, the Quezon City SK Federation, and UNAIDS launched Hakdaw Kabataan, supporting Sangguniang Kabataan leaders to become CBS motivators and offer free HIV testing and PrEP in their barangays.', 'Key milestones', 'published', 22, false),
  ('about', '2024: Quezon City community screening partnership sets reach targets', 'history-2024-quezon-city-screening-targets', '', 'A project with ACHIEVE and DFAT set a target of reaching 1,500 key-population individuals through CBS across Quezon City and engaging at least 20 barangay units. These are project targets, not reported completion figures.', 'Key milestones', 'published', 23, false),
  ('about', '2024: Pride month event promotes free HIV screening and PrEP', 'history-2024-quezon-city-pride-prep', '', 'HASH partnered in a free HIV screening and PrEP event at the Quezon City Hall Compound during the city’s Pride month celebrations in June.', 'Key milestones', 'published', 24, false),
  ('about', '2024: TALA partnership brings HIV education to students', 'history-2024-tala-partnership', '', 'HASH partnered with TALA to deliver HIV awareness seminars, screening, and counselling. FEU High School students also donated CBS supplies for volunteers.', 'Key milestones', 'published', 25, false),
  ('about', '2024–2025: Digital engagement expands through CODE', 'history-2024-2025-code-digital-engagement', '', 'With the Elton John AIDS Foundation and APCOM, HASH worked on community-led online and digital engagement, including mobilisation, CBS and self-testing support, TESTMNL, task-force formation, and community feedback on an APCOM survey app.', 'Key milestones', 'published', 26, false),
  ('about', '2024–2025: Harm-reduction outreach and peer capacity building', 'history-2024-2025-harm-reduction', '', 'An NCR initiative with the Asia Pacific Network and Positive Action Foundation included chemsex outreach and capacity building for peer educators and CBS motivators on chemsex, community support, and mental health.', 'Key milestones', 'published', 27, false),
  ('about', '2025: Testing and PrEP partnerships continue', 'history-2025-court-of-appeals-partnership', '', 'HASH reported conducting several HIV testing and PrEP event partnerships with the Court of Appeals.', 'Key milestones', 'published', 28, false)
on conflict (content_type, slug) do nothing;
