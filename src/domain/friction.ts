export const STORAGE_KEY = 'friction_demo_v2';
const LEGACY_STORAGE_KEY = 'friction_demo_v1';

export const LOGO_FULL_SRC = '/assets/aistudio/WhatsApp_Image_2026-11-23_at_20.09.241_202111e5.jpeg';
export const LOGO_MARK_SRC = '/assets/aistudio/WhatsApp_Image_2026-11-23_at_20.09.24_0cac92e7.jpeg';

export interface DemoUser {
  id: string;
  name: string;
  role: 'student' | 'admin';
  department: string;
  rollNo: string;
  avatar: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'stu-1',
    name: 'Aarav Sharma',
    role: 'student',
    department: 'B.Tech Computer Science (3rd Year)',
    rollNo: '2024CS1042',
    avatar: 'AS'
  },
  {
    id: 'stu-2',
    name: 'Priya Nair',
    role: 'student',
    department: 'B.Tech Electronics & Comm. (2nd Year)',
    rollNo: '2025EC2018',
    avatar: 'PN'
  },
  {
    id: 'stu-3',
    name: 'Kabir Mehta',
    role: 'student',
    department: 'B.Tech Mechanical Eng. (4th Year)',
    rollNo: '2023ME3089',
    avatar: 'KM'
  },
  {
    id: 'admin-1',
    name: 'Dr. Meera Krishnan',
    role: 'admin',
    department: 'Dean of Student Facilities & Operations',
    rollNo: 'FAC-ADMIN-01',
    avatar: 'MK'
  }
];

export interface CampusBuilding {
  id: string;
  name: string;
  shortName: string;
  code: string;
  zone: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
}

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { id: 'cse-ece-block', name: 'CSE & ECE Block', shortName: 'CSE & ECE Block', code: 'BLD-CSE', zone: 'IGDTUW Campus', description: 'Computer Science and Electronics & Communication departments.', latitude: 28.6641876, longitude: 77.2324179 },
  { id: 'it-block', name: 'IT Block', shortName: 'IT Block', code: 'BLD-IT', zone: 'IGDTUW Campus', description: 'IT department block.', latitude: 28.6641949, longitude: 77.232487 },
  { id: 'computer-centre', name: 'Computer Centre', shortName: 'Computer Centre', code: 'BLD-CC', zone: 'IGDTUW Campus', description: 'Campus Computer Centre.', latitude: 28.6641628, longitude: 77.2330188 },
  { id: 'mechanical-block', name: 'Mechanical Block', shortName: 'Mechanical Block', code: 'BLD-MECH', zone: 'IGDTUW Campus', description: 'Mechanical Block.', latitude: 28.664706, longitude: 77.2330264 },
  { id: 'auditorium', name: 'Auditorium', shortName: 'Auditorium', code: 'BLD-AUD', zone: 'IGDTUW Campus', description: 'IGDTUW Auditorium.', latitude: 28.6649407, longitude: 77.2324634 },
  { id: 'admin-block', name: 'Administrative Building', shortName: 'Admin Building', code: 'BLD-ADM', zone: 'IGDTUW Campus', description: 'Administrative building with the seminar hall and the architecture department.', latitude: null, longitude: null },
  { id: 'kaveri-hostel', name: 'Kaveri Hostel', shortName: 'Kaveri Hostel', code: 'BLD-KAV', zone: 'IGDTUW Campus', description: 'Kaveri Hostel.', latitude: null, longitude: null },
  { id: 'krishna-hostel', name: 'Krishna Hostel', shortName: 'Krishna Hostel', code: 'BLD-KRI', zone: 'IGDTUW Campus', description: 'Krishna Hostel.', latitude: null, longitude: null },
  { id: 'canteen', name: 'Canteen', shortName: 'Canteen', code: 'BLD-CNT', zone: 'IGDTUW Campus', description: 'Student canteen.', latitude: null, longitude: null },
  { id: 'nescafe', name: 'Nescafe', shortName: 'Nescafe', code: 'BLD-NES', zone: 'IGDTUW Campus', description: 'Nescafe outlet.', latitude: null, longitude: null },
  { id: 'new-building', name: 'New Building', shortName: 'New Building', code: 'BLD-NEW', zone: 'IGDTUW Campus', description: 'New building.', latitude: null, longitude: null },
  { id: 'library', name: 'Library', shortName: 'Library', code: 'BLD-LIB', zone: 'IGDTUW Campus', description: 'Library.', latitude: null, longitude: null },
  { id: 'sports-complex', name: 'Sports Complex', shortName: 'Sports Complex', code: 'BLD-SPT', zone: 'IGDTUW Campus', description: 'Sports facilities.', latitude: null, longitude: null }
];

