export const institutions = [
  {
    id: 'harborview', slug: 'harborview-university', name: 'Harborview University', type: 'University', city: 'Portland', state: 'Oregon', country: 'United States', rating: 4.8, reviews: 214, price: 32000, fee: '$32,000 / year', badge: 'Top rated', palette: 'harbor',
    description: 'A collaborative urban university known for applied research, studio learning, and close faculty mentorship.', history: 'Established in 1968, Harborview grew from a small coastal science college into a multidisciplinary university.', courses: ['Computer Science', 'Business', 'Environmental Science', 'Design'], departments: ['School of Computing', 'School of Business', 'College of Arts'], facilities: ['Library', 'Computer labs', 'Sports', 'Accessibility', 'Internet'], admissions: 'Applications open September through January. Portfolio required for selected design programs.', website: 'harborview.example.edu', phone: '+1 503 555 0147', email: 'admissions@harborview.example.edu',
    breakdown: { Teaching: 4.8, Infrastructure: 4.7, Faculty: 4.9, Administration: 4.3, 'Value for money': 4.5 },
    reviewsList: [
      { name: 'Maya R.', program: 'Computer Science · Class of 2025', rating: 5, date: '2 weeks ago', text: 'The project-based classes made it easy to build confidence. Office hours were genuinely useful, and the learning spaces stayed open late.' },
      { name: 'Jordan L.', program: 'Business · Class of 2024', rating: 4, date: '1 month ago', text: 'Strong community and thoughtful career support. I would have liked clearer administrative timelines during registration.' },
    ],
  },
  {
    id: 'northstar', slug: 'northstar-community-college', name: 'Northstar Community College', type: 'College', city: 'Madison', state: 'Wisconsin', country: 'United States', rating: 4.6, reviews: 168, price: 9800, fee: '$9,800 / year', badge: 'Great value', palette: 'northstar',
    description: 'Flexible pathways, practical programs, and transfer support for learners at every stage.', history: 'Northstar has served its regional community since 1979 through career-focused and transfer-ready programs.', courses: ['Nursing', 'Digital Marketing', 'Cybersecurity', 'Early Childhood Education'], departments: ['Health Sciences', 'Applied Technology', 'Liberal Arts'], facilities: ['Library', 'Laboratories', 'Cafeteria', 'Transport', 'Internet'], admissions: 'Rolling admissions with programme-specific health and placement requirements.', website: 'northstar.example.edu', phone: '+1 608 555 0198', email: 'hello@northstar.example.edu',
    breakdown: { Teaching: 4.6, Infrastructure: 4.4, Faculty: 4.8, Administration: 4.4, 'Value for money': 4.9 }, reviewsList: [{ name: 'Avery S.', program: 'Nursing · Class of 2025', rating: 5, date: '3 weeks ago', text: 'Simulation labs and instructors helped bridge classroom learning and placement. The transfer advisers were very responsive.' }],
  },
  {
    id: 'cedar-grove', slug: 'cedar-grove-academy', name: 'Cedar Grove Academy', type: 'School', city: 'Boulder', state: 'Colorado', country: 'United States', rating: 4.7, reviews: 93, price: 18400, fee: '$18,400 / year', badge: 'Family favorite', palette: 'cedar',
    description: 'A welcoming K–12 school balancing strong academics, outdoor learning, and student wellbeing.', history: 'Founded by local educators in 1992, Cedar Grove remains an independently run learning community.', courses: ['STEM', 'Visual Arts', 'World Languages', 'Athletics'], departments: ['Lower School', 'Middle School', 'Upper School'], facilities: ['Library', 'Classrooms', 'Sports', 'Cafeteria', 'Accessibility'], admissions: 'Family interviews and campus visits are offered throughout the academic year.', website: 'cedargrove.example.edu', phone: '+1 303 555 0182', email: 'admissions@cedargrove.example.edu',
    breakdown: { Teaching: 4.8, Infrastructure: 4.5, Faculty: 4.9, Administration: 4.5, 'Value for money': 4.4 }, reviewsList: [{ name: 'Priya K.', program: 'Parent · Upper School', rating: 5, date: '1 month ago', text: 'Teachers know our child well and communicate clearly. The outdoor programme is a real highlight of the school year.' }],
  },
  {
    id: 'summit', slug: 'summit-institute-of-design', name: 'Summit Institute of Design', type: 'College', city: 'Seattle', state: 'Washington', country: 'United States', rating: 4.5, reviews: 76, price: 28700, fee: '$28,700 / year', badge: 'Creative campus', palette: 'summit',
    description: 'A studio-led design institute where creative practice connects directly with real client briefs.', history: 'Summit opened in 2004 to make contemporary design education more connected to industry.', courses: ['UX Design', 'Architecture', 'Illustration', 'Product Design'], departments: ['Visual Communication', 'Built Environment', 'Interaction Design'], facilities: ['Studios', 'Computer labs', 'Library', 'Cafeteria', 'Internet'], admissions: 'Portfolio review is required. Virtual information sessions are available monthly.', website: 'summit.example.edu', phone: '+1 206 555 0131', email: 'apply@summit.example.edu',
    breakdown: { Teaching: 4.7, Infrastructure: 4.6, Faculty: 4.7, Administration: 4.0, 'Value for money': 4.2 }, reviewsList: [{ name: 'Leo M.', program: 'Product Design · Class of 2024', rating: 4, date: '2 months ago', text: 'The studio culture is intense in a good way. Critiques are practical and the workshops have the tools you need.' }],
  },
  {
    id: 'greenfield', slug: 'greenfield-polytechnic', name: 'Greenfield Polytechnic', type: 'College', city: 'Austin', state: 'Texas', country: 'United States', rating: 4.4, reviews: 122, price: 15600, fee: '$15,600 / year', badge: 'Recently added', palette: 'greenfield',
    description: 'Career-ready technical education with hands-on labs, industry certificates, and evening options.', history: 'Greenfield Polytechnic was established in 1987 and expanded into sustainable technology programmes in 2017.', courses: ['Renewable Energy', 'Data Analytics', 'Robotics', 'Construction Management'], departments: ['Engineering Technologies', 'Digital Systems', 'Workforce Learning'], facilities: ['Laboratories', 'Computer labs', 'Transport', 'Cafeteria', 'Internet'], admissions: 'Programmes admit in autumn and spring; prior learning assessment is available.', website: 'greenfield.example.edu', phone: '+1 512 555 0125', email: 'connect@greenfield.example.edu',
    breakdown: { Teaching: 4.5, Infrastructure: 4.5, Faculty: 4.6, Administration: 4.1, 'Value for money': 4.6 }, reviewsList: [{ name: 'Sam T.', program: 'Data Analytics · Class of 2025', rating: 4, date: '3 months ago', text: 'The labs are current and instructors bring useful industry context. Evening classes made study manageable alongside work.' }],
  },
]

export const categories = [
  { label: 'Schools', count: '1,200+', icon: 'GraduationCap' }, { label: 'Colleges', count: '850+', icon: 'Building2' }, { label: 'Universities', count: '430+', icon: 'Landmark' }, { label: 'Courses', count: '4,500+', icon: 'BookOpen' },
]

export const getInstitution = (slug) => institutions.find((item) => item.slug === slug) || institutions[0]