export const CATEGORIES = [
  { id: 'Wi-Fi and Connectivity', label: 'Wi-Fi & Connectivity', color: '#0B2559' },
  { id: 'Classroom Equipment', label: 'Classroom Equipment', color: '#009E96' },
  { id: 'Water and Sanitation', label: 'Water & Sanitation', color: '#0284C7' },
  { id: 'Infrastructure', label: 'Infrastructure', color: '#EA580C' },
  { id: 'Electricity and Charging', label: 'Electricity & Charging', color: '#EAB308' },
  { id: 'Seating and Facilities', label: 'Seating & Facilities', color: '#7C3AED' },
  { id: 'Accessibility', label: 'Accessibility', color: '#2563EB' },
  { id: 'Safety and Lighting', label: 'Safety & Lighting', color: '#DC2626' },
  { id: 'Other', label: 'Other', color: '#64748B' }
];

export const SEVERITY_LEVELS = [
  {
    value: 1,
    label: '1 — Minor Inconvenience',
    short: 'Minor Impact',
    description: 'Noticeable annoyance, but academic or daily work can continue with easy workarounds.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  {
    value: 2,
    label: '2 — Disruptive Issue',
    short: 'Disruptive',
    description: 'Significantly slows down classes, study sessions, or basic comfort for many students.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    value: 3,
    label: '3 — Critical Issue',
    short: 'Critical',
    description: 'Immediate safety hazard, accessibility barrier, or complete outage of essential utilities.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
  }
];

export const STATUS_META: Record<
  string,
  { label: string; description: string; badgeClass: string; color: string }
> = {
  Flagged: {
    label: 'Flagged',
    description: 'Multiple community flags; held for administrator review.',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
    color: '#7C3AED'
  },
  'Pending Review': {
    label: 'Pending Review',
    description: 'Submitted by student; awaiting initial verification by Campus Admin.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    color: '#D97706'
  },
  Published: {
    label: 'Published',
    description: 'Verified and live on the campus map for student confirmation & triage.',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    color: '#0284C7'
  },
  'In Progress': {
    label: 'In Progress',
    description: 'Assigned to maintenance/IT team; active repair work underway.',
    badgeClass: 'bg-brand-navy-soft text-brand-navy border-blue-200',
    color: '#0B2559'
  },
  Resolved: {
    label: 'Resolved',
    description: 'Issue fixed and verified by Campus Facilities.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    color: '#059669'
  },
  'Needs Clarification': {
    label: 'Needs Clarification',
    description: 'Admin requested exact room number, timing, or additional details from reporter.',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    color: '#EA580C'
  },
  Rejected: {
    label: 'Rejected',
    description: 'Declined by moderation (e.g., invalid report, off-campus, or unverified spam).',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    color: '#E11D48'
  }
};

export const ACCEPTED_STATUSES = ['Published', 'In Progress', 'Resolved'];

export interface PriorityMeta {
  tier: 'Critical' | 'High' | 'Medium' | 'Low';
  label: string;
  shortLabel: string;
  reason: string;
  badgeClass: string;
  barColor: string;
  textColor: string;
}

/**
 * Translates the internal ranking score (computed from independent reports, peer
 * confirmations, and severity) into a human-friendly Priority Tier for the UI.
 */
export function getPriorityMeta(internalScore: number, severity: number, confirmations = 0, reports = 1): PriorityMeta {
  const s = Number(severity) || 1;
  if (internalScore >= 12 || (s === 3 && internalScore >= 9)) {
    return {
      tier: 'Critical',
      label: 'Critical Priority',
      shortLabel: 'Critical',
      reason: `Urgent attention needed (${reports} ${reports === 1 ? 'report' : 'reports'} and ${confirmations} peer ${confirmations === 1 ? 'confirmation' : 'confirmations'} at critical severity).`,
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      barColor: '#E11D48',
      textColor: 'text-rose-700'
    };
  }
  if (internalScore >= 6 || s === 3) {
    return {
      tier: 'High',
      label: 'High Priority',
      shortLabel: 'High',
      reason: `Elevated priority driven by ${s === 3 ? 'critical impact level' : 'strong peer confirmation across campus'}.`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      barColor: '#D97706',
      textColor: 'text-amber-700'
    };
  }
  if (internalScore >= 3 || s === 2) {
    return {
      tier: 'Medium',
      label: 'Medium Priority',
      shortLabel: 'Medium',
      reason: 'Moderate ongoing disruption queued for scheduled facilities resolution.',
      badgeClass: 'bg-brand-teal-soft text-brand-teal-dark border-teal-200',
      barColor: '#009E96',
      textColor: 'text-brand-teal-dark'
    };
  }
  return {
    tier: 'Low',
    label: 'Low Priority',
    shortLabel: 'Low',
    reason: 'Localized or minor inconvenience with available workarounds.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    barColor: '#64748B',
    textColor: 'text-slate-600'
  };
}

export function getBuildingHotspotMeta(totalScore: number, activeCount: number) {
  if (activeCount === 0 || totalScore <= 0) {
    return {
      tier: 'Clear' as const,
      label: 'Clear',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      barClass: 'bg-slate-300',
      hex: '#94A3B8'
    };
  }
  if (totalScore >= 12) {
    return {
      tier: 'Critical' as const,
      label: 'Critical Hotspot',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      barClass: 'bg-rose-500',
      hex: '#E11D48'
    };
  }
  if (totalScore >= 6) {
    return {
      tier: 'High' as const,
      label: 'High Priority',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      barClass: 'bg-amber-500',
      hex: '#D97706'
    };
  }
  return {
    tier: 'Moderate' as const,
    label: 'Active Zone',
    badgeClass: 'bg-brand-teal-soft text-brand-teal-dark border-teal-200',
    barClass: 'bg-brand-teal',
    hex: '#009E96'
  };
}

export function getInitialSeedData() {
  const now = Date.now();
  const hour = 3600 * 1000;
  const day = 24 * hour;

  const issues = [
    {
      id: 'ISS-101',
      refId: 'FRC-2026-101',
      title: 'Severe Wi-Fi packet loss & eduroam dropouts in CS Labs 201–204',
      description:
        'During afternoon lab sessions (2 PM – 5 PM), eduroam disconnects every 4–5 minutes on the 2nd floor of Computer Science Block, preventing students from pushing code or accessing cloud lab environments.',
      category: 'Wi-Fi and Connectivity',
      buildingId: 'cse-ece-block',
      floorRoom: '2nd Floor, Labs 201–204',
      severity: 3,
      status: 'In Progress',
      reporterId: 'stu-1',
      reporterName: 'Aarav Sharma',
      createdAt: new Date(now - 3.5 * day).toISOString(),
      confirmedByUserIds: ['stu-1', 'stu-2', 'stu-3', 'stu-demo-4', 'stu-demo-5', 'stu-demo-6'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [
        {
          id: 'note-1',
          author: 'Dr. Meera Krishnan',
          text: 'Verified packet loss logs with Campus IT. Replacement Wi-Fi 6E access points scheduled for installation.',
          createdAt: new Date(now - 1.5 * day).toISOString()
        }
      ],
      history: [
        { action: 'Submitted by Aarav Sharma', actor: 'Aarav Sharma', at: new Date(now - 3.5 * day).toISOString() },
        { action: 'Approved & Published (Severity set to Critical)', actor: 'Dr. Meera Krishnan', at: new Date(now - 3.2 * day).toISOString() },
        { action: 'Similar report FRC-2026-109 automatically grouped', actor: 'Auto-Grouping Engine', at: new Date(now - 2 * day).toISOString() },
        { action: 'Status moved to In Progress', actor: 'Dr. Meera Krishnan', at: new Date(now - 1.5 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-109',
      refId: 'FRC-2026-109',
      title: 'Frequent internet drops during Compiler Design lab in CS Block',
      description:
        'Entire batch lost internet connectivity twice during graded practical assessment in Room 203. Hotspot signal is also weak inside.',
      category: 'Wi-Fi and Connectivity',
      buildingId: 'cse-ece-block',
      floorRoom: '2nd Floor, Room 203',
      severity: 3,
      status: 'In Progress',
      reporterId: 'stu-2',
      reporterName: 'Priya Nair',
      createdAt: new Date(now - 2.3 * day).toISOString(),
      confirmedByUserIds: ['stu-2'],
      parentCanonicalId: 'ISS-101',
      linkType: 'independent',
      imageUrl: null,
      adminNotes: [],
      history: [
        { action: 'Submitted by Priya Nair', actor: 'Priya Nair', at: new Date(now - 2.3 * day).toISOString() },
        { action: 'Automatically grouped as Independent Report under FRC-2026-101', actor: 'Auto-Grouping Engine', at: new Date(now - 2 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-110',
      refId: 'FRC-2026-110',
      title: 'CS Block 2nd floor Wi-Fi broken right now',
      description: 'Wi-Fi in Lab 201 is not connecting at all.',
      category: 'Wi-Fi and Connectivity',
      buildingId: 'cse-ece-block',
      floorRoom: '2nd Floor, Lab 201',
      severity: 2,
      status: 'Published',
      reporterId: 'stu-3',
      reporterName: 'Kabir Mehta',
      createdAt: new Date(now - 1.8 * day).toISOString(),
      confirmedByUserIds: ['stu-3'],
      parentCanonicalId: 'ISS-101',
      linkType: 'true_duplicate',
      imageUrl: null,
      adminNotes: [],
      history: [
        { action: 'Submitted by Kabir Mehta', actor: 'Kabir Mehta', at: new Date(now - 1.8 * day).toISOString() },
        { action: 'Automatically linked as Duplicate of FRC-2026-101', actor: 'Auto-Grouping Engine', at: new Date(now - 1.6 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-102',
      refId: 'FRC-2026-102',
      title: 'RO Water Cooler leaking and warm water only on Library Ground Floor',
      description:
        'The main drinking water dispenser outside the Central Library reading hall has no cooling and water is pooling around the electrical plug point.',
      category: 'Water and Sanitation',
      buildingId: 'library',
      floorRoom: 'Ground Floor, East Corridor',
      severity: 3,
      status: 'Published',
      reporterId: 'stu-2',
      reporterName: 'Priya Nair',
      createdAt: new Date(now - 2.8 * day).toISOString(),
      confirmedByUserIds: ['stu-2', 'stu-3', 'stu-demo-4', 'stu-demo-5'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [
        {
          id: 'note-2',
          author: 'Dr. Meera Krishnan',
          text: 'Plumbing & electrical inspection prioritized due to water near socket.',
          createdAt: new Date(now - 2.4 * day).toISOString()
        }
      ],
      history: [
        { action: 'Submitted by Priya Nair', actor: 'Priya Nair', at: new Date(now - 2.8 * day).toISOString() },
        { action: 'Approved & Published (Upgraded to Critical)', actor: 'Dr. Meera Krishnan', at: new Date(now - 2.4 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-103',
      refId: 'FRC-2026-103',
      title: '14 desk power sockets dead in Library Silent Study Zone B',
      description:
        'Three consecutive study tables along the north glass wall have zero power output. Students working on laptops have to sit on the floor near pillar outlets.',
      category: 'Electricity and Charging',
      buildingId: 'library',
      floorRoom: '1st Floor, Silent Zone B',
      severity: 2,
      status: 'Published',
      reporterId: 'stu-1',
      reporterName: 'Aarav Sharma',
      createdAt: new Date(now - 4 * day).toISOString(),
      confirmedByUserIds: ['stu-1', 'stu-3', 'stu-demo-4'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [],
      history: [
        { action: 'Submitted by Aarav Sharma', actor: 'Aarav Sharma', at: new Date(now - 4 * day).toISOString() },
        { action: 'Approved & Published', actor: 'Dr. Meera Krishnan', at: new Date(now - 3.7 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-104',
      refId: 'FRC-2026-104',
      title: 'Severe seating shortage & broken benches during 1–2 PM lunch rush',
      description:
        'Over 35% of seating capacity in the Canteen is unusable due to unbolted tabletops and missing stools, forcing students to eat standing outside.',
      category: 'Seating and Facilities',
      buildingId: 'canteen',
      floorRoom: 'Main Dining Hall & Patio',
      severity: 2,
      status: 'Published',
      reporterId: 'stu-3',
      reporterName: 'Kabir Mehta',
      createdAt: new Date(now - 5 * day).toISOString(),
      confirmedByUserIds: ['stu-3', 'stu-1', 'stu-2', 'stu-demo-4', 'stu-demo-5', 'stu-demo-6', 'stu-demo-7'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [],
      history: [
        { action: 'Submitted by Kabir Mehta', actor: 'Kabir Mehta', at: new Date(now - 5 * day).toISOString() },
        { action: 'Approved & Published', actor: 'Dr. Meera Krishnan', at: new Date(now - 4.6 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-105',
      refId: 'FRC-2026-105',
      title: 'Four pathway streetlights blacked out between Hostel Gate and Library',
      description:
        'The pedestrian walkway connecting South Hostels to the Central Library is completely dark after 7:30 PM, creating a safety hazard for students returning from late study hours.',
      category: 'Safety and Lighting',
      buildingId: 'kaveri-hostel',
      floorRoom: 'North Walkway towards Central Plaza',
      severity: 3,
      status: 'In Progress',
      reporterId: 'stu-2',
      reporterName: 'Priya Nair',
      createdAt: new Date(now - 3 * day).toISOString(),
      confirmedByUserIds: ['stu-2', 'stu-1', 'stu-3', 'stu-demo-4', 'stu-demo-5'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [
        {
          id: 'note-3',
          author: 'Dr. Meera Krishnan',
          text: 'Underground feeder cable fault identified. Temporary floodlight deployed while LED poles are rewired.',
          createdAt: new Date(now - 1 * day).toISOString()
        }
      ],
      history: [
        { action: 'Submitted by Priya Nair', actor: 'Priya Nair', at: new Date(now - 3 * day).toISOString() },
        { action: 'Approved & Published (Critical Severity)', actor: 'Dr. Meera Krishnan', at: new Date(now - 2.8 * day).toISOString() },
        { action: 'Status moved to In Progress', actor: 'Dr. Meera Krishnan', at: new Date(now - 1 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-106',
      refId: 'FRC-2026-106',
      title: 'HDMI splitter & ceiling projector flickering in Lecture Hall 104',
      description:
        'Projector turns purple and loses sync every few minutes during morning lectures, making code walkthroughs and circuit diagrams unreadable.',
      category: 'Classroom Equipment',
      buildingId: 'it-block',
      floorRoom: '1st Floor, Lecture Hall 104',
      severity: 2,
      status: 'Resolved',
      reporterId: 'stu-1',
      reporterName: 'Aarav Sharma',
      createdAt: new Date(now - 7 * day).toISOString(),
      confirmedByUserIds: ['stu-1', 'stu-2'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [
        {
          id: 'note-4',
          author: 'Dr. Meera Krishnan',
          text: 'Faulty HDMI wall plate and projector lamp replaced by AV support team.',
          createdAt: new Date(now - 2 * day).toISOString()
        }
      ],
      history: [
        { action: 'Submitted by Aarav Sharma', actor: 'Aarav Sharma', at: new Date(now - 7 * day).toISOString() },
        { action: 'Approved & Published', actor: 'Dr. Meera Krishnan', at: new Date(now - 6.5 * day).toISOString() },
        { action: 'Status moved to In Progress', actor: 'Dr. Meera Krishnan', at: new Date(now - 4 * day).toISOString() },
        { action: 'Marked as Resolved', actor: 'Dr. Meera Krishnan', at: new Date(now - 2 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-107',
      refId: 'FRC-2026-107',
      title: 'Wheelchair ramp tactile tiles cracked & steep lip at Admin Entrance',
      description:
        'The transition lip at the bottom of the East accessibility ramp has eroded concrete, causing wheelchair casters to catch.',
      category: 'Accessibility',
      buildingId: 'admin-block',
      floorRoom: 'Ground Entrance, East Ramp',
      severity: 3,
      status: 'Published',
      reporterId: 'stu-3',
      reporterName: 'Kabir Mehta',
      createdAt: new Date(now - 1.9 * day).toISOString(),
      confirmedByUserIds: ['stu-3', 'stu-2'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [],
      history: [
        { action: 'Submitted by Kabir Mehta', actor: 'Kabir Mehta', at: new Date(now - 1.9 * day).toISOString() },
        { action: 'Approved & Published', actor: 'Dr. Meera Krishnan', at: new Date(now - 1.4 * day).toISOString() }
      ]
    },
    {
      id: 'ISS-108',
      refId: 'FRC-2026-108',
      title: 'Loose acoustic wall panel & buzzing stage monitor in Auditorium',
      description:
        'Left-side acoustic fabric panel near Row G has come unlatched from its bracket, and the stage left monitor emits a constant 60Hz hum.',
      category: 'Infrastructure',
      buildingId: 'auditorium',
      floorRoom: 'Main Hall, Row G Left',
      severity: 1,
      status: 'Pending Review',
      reporterId: 'stu-1',
      reporterName: 'Aarav Sharma',
      createdAt: new Date(now - 10 * hour).toISOString(),
      confirmedByUserIds: ['stu-1'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [],
      history: [
        { action: 'Submitted by Aarav Sharma', actor: 'Aarav Sharma', at: new Date(now - 10 * hour).toISOString() }
      ]
    },
    {
      id: 'ISS-111',
      refId: 'FRC-2026-111',
      title: 'Badminton Court 2 roof skylight leak after evening rain',
      description:
        'Water drips directly onto the baseline of Court 2 whenever it rains, making the synthetic wooden flooring slippery and unsafe for players.',
      category: 'Infrastructure',
      buildingId: 'sports-complex',
      floorRoom: 'Indoor Arena, Court 2',
      severity: 2,
      status: 'Pending Review',
      reporterId: 'stu-3',
      reporterName: 'Kabir Mehta',
      createdAt: new Date(now - 6 * hour).toISOString(),
      confirmedByUserIds: ['stu-3'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [],
      history: [
        { action: 'Submitted by Kabir Mehta', actor: 'Kabir Mehta', at: new Date(now - 6 * hour).toISOString() }
      ]
    },
    {
      id: 'ISS-112',
      refId: 'FRC-2026-112',
      title: 'AC leaking condensation onto lab benches in IT Block',
      description: 'Split AC unit is dripping water onto desks near the back row.',
      category: 'Infrastructure',
      buildingId: 'it-block',
      floorRoom: '3rd Floor',
      severity: 2,
      status: 'Needs Clarification',
      reporterId: 'stu-2',
      reporterName: 'Priya Nair',
      createdAt: new Date(now - 26 * hour).toISOString(),
      confirmedByUserIds: ['stu-2'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [
        {
          id: 'note-5',
          author: 'Dr. Meera Krishnan',
          text: 'Clarification Requested: Please specify the exact room/lab number on the 3rd floor so HVAC technicians can locate the unit.',
          createdAt: new Date(now - 18 * hour).toISOString()
        }
      ],
      history: [
        { action: 'Submitted by Priya Nair', actor: 'Priya Nair', at: new Date(now - 26 * hour).toISOString() },
        { action: 'Clarification requested by Admin', actor: 'Dr. Meera Krishnan', at: new Date(now - 18 * hour).toISOString() }
      ]
    },
    {
      id: 'ISS-113',
      refId: 'FRC-2026-113',
      title: 'Vending machine ate coin near Canteen stairs',
      description: 'Snack vending machine near Canteen exit did not dispense item.',
      category: 'Other',
      buildingId: 'canteen',
      floorRoom: 'Ground Entrance',
      severity: 1,
      status: 'Rejected',
      reporterId: 'stu-3',
      reporterName: 'Kabir Mehta',
      createdAt: new Date(now - 4.2 * day).toISOString(),
      confirmedByUserIds: ['stu-3'],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: null,
      adminNotes: [
        {
          id: 'note-6',
          author: 'Dr. Meera Krishnan',
          text: 'Rejected: Private third-party vendor machine; please use the vendor refund QR code printed on the machine.',
          createdAt: new Date(now - 3.9 * day).toISOString()
        }
      ],
      history: [
        { action: 'Submitted by Kabir Mehta', actor: 'Kabir Mehta', at: new Date(now - 4.2 * day).toISOString() },
        { action: 'Rejected by Admin', actor: 'Dr. Meera Krishnan', at: new Date(now - 3.9 * day).toISOString() }
      ]
    }
  ];

  const flags = [
    {
      id: 'FLG-01',
      issueId: 'ISS-104',
      flaggedByUserId: 'stu-2',
      flaggedByName: 'Priya Nair',
      reason: 'Possible duplicate / overlap with canteen congestion',
      details: 'Checking whether seating count estimate includes outdoor patio chairs.',
      status: 'open',
      createdAt: new Date(now - 12 * hour).toISOString()
    },
    {
      id: 'FLG-02',
      issueId: 'ISS-108',
      flaggedByUserId: 'stu-3',
      flaggedByName: 'Kabir Mehta',
      reason: 'Needs verification before auditorium event',
      details: 'Auditorium was locked this morning; please verify row number.',
      status: 'open',
      createdAt: new Date(now - 4 * hour).toISOString()
    }
  ];

  const notifications = [
    {
      id: 'NTF-01',
      userId: 'stu-1',
      issueId: 'ISS-101',
      title: 'Issue moved to In Progress',
      message: 'Your report FRC-2026-101 (CS Block Wi-Fi packet loss) is now In Progress. Replacement APs scheduled.',
      type: 'progress',
      read: false,
      createdAt: new Date(now - 1.5 * day).toISOString()
    },
    {
      id: 'NTF-02',
      userId: 'stu-1',
      issueId: 'ISS-106',
      title: 'Issue Marked Resolved',
      message: 'Your report FRC-2026-106 (Lecture Hall 104 projector) has been resolved by AV support.',
      type: 'resolved',
      read: true,
      createdAt: new Date(now - 2 * day).toISOString()
    },
    {
      id: 'NTF-03',
      userId: 'stu-2',
      issueId: 'ISS-112',
      title: 'Clarification Requested',
      message: 'Dr. Meera Krishnan requested the exact room number for FRC-2026-112 (IT Block AC leak).',
      type: 'clarification',
      read: false,
      createdAt: new Date(now - 18 * hour).toISOString()
    },
    {
      id: 'NTF-04',
      userId: 'stu-2',
      issueId: 'ISS-105',
      title: 'Issue moved to In Progress',
      message: 'Your report FRC-2026-105 (Hostel pathway streetlights) is now In Progress.',
      type: 'progress',
      read: false,
      createdAt: new Date(now - 1 * day).toISOString()
    },
    {
      id: 'NTF-05',
      userId: 'stu-3',
      issueId: 'ISS-113',
      title: 'Report Rejected',
      message: 'Your report FRC-2026-113 was rejected: Third-party vendor machine handled via vendor QR.',
      type: 'rejected',
      read: false,
      createdAt: new Date(now - 3.9 * day).toISOString()
    }
  ];

  return {
    issues,
    flags,
    notifications,
    nextRefNumber: 114
  };
}

const STOP_WORDS = new Set([
  'the', 'is', 'in', 'at', 'of', 'and', 'to', 'for', 'on', 'a', 'an', 'with',
  'this', 'that', 'are', 'was', 'were', 'it', 'by', 'from', 'not', 'no', 'has',
  'have', 'been', 'near', 'around', 'block', 'floor', 'room', 'building', 'issue'
]);

function tokenizeText(text: string): Set<string> {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function buildTrigrams(text: string): Set<string> {
  const clean = (text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const grams = new Set<string>();
  if (clean.length < 3) return grams;
  for (let i = 0; i <= clean.length - 3; i += 1) {
    grams.add(clean.slice(i, i + 3));
  }
  return grams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  a.forEach((item) => {
    if (b.has(item)) overlap += 1;
  });
  return overlap / (a.size + b.size - overlap);
}

export const frictionService = {
  dailyLimit: 3,

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        const seed = getInitialSeedData();
        this.saveState(seed);
        return seed;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.issues)) {
        const seed = getInitialSeedData();
        this.saveState(seed);
        return seed;
      }
      // Strip legacy placeholder SVG sample images if migrating from v1
      parsed.issues = parsed.issues.map((iss: any) =>
        typeof iss.imageUrl === 'string' && iss.imageUrl.startsWith('data:image/svg+xml')
          ? { ...iss, imageUrl: null }
          : iss
      );
      return parsed;
    } catch (err) {
      console.error('Failed to read localStorage, falling back to seed:', err);
      return getInitialSeedData();
    }
  },

  saveState(state: any) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to persist state:', err);
    }
  },

  resetState() {
    const seed = getInitialSeedData();
    this.saveState(seed);
    return seed;
  },

  /**
   * Automatic Backend Similarity & Grouping Engine:
   * Matches incoming reports against active canonical issues in the same
   * building and category so duplicates and recurring observations cluster
   * automatically without manual admin intervention.
   */
  findAutoGroupCandidate(
    candidate: { title: string; description: string; category: string; buildingId: string; floorRoom?: string },
    allIssues: any[]
  ) {
    const candidateTokens = tokenizeText(`${candidate.title} ${candidate.description} ${candidate.floorRoom || ''}`);
    const candidateTrigrams = buildTrigrams(`${candidate.title} ${candidate.description}`);
    const candidateRoom = (candidate.floorRoom || '').toLowerCase().trim();

    let bestMatch: { canonical: any; linkType: 'true_duplicate' | 'independent'; score: number } | null = null;

    const pool = allIssues.filter(
      (iss) =>
        !iss.parentCanonicalId &&
        iss.buildingId === candidate.buildingId &&
        iss.category === candidate.category &&
        ['Published', 'In Progress', 'Pending Review'].includes(iss.status)
    );

    for (const existing of pool) {
      const existingTokens = tokenizeText(`${existing.title} ${existing.description} ${existing.floorRoom || ''}`);
      const existingTrigrams = buildTrigrams(`${existing.title} ${existing.description}`);
      const tokenSim = jaccardSimilarity(candidateTokens, existingTokens);
      const triSim = jaccardSimilarity(candidateTrigrams, existingTrigrams);
      const sameRoom =
        candidateRoom.length >= 3 &&
        (existing.floorRoom || '').toLowerCase().includes(candidateRoom);

      const combinedScore = tokenSim * 0.6 + triSim * 0.4 + (sameRoom ? 0.14 : 0);
      if (combinedScore >= 0.28 && (!bestMatch || combinedScore > bestMatch.score)) {
        bestMatch = {
          canonical: existing,
          linkType: combinedScore >= 0.56 ? 'true_duplicate' : 'independent',
          score: Math.round(combinedScore * 100) / 100
        };
      }
    }

    return bestMatch;
  },

  computeIssueMetrics(issue: any, allIssues: any[]) {
    const canonicalId = issue.parentCanonicalId || issue.id;
    const canonicalIssue = allIssues.find((i) => i.id === canonicalId) || issue;

    const linkedChildren = allIssues.filter((i) => i.parentCanonicalId === canonicalIssue.id);
    const independentChildren = linkedChildren.filter(
      (i) => i.linkType === 'independent' && ACCEPTED_STATUSES.includes(i.status)
    );
    const trueDuplicates = linkedChildren.filter((i) => i.linkType === 'true_duplicate');

    const baseAccepted = ACCEPTED_STATUSES.includes(canonicalIssue.status) ? 1 : 0;
    const R = baseAccepted + independentChildren.length;

    const uniqueConfirmers = new Set<string>(canonicalIssue.confirmedByUserIds || []);
    linkedChildren.forEach((child) => {
      (child.confirmedByUserIds || []).forEach((uid: string) => uniqueConfirmers.add(uid));
    });
    const reporterIds = new Set<string>([
      canonicalIssue.reporterId,
      ...linkedChildren.map((child) => child.reporterId)
    ]);
    const V = Array.from(uniqueConfirmers).filter((uid) => !reporterIds.has(uid)).length;
    const S = Number(canonicalIssue.severity) || 1;

    const rawScore = (R + 0.5 * V) * S;
    const priorityScore = Math.round(rawScore * 10) / 10;
    const priority = getPriorityMeta(priorityScore, S, V, R);

    return {
      canonicalIssue,
      R,
      V,
      S,
      priorityScore,
      priority,
      uniqueConfirmers: Array.from(uniqueConfirmers),
      linkedChildren,
      independentChildren,
      trueDuplicates,
      isHighPriority: priorityScore >= 6 || S === 3
    };
  },

  getUserDailySubmissionStats(userId: string, allIssues: any[]) {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const recentSubmissions = allIssues.filter(
      (i) => i.reporterId === userId && new Date(i.createdAt).getTime() >= cutoff
    );
    const maxPerDay = this.dailyLimit || 3;
    const used = recentSubmissions.length;
    const remaining = Math.max(0, maxPerDay - used);
    return { used, remaining, maxPerDay, recentSubmissions };
  }
};

export function formatRelativeTime(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function getBuildingName(buildingId: string) {
  return CAMPUS_BUILDINGS.find((b) => b.id === buildingId)?.name || 'Unknown Location';
}

export function getCategoryMeta(categoryId: string) {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
}
