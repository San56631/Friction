import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  PlusCircle,
  Map as MapIcon,
  LayoutDashboard,
  FileText,
  Bell,
  Search,
  Filter,
  SlidersHorizontal,
  Flag,
  ThumbsUp,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  RefreshCw,
  Users,
  Building2,
  Wifi,
  Monitor,
  Droplets,
  Wrench,
  Zap,
  Armchair,
  Accessibility,
  Lightbulb,
  HelpCircle,
  Link2,
  Unlink,
  GitMerge,
  Layers,
  Eye,
  MessageSquare,
  ArrowUpRight,
  Info,
  Sparkles,
  Camera,
  Send,
  Menu,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  BarChart3,
  History
} from 'lucide-react';
import { useAuth, AccountMenu } from './auth';
import * as remoteStore from './lib/remoteStore';

// ============================================================================
// 1. CONSTANTS, DOMAIN MODELS & CONFIGURATION
// ============================================================================

const STORAGE_KEY = 'friction_demo_v1';

const DEMO_USERS = [
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

const CAMPUS_BUILDINGS = [
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

const CATEGORIES = [
  { id: 'Wi-Fi and Connectivity', label: 'Wi-Fi & Connectivity', color: '#0284C7', icon: Wifi },
  { id: 'Classroom Equipment', label: 'Classroom Equipment', color: '#7C3AED', icon: Monitor },
  { id: 'Water and Sanitation', label: 'Water & Sanitation', color: '#0D9488', icon: Droplets },
  { id: 'Infrastructure', label: 'Infrastructure', color: '#EA580C', icon: Wrench },
  { id: 'Electricity and Charging', label: 'Electricity & Charging', color: '#CA8A04', icon: Zap },
  { id: 'Seating and Facilities', label: 'Seating & Facilities', color: '#DB2777', icon: Armchair },
  { id: 'Accessibility', label: 'Accessibility', color: '#2563EB', icon: Accessibility },
  { id: 'Safety and Lighting', label: 'Safety & Lighting', color: '#DC2626', icon: Lightbulb },
  { id: 'Other', label: 'Other', color: '#64748B', icon: HelpCircle }
];

const SEVERITY_LEVELS = [
  {
    value: 1,
    label: '1 — Minor Inconvenience',
    short: 'S1 · Minor',
    description: 'Noticeable annoyance, but academic or daily work can continue with easy workarounds.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  {
    value: 2,
    label: '2 — Disruptive Issue',
    short: 'S2 · Disruptive',
    description: 'Significantly slows down classes, study sessions, or basic comfort for many students.',
    badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30'
  },
  {
    value: 3,
    label: '3 — Critical Issue',
    short: 'S3 · Critical',
    description: 'Immediate safety hazard, accessibility barrier, or complete outage of essential utilities.',
    badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-500/35'
  }
];

const STATUS_META = {
  Flagged: {
    label: 'Flagged',
    description: 'Multiple community flags; held for administrator review.',
    badgeClass: 'bg-violet-500/15 text-violet-700 border-violet-500/30',
    dotClass: 'bg-violet-500'
  },
  'Pending Review': {
    label: 'Pending Review',
    description: 'Submitted by student; awaiting initial verification by Campus Admin.',
    badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
    dotClass: 'bg-amber-500'
  },
  Published: {
    label: 'Published',
    description: 'Verified and live on the campus map for student confirmation & triage.',
    badgeClass: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
    dotClass: 'bg-sky-400'
  },
  'In Progress': {
    label: 'In Progress',
    description: 'Assigned to maintenance/IT team; active repair work underway.',
    badgeClass: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
    dotClass: 'bg-indigo-400'
  },
  Resolved: {
    label: 'Resolved',
    description: 'Issue fixed and verified by Campus Facilities.',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    dotClass: 'bg-emerald-400'
  },
  'Needs Clarification': {
    label: 'Needs Clarification',
    description: 'Admin requested exact room number, timing, or additional details from reporter.',
    badgeClass: 'bg-orange-500/15 text-orange-700 border-orange-500/35',
    dotClass: 'bg-orange-400'
  },
  Rejected: {
    label: 'Rejected',
    description: 'Declined by moderation (e.g., invalid report, off-campus, or unverified spam).',
    badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
    dotClass: 'bg-rose-400'
  }
};

const SAMPLE_PHOTOS = [
  {
    label: 'Router / Network Rack Error',
    svgData:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320"><rect width="600" height="320" fill="#11161d"/><rect x="80" y="70" width="440" height="180" rx="12" fill="#1b222c" stroke="#334155" stroke-width="2"/><circle cx="135" cy="130" r="10" fill="#ef4444"/><circle cx="170" cy="130" r="10" fill="#ef4444"/><circle cx="205" cy="130" r="10" fill="#f59e0b"/><rect x="250" y="118" width="220" height="24" rx="4" fill="#0f172a"/><text x="262" y="135" fill="#f87171" font-family="monospace" font-size="13">ERR_DHCP_TIMEOUT // AP-CS-04</text><text x="120" y="205" fill="#94a3b8" font-family="sans-serif" font-size="15">Captured Campus Evidence · Access Point Fault</text></svg>`
      )
  },
  {
    label: 'Broken Power Outlet Strip',
    svgData:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320"><rect width="600" height="320" fill="#121417"/><rect x="120" y="90" width="360" height="140" rx="14" fill="#1e242b" stroke="#475569" stroke-width="2"/><rect x="165" y="135" width="60" height="50" rx="6" fill="#090d12" stroke="#ef4444" stroke-width="2"/><rect x="270" y="135" width="60" height="50" rx="6" fill="#090d12" stroke="#ef4444" stroke-width="2"/><rect x="375" y="135" width="60" height="50" rx="6" fill="#090d12" stroke="#64748b" stroke-width="2"/><text x="155" y="212" fill="#fbbf24" font-family="sans-serif" font-size="14">No AC Output · Desk Row B Sockets</text></svg>`
      )
  }
];

const ACCEPTED_STATUSES = ['Published', 'In Progress', 'Resolved'];

// ============================================================================
// 2. SEEDED REALISTIC CAMPUS DATA
// ============================================================================

function getInitialSeedData() {
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
      linkType: null, // 'true_duplicate' | 'independent'
      imageUrl: SAMPLE_PHOTOS[0].svgData,
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
        { action: 'Approved & Published (Severity set to S3)', actor: 'Dr. Meera Krishnan', at: new Date(now - 3.2 * day).toISOString() },
        { action: 'Independent report ISS-109 grouped under canonical issue', actor: 'Dr. Meera Krishnan', at: new Date(now - 2 * day).toISOString() },
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
        { action: 'Approved & grouped as Independent Report under FRC-2026-101', actor: 'Dr. Meera Krishnan', at: new Date(now - 2 * day).toISOString() }
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
        { action: 'Linked as True Duplicate of FRC-2026-101', actor: 'Dr. Meera Krishnan', at: new Date(now - 1.6 * day).toISOString() }
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
        { action: 'Approved & Published (Upgraded to S3)', actor: 'Dr. Meera Krishnan', at: new Date(now - 2.4 * day).toISOString() }
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
      imageUrl: SAMPLE_PHOTOS[1].svgData,
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
        { action: 'Approved & Published (Severity S3)', actor: 'Dr. Meera Krishnan', at: new Date(now - 2.8 * day).toISOString() },
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
      title: 'AC leaking condensation onto lab benches in Academic Block',
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
      title: 'Vending machine ate ₹50 coin near Canteen stairs',
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
      status: 'open', // 'open' | 'dismissed' | 'actioned'
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
      message: 'Dr. Meera Krishnan requested the exact room number for FRC-2026-112 (Academic Block AC leak).',
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

// ============================================================================
// 3. SERVICE & AFS CALCULATION ENGINE (MODULAR BACKEND-READY LAYER)
// ============================================================================

const frictionService = {
  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
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
      return parsed;
    } catch (err) {
      console.error('Failed to read localStorage, falling back to seed:', err);
      return getInitialSeedData();
    }
  },

  saveState(state) {
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
   * Computes Actionable Friction Score: AFS = (R + 0.5 * V) * S
   * - R = Independent accepted reports associated with this canonical issue
   *       (Pending, Rejected, and True Duplicates do NOT increment R)
   * - V = Unique student confirmations across the canonical issue
   * - S = Reviewed severity multiplier (1, 2, or 3)
   */
  computeIssueMetrics(issue, allIssues) {
    const canonicalId = issue.parentCanonicalId || issue.id;
    const canonicalIssue = allIssues.find((i) => i.id === canonicalId) || issue;

    const linkedChildren = allIssues.filter((i) => i.parentCanonicalId === canonicalIssue.id);
    const independentChildren = linkedChildren.filter(
      (i) => i.linkType === 'independent' && ACCEPTED_STATUSES.includes(i.status)
    );
    const trueDuplicates = linkedChildren.filter((i) => i.linkType === 'true_duplicate');

    const baseAccepted = ACCEPTED_STATUSES.includes(canonicalIssue.status) ? 1 : 0;
    const R = baseAccepted + independentChildren.length;

    // Combine unique confirmations from canonical + linked children
    const uniqueConfirmers = new Set(canonicalIssue.confirmedByUserIds || []);
    linkedChildren.forEach((child) => {
      (child.confirmedByUserIds || []).forEach((uid) => uniqueConfirmers.add(uid));
    });
    const reporterIds = new Set([canonicalIssue.reporterId, ...linkedChildren.map((child) => child.reporterId)]);
    const V = Array.from(uniqueConfirmers).filter((uid) => !reporterIds.has(uid)).length;
    const S = Number(canonicalIssue.severity) || 1;

    const rawAfs = (R + 0.5 * V) * S;
    const afs = Math.round(rawAfs * 10) / 10;

    return {
      canonicalIssue,
      R,
      V,
      S,
      afs,
      uniqueConfirmers: Array.from(uniqueConfirmers),
      linkedChildren,
      independentChildren,
      trueDuplicates,
      isHighPriority: afs >= 6 || S === 3
    };
  },

  getUserDailySubmissionStats(userId, allIssues) {
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

// ============================================================================
// 4. APPLICATION CONTEXT
// ============================================================================

const FrictionContext = createContext(null);

function FrictionProvider({ children }) {
  const { authUser } = useAuth();
  const [data, setData] = useState(() => (authUser ? remoteStore.emptyState() : frictionService.loadState()));
  const [currentUserId, setCurrentUserId] = useState('stu-1');
  const [activeTab, setActiveTab] = useState(() => (authUser?.role === 'admin' ? 'admin-overview' : 'dashboard'));
  const [selectedBuildingId, setSelectedBuildingId] = useState('cse-ece-block');
  const [buildingCoords, setBuildingCoords] = useState(() =>
    Object.fromEntries(CAMPUS_BUILDINGS.filter((b) => b.latitude !== null).map((b) => [b.id, [b.latitude, b.longitude]]))
  );
  const [reportPrefillBuilding, setReportPrefillBuilding] = useState('');
  const [reportPrefillSpot, setReportPrefillSpot] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!authUser) frictionService.saveState(data);
  }, [data]);

  const currentUser = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id,
        name: authUser.name,
        role: authUser.role,
        department: authUser.email,
        rollNo: '',
        avatar: authUser.initials
      };
    }
    return DEMO_USERS.find((u) => u.id === currentUserId) || DEMO_USERS[0];
  }, [authUser, currentUserId]);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 3200 ? null : prev));
    }, 3400);
  };

  const refresh = async () => {
    if (!authUser) return;
    const next = await remoteStore.loadRemoteState(authUser.id);
    if (next) setData(next);
  };
  const runRemote = async (action, successMessage) => {
    const { error } = await action;
    if (error) {
      showToast(remoteStore.friendlyError(error), 'error');
      return false;
    }
    if (successMessage) showToast(successMessage);
    await refresh();
    return true;
  };
  useEffect(() => {
    if (!authUser) return;
    refresh();
    const pollTimer = setInterval(refresh, 20000);
    return () => clearInterval(pollTimer);
  }, [authUser?.id, authUser?.role]);

  useEffect(() => {
    if (authUser?.role === 'admin' && ['dashboard', 'my-reports', 'report'].includes(activeTab)) setActiveTab('admin-overview');
    if (authUser?.role === 'student' && activeTab.startsWith('admin-')) setActiveTab('dashboard');
  }, [authUser?.role]);

  useEffect(() => {
    if (!authUser) return;
    remoteStore.loadBuildingCoords().then((rows) => {
      if (rows.length === 0) return;
      setBuildingCoords((prev) => ({ ...prev, ...Object.fromEntries(rows.map((r) => [r.id, [r.latitude, r.longitude]])) }));
    });
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser) return;
    remoteStore.getDailyLimit().then((limit) => {
      frictionService.dailyLimit = limit;
      setDailyLimit(limit);
    });
  }, [authUser?.id]);

  const updateDailyLimit = async (limit) => {
    const { error } = await remoteStore.saveDailyLimit(limit);
    if (error) {
      showToast(remoteStore.friendlyError(error), 'error');
      return false;
    }
    frictionService.dailyLimit = limit;
    setDailyLimit(limit);
    showToast('Daily report limit updated.');
    return true;
  };

  const recordAbuse = async (targetUserId, note) => {
    if (!authUser) {
      showToast('Abuse enforcement needs the database. Sign in as an administrator.', 'error');
      return;
    }
    await runRemote(remoteStore.recordAbuse(targetUserId, note), 'Strike recorded and the student was notified.');
  };

  const pinBuilding = async (buildingId, latitude, longitude) => {
    if (authUser) {
      const { error } = await remoteStore.updateBuildingCoordinates(buildingId, latitude, longitude);
      if (error) return showToast(remoteStore.friendlyError(error), 'error');
    }
    setBuildingCoords((prev) => ({ ...prev, [buildingId]: [latitude, longitude] }));
    showToast('Building pin saved.');
  };

  // Switch role/user and automatically adjust active tab if switching between Student & Admin
  const switchUser = (userId) => {
    const target = DEMO_USERS.find((u) => u.id === userId);
    if (!target) return;
    setCurrentUserId(userId);
    if (target.role === 'admin' && !['admin-overview', 'admin-moderation', 'admin-duplicates', 'admin-flags', 'admin-settings'].includes(activeTab)) {
      setActiveTab('admin-overview');
    } else if (target.role === 'student' && activeTab.startsWith('admin-')) {
      setActiveTab('dashboard');
    }
    showToast(`Switched active persona to ${target.name} (${target.role === 'admin' ? 'Administrator' : 'Student'})`, 'info');
  };

  const pushNotification = (draftData, { userId, issueId, title, message, type }) => {
    const newNotif = {
      id: `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      issueId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    return {
      ...draftData,
      notifications: [newNotif, ...draftData.notifications]
    };
  };

  // Create new issue report
  const submitReport = async ({ title, description, category, buildingId, floorRoom, severity, imageUrl, spot }) => {
    if (authUser) {
      if (currentUser.role !== 'student') {
        return { ok: false, error: 'Administrator accounts review reports. Sign in as a student to submit one.' };
      }
      const { data: row, error } = await remoteStore.submitIssue(
        { title: title.trim(), description: description.trim(), category, buildingId, floorRoom: floorRoom.trim(), severity: Number(severity), imageUrl, spot },
        currentUser.id
      );
      if (error) return { ok: false, error: remoteStore.friendlyError(error) };
      await refresh();
      return { ok: true, issue: remoteStore.mapIssueRow(row) };
    }
    if (currentUser.role !== 'student') {
      return { ok: false, error: 'Switch to a Student persona to submit a campus report.' };
    }
    const quota = frictionService.getUserDailySubmissionStats(currentUser.id, data.issues);
    if (quota.remaining <= 0) {
      return {
        ok: false,
        error: 'Daily allowance reached (3 reports per rolling 24 hours). Please wait before submitting another report.'
      };
    }

    const refNum = data.nextRefNumber || 114;
    const newId = `ISS-${refNum}`;
    const refId = `FRC-2026-${refNum}`;
    const nowIso = new Date().toISOString();

    const newIssue = {
      id: newId,
      refId,
      title: title.trim(),
      description: description.trim(),
      category,
      buildingId,
      floorRoom: floorRoom.trim(),
      severity: Number(severity),
      status: 'Pending Review',
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      createdAt: nowIso,
      confirmedByUserIds: [currentUser.id],
      parentCanonicalId: null,
      linkType: null,
      imageUrl: imageUrl || null,
      latitude: spot?.latitude ?? null,
      longitude: spot?.longitude ?? null,
      placeName: spot?.placeName || null,
      adminNotes: [],
      history: [
        {
          action: `Submitted by ${currentUser.name}`,
          actor: currentUser.name,
          at: nowIso
        }
      ]
    };

    setData((prev) => ({
      ...prev,
      issues: [newIssue, ...prev.issues],
      nextRefNumber: refNum + 1
    }));

    return { ok: true, issue: newIssue };
  };

  // Student confirmation ("I'm experiencing this too")
  const confirmIssue = (issueId) => {
    if (authUser) {
      const target = data.issues.find((i) => i.id === issueId);
      runRemote(
        remoteStore.confirmIssue(target?.parentCanonicalId || issueId, currentUser.id),
        'Confirmation recorded! Actionable Friction Score recalculated.'
      );
      return;
    }
    if (currentUser.role !== 'student') {
      showToast('Only student accounts can submit issue confirmations.', 'error');
      return;
    }
    setData((prev) => {
      const target = prev.issues.find((i) => i.id === issueId);
      if (!target) return prev;
      const canonicalId = target.parentCanonicalId || target.id;
      const metrics = frictionService.computeIssueMetrics(target, prev.issues);
      if (metrics.uniqueConfirmers.includes(currentUser.id)) {
        return prev;
      }

      const updatedIssues = prev.issues.map((item) => {
        if (item.id === canonicalId) {
          return {
            ...item,
            confirmedByUserIds: Array.from(new Set([...(item.confirmedByUserIds || []), currentUser.id])),
            history: [
              ...item.history,
              {
                action: `Confirmed ("Experiencing this too") by ${currentUser.name}`,
                actor: currentUser.name,
                at: new Date().toISOString()
              }
            ]
          };
        }
        return item;
      });

      return { ...prev, issues: updatedIssues };
    });
    showToast('Confirmation recorded! Actionable Friction Score recalculated.');
  };

  // Student responds to clarification request
  const submitClarificationResponse = (issueId, responseText) => {
    if (!responseText.trim()) return;
    if (authUser) {
      runRemote(remoteStore.respondToClarification(issueId, responseText), 'Clarification submitted and returned to Admin review queue.');
      return;
    }
    setData((prev) => {
      const updatedIssues = prev.issues.map((item) => {
        if (item.id !== issueId) return item;
        return {
          ...item,
          status: 'Pending Review',
          description: `${item.description}\n\n[Student Clarification]: ${responseText.trim()}`,
          history: [
            ...item.history,
            {
              action: `Student clarification added by ${currentUser.name}; returned to Pending Review`,
              actor: currentUser.name,
              at: new Date().toISOString()
            }
          ]
        };
      });
      return { ...prev, issues: updatedIssues };
    });
    showToast('Clarification submitted and returned to Admin review queue.');
  };

  // Student flags an issue
  const flagIssue = (issueId, reason, details) => {
    if (authUser) {
      runRemote(remoteStore.flagIssue(issueId, currentUser.id, reason, details.trim()), 'Report flagged for administrator review.');
      return;
    }
    const newFlag = {
      id: `FLG-${Date.now()}`,
      issueId,
      flaggedByUserId: currentUser.id,
      flaggedByName: currentUser.name,
      reason,
      details: details.trim(),
      status: 'open',
      createdAt: new Date().toISOString()
    };

    setData((prev) => ({
      ...prev,
      flags: [newFlag, ...prev.flags],
      issues: prev.issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              history: [
                ...i.history,
                {
                  action: `Flagged for moderation (${reason}) by ${currentUser.name}`,
                  actor: currentUser.name,
                  at: new Date().toISOString()
                }
              ]
            }
          : i
      )
    }));
    showToast('Report flagged for administrator review.');
  };

  // Admin moderation actions
  const moderateIssue = (issueId, { status, severity, adminNote, notifyType, notifyTitle, notifyMessage }) => {
    if (authUser) {
      const target = data.issues.find((i) => i.id === issueId);
      (async () => {
        const patch: any = {};
        if (status && status !== target.status) {
          patch.status = status;
          patch.status_reason =
            status === 'Rejected' || status === 'Needs Clarification'
              ? (adminNote || '').replace(/^(Rejected|Clarification Requested):\s*/, '')
              : null;
        }
        if (severity && Number(severity) !== Number(target.severity)) patch.severity = Number(severity);
        if (Object.keys(patch).length > 0) {
          const { error } = await remoteStore.updateIssue(issueId, patch);
          if (error) return showToast(remoteStore.friendlyError(error), 'error');
        }
        if (adminNote && adminNote.trim()) {
          await remoteStore.addNote(issueId, currentUser.id, currentUser.name, adminNote.trim());
        }
        if (!patch.status && notifyTitle) {
          await remoteStore.notifyUser(target.reporterId, issueId, notifyTitle, notifyMessage, notifyType || 'update');
        }
        showToast('Moderation update applied and synced.');
        refresh();
      })();
      return;
    }
    setData((prev) => {
      const target = prev.issues.find((i) => i.id === issueId);
      if (!target) return prev;
      const nowIso = new Date().toISOString();

      const historyEntries = [];
      if (status && status !== target.status) {
        historyEntries.push({
          action: `Status updated from ${target.status} to ${status}`,
          actor: currentUser.name,
          at: nowIso
        });
      }
      if (severity && Number(severity) !== Number(target.severity)) {
        historyEntries.push({
          action: `Severity adjusted from S${target.severity} to S${severity}`,
          actor: currentUser.name,
          at: nowIso
        });
      }
      if (adminNote && adminNote.trim()) {
        historyEntries.push({
          action: `Admin Note: "${adminNote.trim()}"`,
          actor: currentUser.name,
          at: nowIso
        });
      }

      const updatedIssues = prev.issues.map((item) => {
        if (item.id !== issueId) return item;
        return {
          ...item,
          status: status || item.status,
          severity: severity ? Number(severity) : item.severity,
          adminNotes:
            adminNote && adminNote.trim()
              ? [
                  ...item.adminNotes,
                  {
                    id: `note-${Date.now()}`,
                    author: currentUser.name,
                    text: adminNote.trim(),
                    createdAt: nowIso
                  }
                ]
              : item.adminNotes,
          history: [...item.history, ...historyEntries]
        };
      });

      let nextState = { ...prev, issues: updatedIssues };

      if (notifyTitle && target.reporterId) {
        nextState = pushNotification(nextState, {
          userId: target.reporterId,
          issueId: target.id,
          title: notifyTitle,
          message: notifyMessage,
          type: notifyType || 'update'
        });
      }

      return nextState;
    });
    showToast('Moderation update applied and synced.');
  };

  // Admin Duplicate & Group Linking
  const linkIssueToCanonical = (childIssueId, canonicalIssueId, linkType) => {
    if (childIssueId === canonicalIssueId) return;
    if (authUser) {
      const child = data.issues.find((i) => i.id === childIssueId);
      runRemote(
        remoteStore.updateIssue(childIssueId, {
          parent_id: canonicalIssueId,
          link_type: linkType,
          ...(ACCEPTED_STATUSES.includes(child.status) ? {} : { status: 'Published' })
        }),
        linkType === 'true_duplicate'
          ? 'Linked as True Duplicate (R unchanged, confirmations merged).'
          : 'Grouped as Independent Report (R incremented & AFS updated).'
      );
      return;
    }
    setData((prev) => {
      const child = prev.issues.find((i) => i.id === childIssueId);
      const canonical = prev.issues.find((i) => i.id === canonicalIssueId);
      if (!child || !canonical) return prev;

      const nowIso = new Date().toISOString();
      const label = linkType === 'true_duplicate' ? 'True Duplicate' : 'Independent Grouped Report';

      const updatedIssues = prev.issues.map((item) => {
        if (item.id === childIssueId) {
          return {
            ...item,
            parentCanonicalId: canonicalIssueId,
            linkType,
            status: ACCEPTED_STATUSES.includes(item.status) ? item.status : 'Published',
            history: [
              ...item.history,
              {
                action: `Linked as ${label} under ${canonical.refId}`,
                actor: currentUser.name,
                at: nowIso
              }
            ]
          };
        }
        if (item.id === canonicalIssueId) {
          return {
            ...item,
            history: [
              ...item.history,
              {
                action: `${child.refId} linked as ${label}`,
                actor: currentUser.name,
                at: nowIso
              }
            ]
          };
        }
        return item;
      });

      let nextState = { ...prev, issues: updatedIssues };
      nextState = pushNotification(nextState, {
        userId: child.reporterId,
        issueId: canonical.id,
        title: 'Report Linked to Campus Issue',
        message: `Your report ${child.refId} was grouped with canonical issue ${canonical.refId} (${canonical.title}).`,
        type: 'update'
      });

      return nextState;
    });
    showToast(
      linkType === 'true_duplicate'
        ? 'Linked as True Duplicate (R unchanged, confirmations merged).'
        : 'Grouped as Independent Report (R incremented & AFS updated).'
    );
  };

  const unlinkIssue = (childIssueId) => {
    if (authUser) {
      runRemote(remoteStore.updateIssue(childIssueId, { parent_id: null, link_type: null }), 'Report unlinked into standalone canonical issue.');
      return;
    }
    setData((prev) => {
      const child = prev.issues.find((i) => i.id === childIssueId);
      if (!child || !child.parentCanonicalId) return prev;
      const nowIso = new Date().toISOString();

      const updatedIssues = prev.issues.map((item) => {
        if (item.id === childIssueId) {
          return {
            ...item,
            parentCanonicalId: null,
            linkType: null,
            history: [
              ...item.history,
              {
                action: `Unlinked into standalone issue`,
                actor: currentUser.name,
                at: nowIso
              }
            ]
          };
        }
        return item;
      });

      return { ...prev, issues: updatedIssues };
    });
    showToast('Report unlinked into standalone canonical issue.');
  };

  // Admin Flag Resolution
  const resolveFlag = (flagId, resolutionStatus) => {
    if (authUser) {
      runRemote(remoteStore.resolveFlag(flagId, resolutionStatus), resolutionStatus === 'dismissed' ? 'Flag dismissed.' : 'Flag marked as actioned.');
      return;
    }
    setData((prev) => ({
      ...prev,
      flags: prev.flags.map((f) =>
        f.id === flagId ? { ...f, status: resolutionStatus, resolvedAt: new Date().toISOString() } : f
      )
    }));
    showToast(resolutionStatus === 'dismissed' ? 'Flag dismissed.' : 'Flag marked as actioned.');
  };

  const markNotificationRead = (notifId) => {
    if (authUser) {
      runRemote(remoteStore.markRead([notifId]));
      return;
    }
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    }));
  };

  const markAllNotificationsRead = () => {
    if (authUser) {
      runRemote(remoteStore.markRead(data.notifications.filter((n) => !n.read).map((n) => n.id)));
      return;
    }
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.userId === currentUser.id ? { ...n, read: true } : n
      )
    }));
  };

  const resetDemoData = () => {
    const fresh = frictionService.resetState();
    setData(fresh);
    setSelectedIssueId(null);
    showToast('Demo dataset restored to clean initial campus state.', 'info');
  };

  const navigateToReportWithBuilding = (buildingId = '') => {
    if (currentUser.role !== 'student' && !authUser) {
      switchUser('stu-1');
    }
    setReportPrefillBuilding(buildingId);
    setActiveTab('report');
  };

  const navigateToReportWithSpot = (spot) => {
    if (currentUser.role !== 'student' && !authUser) {
      switchUser('stu-1');
    }
    setReportPrefillSpot(spot);
    setActiveTab('report');
  };

  const navigateToBuildingOnMap = (buildingId) => {
    setSelectedBuildingId(buildingId);
    setActiveTab('map');
  };

  return (
    <FrictionContext.Provider
      value={{
        data,
        currentUser,
        switchUser,
        activeTab,
        setActiveTab,
        selectedBuildingId,
        setSelectedBuildingId,
        reportPrefillBuilding,
        setReportPrefillBuilding,
        selectedIssueId,
        setSelectedIssueId,
        notificationsOpen,
        setNotificationsOpen,
        submitReport,
        confirmIssue,
        submitClarificationResponse,
        flagIssue,
        moderateIssue,
        linkIssueToCanonical,
        unlinkIssue,
        resolveFlag,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData,
        navigateToReportWithBuilding,
        navigateToBuildingOnMap,
        buildingCoords,
        pinBuilding,
        reportPrefillSpot,
        setReportPrefillSpot,
        navigateToReportWithSpot,
        dailyLimit,
        updateDailyLimit,
        recordAbuse,
        toast,
        showToast
      }}
    >
      {children}
    </FrictionContext.Provider>
  );
}

function useFriction() {
  return useContext(FrictionContext);
}

// ============================================================================
// 5. SHARED UI COMPONENTS & BADGES
// ============================================================================

function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getBuildingName(buildingId) {
  return CAMPUS_BUILDINGS.find((b) => b.id === buildingId)?.name || 'Unknown Location';
}

function getCategoryMeta(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META['Pending Review'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const meta = SEVERITY_LEVELS.find((s) => s.value === Number(severity)) || SEVERITY_LEVELS[0];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${meta.badgeClass}`}>
      {meta.short}
    </span>
  );
}

function AfsBadge({ afs, isHighPriority, showFormula = false }) {
  return (
    <span
      title="Actionable Friction Score: AFS = (R + 0.5V) × S — Prioritization indicator"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
        isHighPriority
          ? 'bg-teal-500/15 text-teal-700 border-teal-500/40'
          : 'bg-slate-100/90 text-slate-800 border-slate-300'
      }`}
    >
      <Sparkles className="w-3 h-3 text-teal-600" />
      <span>AFS {afs.toFixed(1)}</span>
      {showFormula && <span className="text-[10px] text-slate-600 font-normal">priority</span>}
    </span>
  );
}

function CategoryChip({ category }) {
  const meta = getCategoryMeta(category);
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
      <span>{meta.label}</span>
    </span>
  );
}

// ============================================================================
// 6. STUDENT HOME DASHBOARD
// ============================================================================

function StudentDashboard() {
  const {
    data,
    currentUser,
    setActiveTab,
    setSelectedIssueId,
    confirmIssue,
    navigateToReportWithBuilding,
    navigateToBuildingOnMap
  } = useFriction();

  // Compute live metrics from canonical issues
  const canonicalIssues = useMemo(
    () => data.issues.filter((i) => !i.parentCanonicalId),
    [data.issues]
  );

  const enrichedCanonical = useMemo(
    () =>
      canonicalIssues.map((issue) => ({
        ...issue,
        metrics: frictionService.computeIssueMetrics(issue, data.issues)
      })),
    [canonicalIssues, data.issues]
  );

  const stats = useMemo(() => {
    const total = data.issues.length;
    const active = canonicalIssues.filter((i) => ['Published', 'In Progress'].includes(i.status)).length;
    const resolved = canonicalIssues.filter((i) => i.status === 'Resolved').length;
    const awaitingReview = data.issues.filter((i) =>
      ['Pending Review', 'Needs Clarification', 'Flagged'].includes(i.status)
    ).length;
    const highPriority = enrichedCanonical.filter(
      (i) => i.status !== 'Rejected' && i.status !== 'Resolved' && i.metrics.isHighPriority
    ).length;

    return { total, active, resolved, awaitingReview, highPriority };
  }, [data.issues, canonicalIssues, enrichedCanonical]);

  // Building hotspots ranked by active cumulative AFS
  const buildingHotspots = useMemo(() => {
    return CAMPUS_BUILDINGS.map((bld) => {
      const bldIssues = enrichedCanonical.filter(
        (i) => i.buildingId === bld.id && i.status !== 'Rejected' && i.status !== 'Resolved'
      );
      const totalAfs = bldIssues.reduce((acc, item) => acc + item.metrics.afs, 0);
      return {
        ...bld,
        activeCount: bldIssues.length,
        totalAfs: Math.round(totalAfs * 10) / 10
      };
    }).sort((a, b) => b.totalAfs - a.totalAfs);
  }, [enrichedCanonical]);

  const recentPublicIssues = useMemo(() => {
    return enrichedCanonical
      .filter((i) => i.status !== 'Rejected')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }, [enrichedCanonical]);

  const quota = frictionService.getUserDailySubmissionStats(currentUser.id, data.issues);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-teal-50 via-white to-sky-50 border border-teal-100 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              Live Campus Telemetry · {currentUser.department}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Making everyday campus problems impossible to ignore. Spot infrastructure bottlenecks,
              confirm active issues reported by peers, and track real-time resolution progress.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigateToReportWithBuilding('')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-lg shadow-teal-600/10 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Report an Issue
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium text-sm transition cursor-pointer"
              >
                <MapIcon className="w-4 h-4 text-teal-600" />
                Explore Campus Map
              </button>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Daily report allowance:{' '}
              <span className="font-semibold text-slate-800">
                {quota.remaining} of {quota.maxPerDay} remaining
              </span>{' '}
              (rolling 24h)
            </div>
          </div>
        </div>
      </div>

      {/* Live KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium mb-2">
            <span>Total Reports</span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all {CAMPUS_BUILDINGS.length} campus zones</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium mb-2">
            <span>Active Issues</span>
            <AlertCircle className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700">{stats.active}</div>
          <div className="text-[11px] text-slate-500 mt-1">Published & In Progress</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium mb-2">
            <span>High-Priority</span>
            <FlameIcon className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-600">{stats.highPriority}</div>
          <div className="text-[11px] text-slate-500 mt-1">AFS ≥ 6.0 or Critical S3</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium mb-2">
            <span>Awaiting Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.awaitingReview}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending admin verification</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium mb-2">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats.resolved}</div>
          <div className="text-[11px] text-slate-500 mt-1">Fixed & verified</div>
        </div>
      </div>

      {/* Main Split: Campus Hotspots & Recent Campus Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campus Hotspots Overview */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                Campus Friction Hotspots
              </h2>
              <button
                onClick={() => setActiveTab('map')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                Open Map <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Buildings ranked by live cumulative Actionable Friction Score (AFS). Click any zone to inspect on the map.
            </p>

            <div className="space-y-2.5">
              {buildingHotspots.map((bld, idx) => {
                const maxAfs = Math.max(...buildingHotspots.map((b) => b.totalAfs), 1);
                const pct = Math.min(100, Math.round((bld.totalAfs / maxAfs) * 100));
                return (
                  <button
                    key={bld.id}
                    onClick={() => navigateToBuildingOnMap(bld.id)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-200 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500 w-4">0{idx + 1}</span>
                        <span className="text-sm font-medium text-slate-800 group-hover:text-teal-700 transition">
                          {bld.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">
                          {bld.activeCount} {bld.activeCount === 1 ? 'issue' : 'issues'}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            bld.totalAfs >= 12
                              ? 'bg-rose-500/15 text-rose-700'
                              : bld.totalAfs > 0
                              ? 'bg-teal-500/15 text-teal-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          AFS {bld.totalAfs.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          bld.totalAfs >= 12 ? 'bg-rose-400' : 'bg-teal-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>
              AFS = (R + 0.5V) × S is a crowd-validated prioritization indicator, not an objective measure of truth.
            </span>
          </div>
        </div>

        {/* Recent Campus Reports */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-slate-900">Recent Campus Reports</h2>
            <button
              onClick={() => setActiveTab('map')}
              className="text-xs text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Filter all on map →
            </button>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Validate issues you have also experienced to increase their visibility and prioritization score.
          </p>

          <div className="space-y-3">
            {recentPublicIssues.map((issue) => {
              const { metrics } = issue;
              const hasConfirmed = metrics.uniqueConfirmers.includes(currentUser.id);

              return (
                <div
                  key={issue.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-slate-600">{issue.refId}</span>
                      <StatusBadge status={issue.status} />
                      <SeverityBadge severity={metrics.S} />
                    </div>
                    <AfsBadge afs={metrics.afs} isHighPriority={metrics.isHighPriority} />
                  </div>

                  <button
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="text-left block w-full group cursor-pointer"
                  >
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-teal-700 transition mb-1">
                      {issue.title}
                    </h3>
                  </button>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {getBuildingName(issue.buildingId)}
                      {issue.floorRoom ? ` · ${issue.floorRoom}` : ''}
                    </span>
                    <span>{issue.category}</span>
                    <span>{formatRelativeTime(issue.createdAt)}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>
                        <strong className="text-slate-800">{metrics.R}</strong> independent{' '}
                        {metrics.R === 1 ? 'report' : 'reports'}
                      </span>
                      <span>·</span>
                      <span>
                        <strong className="text-slate-800">{metrics.V}</strong>{' '}
                        {metrics.V === 1 ? 'confirmation' : 'confirmations'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => confirmIssue(issue.id)}
                        disabled={hasConfirmed || currentUser.role !== 'student'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          hasConfirmed
                            ? 'bg-teal-500/10 text-teal-700 border border-teal-500/30 cursor-default'
                            : 'bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-800 border border-slate-200 cursor-pointer'
                        }`}
                      >
                        {hasConfirmed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Confirmed ({metrics.V})
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="w-3.5 h-3.5" />
                            I&apos;m experiencing this too
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedIssueId(issue.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlameIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

// ============================================================================
// 7. INTERACTIVE CAMPUS MAP (CUSTOM SVG SCHEMATIC + FILTERS + INSPECTOR)
// ============================================================================


function distanceInMeters(latA, lngA, latB, lngB) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const dLat = toRadians(latB - latA);
  const dLng = toRadians(lngB - lngA);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// Match a dropped pin to a building: first by the name OpenStreetMap shows there, then by distance to pinned buildings.
function guessBuildingId(placeName, latitude, longitude, buildingCoords) {
  const place = (placeName || '').toLowerCase();
  if (place.length > 3) {
    const byName = CAMPUS_BUILDINGS.find((b) => {
      const names = [b.name.toLowerCase(), b.shortName.toLowerCase()];
      return names.some((n) => place.includes(n) || n.includes(place));
    });
    if (byName) return byName.id;
  }
  let nearestId = '';
  let nearestDistance = 60;
  CAMPUS_BUILDINGS.forEach((b) => {
    const point = buildingCoords[b.id];
    if (!point) return;
    const meters = distanceInMeters(latitude, longitude, point[0], point[1]);
    if (meters < nearestDistance) {
      nearestDistance = meters;
      nearestId = b.id;
    }
  });
  return nearestId;
}

function LeafletCampusMap({
  buildings, coords, summaries, selectedId, onSelect, pinTargetId, onPick,
  issuePins, onSelectIssue, droppedPin, onDrop
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const buildingLayerRef = useRef(null);
  const issueLayerRef = useRef(null);
  const dropLayerRef = useRef(null);
  const pinTargetRef = useRef(pinTargetId);
  const onPickRef = useRef(onPick);
  const onDropRef = useRef(onDrop);
  pinTargetRef.current = pinTargetId;
  onPickRef.current = onPick;
  onDropRef.current = onDrop;

  useEffect(() => {
    const map = L.map(containerRef.current, { zoomControl: true, maxZoom: 19 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    buildingLayerRef.current = L.layerGroup().addTo(map);
    issueLayerRef.current = L.layerGroup().addTo(map);
    dropLayerRef.current = L.layerGroup().addTo(map);
    const pinnedPoints = Object.values(coords);
    if (pinnedPoints.length > 0) map.fitBounds(L.latLngBounds(pinnedPoints), { padding: [50, 50], maxZoom: 18 });
    else map.setView([28.6645, 77.2327], 17);
    map.on('click', (event) => {
      if (pinTargetRef.current) onPickRef.current(event.latlng.lat, event.latlng.lng);
      else onDropRef.current(event.latlng.lat, event.latlng.lng);
    });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const layer = buildingLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    containerRef.current.style.cursor = 'crosshair';
    buildings.forEach((building) => {
      const point = coords[building.id];
      if (!point) return;
      const summary = summaries[building.id];
      const issueCount = summary?.count || 0;
      const isHigh = summary && summary.totalAfs >= 12;
      const isSelected = building.id === selectedId;
      const background = isHigh ? '#E11D48' : issueCount > 0 ? '#0D9488' : '#94A3B8';
      const icon = L.divIcon({
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        html: `<div style="width:34px;height:34px;border-radius:17px;background:${background};color:#fff;font:700 13px system-ui;display:flex;align-items:center;justify-content:center;border:3px solid ${isSelected ? '#0F172A' : '#fff'};box-shadow:0 2px 8px rgba(15,23,42,.4)">${issueCount > 0 ? issueCount : '&bull;'}</div>`
      });
      const marker = L.marker(point, { icon, interactive: !pinTargetId, keyboard: true, title: building.name });
      marker.bindTooltip(`${building.shortName}${issueCount ? ` · AFS ${summary.totalAfs.toFixed(1)}` : ''}`, { direction: 'top', offset: [0, -16] });
      marker.on('click', () => onSelect(building.id));
      marker.addTo(layer);
    });
  }, [buildings, coords, summaries, selectedId, pinTargetId]);

  // Exact-location dots for issues that were reported with a dropped pin
  useEffect(() => {
    const layer = issueLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    issuePins.forEach((issue) => {
      const fillColor = Number(issue.severity) === 3 ? '#E11D48' : Number(issue.severity) === 2 ? '#D97706' : '#0284C7';
      const dot = L.circleMarker([issue.latitude, issue.longitude], {
        radius: 8, color: '#fff', weight: 2, fillColor, fillOpacity: 1,
        interactive: !pinTargetId, bubblingMouseEvents: false
      });
      dot.bindTooltip(`${issue.refId} · ${issue.title}`, { direction: 'top' });
      dot.on('click', () => onSelectIssue(issue.id));
      dot.addTo(layer);
    });
  }, [issuePins, pinTargetId]);

  useEffect(() => {
    const layer = dropLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!droppedPin) return;
    const icon = L.divIcon({
      className: '',
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      html: '<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="#0F766E" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5.5" fill="#fff"/></svg>'
    });
    L.marker([droppedPin.latitude, droppedPin.longitude], { icon, interactive: false }).addTo(layer);
  }, [droppedPin]);

  return <div ref={containerRef} className="w-full h-[460px]" role="application" aria-label="Interactive campus map. Click anywhere to drop a pin." />;
}

function CampusMapView() {
  const {
    data,
    currentUser,
    selectedBuildingId,
    setSelectedBuildingId,
    setSelectedIssueId,
    confirmIssue,
    navigateToReportWithBuilding,
    buildingCoords,
    pinBuilding,
    navigateToReportWithSpot
  } = useFriction();
  const [pinTargetId, setPinTargetId] = useState(null);
  const [droppedPin, setDroppedPin] = useState(null);

  const handleDrop = async (latitude, longitude) => {
    setDroppedPin({ latitude, longitude, placeName: '', isLookingUp: true, buildingId: guessBuildingId('', latitude, longitude, buildingCoords) });
    let placeName = '';
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${latitude}&lon=${longitude}`
      );
      const result = await response.json();
      placeName = result.name || result.address?.building || '';
    } catch {
      placeName = '';
    }
    const matchedBuildingId = guessBuildingId(placeName, latitude, longitude, buildingCoords);
    setDroppedPin((current) =>
      current && current.latitude === latitude && current.longitude === longitude
        ? { ...current, placeName, isLookingUp: false, buildingId: matchedBuildingId }
        : current
    );
    if (matchedBuildingId) setSelectedBuildingId(matchedBuildingId);
  };

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // ACTIVE | ALL | Published | In Progress | Pending Review | Resolved
  const [searchQuery, setSearchQuery] = useState('');

  // Filter canonical issues matching user criteria
  const filteredCanonicalIssues = useMemo(() => {
    return data.issues
      .filter((i) => !i.parentCanonicalId && i.status !== 'Rejected')
      .map((issue) => ({
        ...issue,
        metrics: frictionService.computeIssueMetrics(issue, data.issues)
      }))
      .filter((issue) => {
        if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false;
        if (severityFilter !== 'ALL' && Number(issue.metrics.S) !== Number(severityFilter)) return false;
        if (statusFilter === 'ACTIVE') {
          if (!['Published', 'In Progress', 'Pending Review', 'Needs Clarification'].includes(issue.status)) {
            return false;
          }
        } else if (statusFilter !== 'ALL' && issue.status !== statusFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            issue.title.toLowerCase().includes(q) ||
            issue.refId.toLowerCase().includes(q) ||
            issue.category.toLowerCase().includes(q) ||
            (issue.floorRoom && issue.floorRoom.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      });
  }, [data.issues, categoryFilter, severityFilter, statusFilter, searchQuery]);

  // Aggregate per building for map hotspots and pins
  const buildingSummaries = useMemo(() => {
    const map = {};
    CAMPUS_BUILDINGS.forEach((bld) => {
      const issues = filteredCanonicalIssues
        .filter((i) => i.buildingId === bld.id)
        .sort((a, b) => b.metrics.afs - a.metrics.afs);
      const totalAfs = issues.reduce((acc, i) => acc + i.metrics.afs, 0);
      map[bld.id] = {
        building: bld,
        issues,
        count: issues.length,
        totalAfs: Math.round(totalAfs * 10) / 10,
        topCategory: issues[0]?.category || null
      };
    });
    return map;
  }, [filteredCanonicalIssues]);

  const activeBuilding =
    CAMPUS_BUILDINGS.find((b) => b.id === selectedBuildingId) || CAMPUS_BUILDINGS[0];
  const activeSummary = buildingSummaries[activeBuilding.id] || {
    building: activeBuilding,
    issues: [],
    count: 0,
    totalAfs: 0
  };

  const resetFilters = () => {
    setCategoryFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ACTIVE');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-teal-600" />
              Interactive Campus Friction Map
            </h1>
            <p className="text-xs text-slate-600">
              Select any campus building or issue marker to inspect localized reports, hotspot intensity, and friction scores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search room, keyword, ID..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600"
              />
            </div>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Severity */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
            >
              <option value="ALL">All Severities</option>
              <option value="3">S3 · Critical</option>
              <option value="2">S2 · Disruptive</option>
              <option value="1">S1 · Minor</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
            >
              <option value="ACTIVE">Open & Active</option>
              <option value="ALL">All Statuses</option>
              <option value="Published">Published</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Resolved">Resolved</option>
            </select>

            {(categoryFilter !== 'ALL' ||
              severityFilter !== 'ALL' ||
              statusFilter !== 'ACTIVE' ||
              searchQuery) && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Map + Side Drawer Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Interactive SVG Campus Map */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
            <div className="flex items-center gap-4 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 ring-4 ring-rose-500/20" />
                High Friction Hotspot (AFS ≥ 12)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-teal-500/20" />
                Active Friction Zone
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                Clear / No Matching Issues
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Showing {filteredCanonicalIssues.length} canonical issues
            </span>
          </div>

          <div className="isolate rounded-xl overflow-hidden border border-slate-200">
            <LeafletCampusMap
              buildings={CAMPUS_BUILDINGS}
              coords={buildingCoords}
              summaries={buildingSummaries}
              selectedId={selectedBuildingId}
              onSelect={setSelectedBuildingId}
              issuePins={filteredCanonicalIssues.filter((i) => i.latitude != null)}
              onSelectIssue={setSelectedIssueId}
              droppedPin={droppedPin}
              onDrop={handleDrop}
              pinTargetId={pinTargetId}
              onPick={(latitude, longitude) => {
                pinBuilding(pinTargetId, latitude, longitude);
                setPinTargetId(null);
              }}
            />
          </div>

          {droppedPin && !pinTargetId && (
            <div role="status" className="mt-3 p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-teal-900">
                <div className="font-semibold">
                  {droppedPin.isLookingUp ? 'Looking up this spot…' : droppedPin.placeName || 'Dropped pin'}
                </div>
                <div className="text-teal-800 mt-0.5">
                  {droppedPin.latitude.toFixed(5)}, {droppedPin.longitude.toFixed(5)}
                  {!droppedPin.isLookingUp && (
                    <> · {droppedPin.buildingId ? `Matched to ${CAMPUS_BUILDINGS.find((b) => b.id === droppedPin.buildingId)?.name}` : 'No building matched, you can choose one in the form'}</>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigateToReportWithSpot(droppedPin)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Report an issue here
                </button>
                <button onClick={() => setDroppedPin(null)} className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer">
                  Clear
                </button>
              </div>
            </div>
          )}
          {!droppedPin && !pinTargetId && (
            <p className="mt-3 text-[11px] text-slate-600">Tip: click anywhere on the map to drop a pin. The map name there is looked up automatically.</p>
          )}
          {pinTargetId && (
            <div role="status" className="mt-3 px-3.5 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center justify-between gap-2">
              <span>Click the map to place <strong>{CAMPUS_BUILDINGS.find((b) => b.id === pinTargetId)?.name}</strong>.</span>
              <button onClick={() => setPinTargetId(null)} className="font-semibold hover:underline cursor-pointer">Cancel</button>
            </div>
          )}
          {currentUser.role === 'admin' && !pinTargetId && (
            <button
              onClick={() => setPinTargetId(activeBuilding.id)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-medium text-slate-800 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              {buildingCoords[activeBuilding.id] ? 'Move pin' : 'Place pin'} for {activeBuilding.shortName}
            </button>
          )}
          {CAMPUS_BUILDINGS.some((b) => !buildingCoords[b.id]) && (
            <p className="mt-3 text-[11px] text-slate-600">
              Not pinned yet: {CAMPUS_BUILDINGS.filter((b) => !buildingCoords[b.id]).map((b) => b.shortName).join(', ')}. You can still
              report issues there; use the building buttons below to select them.
            </p>
          )}

          {/* Quick Building Pill Selector for Mobile/Accessibility */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CAMPUS_BUILDINGS.map((bld) => {
              const cnt = buildingSummaries[bld.id]?.count || 0;
              const active = bld.id === selectedBuildingId;
              return (
                <button
                  key={bld.id}
                  onClick={() => setSelectedBuildingId(bld.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>{bld.shortName}</span>
                  {cnt > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] ${
                        active ? 'bg-white/25 text-slate-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Location Side Panel */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-xs text-teal-600 font-mono mb-1">
                  <span>{activeBuilding.code}</span>
                  <span>·</span>
                  <span>{activeBuilding.zone}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{activeBuilding.name}</h2>
                <p className="text-xs text-slate-600 mt-1">{activeBuilding.description}</p>
              </div>
              <button
                onClick={() => navigateToReportWithBuilding(activeBuilding.id)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Report Here
              </button>
            </div>

            {/* Building Friction Summary */}
            <div className="grid grid-cols-3 gap-2.5 my-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] text-slate-600">Matching Issues</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{activeSummary.count}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] text-slate-600">Cumulative AFS</div>
                <div className="text-lg font-bold text-teal-600 mt-0.5">
                  {activeSummary.totalAfs.toFixed(1)}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] text-slate-600">Hotspot Status</div>
                <div className="text-xs font-semibold text-slate-800 mt-1.5">
                  {activeSummary.totalAfs >= 12
                    ? 'Critical Hotspot'
                    : activeSummary.totalAfs > 0
                    ? 'Active Zone'
                    : 'Normal'}
                </div>
              </div>
            </div>

            {/* Issues List for Selected Building */}
            <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
              {activeSummary.issues.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600/70 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-800">
                    No matching issues in {activeBuilding.name}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 mb-4">
                    Try clearing map filters or report a new problem at this location.
                  </p>
                  <button
                    onClick={() => navigateToReportWithBuilding(activeBuilding.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-800 text-xs font-medium transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Report Issue at {activeBuilding.shortName}
                  </button>
                </div>
              ) : (
                activeSummary.issues.map((issue) => {
                  const { metrics } = issue;
                  const hasConfirmed = metrics.uniqueConfirmers.includes(currentUser.id);

                  return (
                    <div
                      key={issue.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-500/40 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-600">{issue.refId}</span>
                          <StatusBadge status={issue.status} />
                        </div>
                        <AfsBadge afs={metrics.afs} isHighPriority={metrics.isHighPriority} />
                      </div>

                      <button
                        onClick={() => setSelectedIssueId(issue.id)}
                        className="text-left block w-full cursor-pointer"
                      >
                        <h3 className="text-sm font-semibold text-slate-900 hover:text-teal-700 transition">
                          {issue.title}
                        </h3>
                      </button>

                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                        <span>{issue.category}</span>
                        {issue.floorRoom && (
                          <>
                            <span>·</span>
                            <span className="text-slate-700">{issue.floorRoom}</span>
                          </>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600">
                          R={metrics.R} · V={metrics.V} · S={metrics.S}
                        </span>
                        <div className="flex items-center gap-2">
                          {currentUser.role === 'student' && (
                            <button
                              onClick={() => confirmIssue(issue.id)}
                              disabled={hasConfirmed}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                                hasConfirmed
                                  ? 'bg-teal-500/10 text-teal-700 border border-teal-500/30'
                                  : 'bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-800 cursor-pointer'
                              }`}
                            >
                              {hasConfirmed ? `Confirmed (${metrics.V})` : '+ Confirm'}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedIssueId(issue.id)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. REPORT AN ISSUE FLOW (VALIDATION, RATE LIMITING, PHOTO EVIDENCE)
// ============================================================================

function ReportIssueView() {
  const {
    data,
    currentUser,
    reportPrefillBuilding,
    setReportPrefillBuilding,
    submitReport,
    setActiveTab,
    setSelectedIssueId,
    navigateToBuildingOnMap,
    confirmIssue,
    reportPrefillSpot,
    setReportPrefillSpot
  } = useFriction();
  const [spot, setSpot] = useState(null);
  const { authUser } = useAuth();
  const [similarIssues, setSimilarIssues] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [buildingId, setBuildingId] = useState(reportPrefillBuilding || CAMPUS_BUILDINGS[0].id);
  const [floorRoom, setFloorRoom] = useState('');
  const [severity, setSeverity] = useState(2);
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [submittedIssue, setSubmittedIssue] = useState(null);

  useEffect(() => {
    if (reportPrefillBuilding) {
      setBuildingId(reportPrefillBuilding);
      setReportPrefillBuilding('');
    }
  }, [reportPrefillBuilding, setReportPrefillBuilding]);

  useEffect(() => {
    if (!reportPrefillSpot) return;
    setSpot(reportPrefillSpot);
    if (reportPrefillSpot.buildingId) setBuildingId(reportPrefillSpot.buildingId);
    setReportPrefillSpot(null);
  }, [reportPrefillSpot]);

  const quota = frictionService.getUserDailySubmissionStats(currentUser.id, data.issues);

  // Duplicate detection: same building + category, similar wording (server-side trigram match)
  useEffect(() => {
    const searchText = `${title} ${description}`.trim();
    if (!authUser || searchText.length < 12) {
      setSimilarIssues([]);
      return;
    }
    const debounceTimer = setTimeout(async () => {
      const { data: matches } = await remoteStore.findSimilar(buildingId, category, searchText);
      setSimilarIssues(matches || []);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [authUser, buildingId, category, title, description]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const nextErrors = {};
    if (!title.trim() || title.trim().length < 8) {
      nextErrors.title = 'Please provide a clear issue title (at least 8 characters).';
    }
    if (!description.trim() || description.trim().length < 15) {
      nextErrors.description = 'Please describe the problem and its impact (at least 15 characters).';
    }
    if (!floorRoom.trim()) {
      nextErrors.floorRoom = 'Please enter the room number or floor (for example Lab 204, 2nd floor).';
    }
    if (!category) {
      nextErrors.category = 'Please select an issue category.';
    }
    if (!buildingId) {
      nextErrors.buildingId = 'Please select a campus building/location.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await submitReport({
      title,
      description,
      category,
      buildingId,
      floorRoom,
      severity,
      imageUrl,
      spot
    });

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }

    setSubmittedIssue(result.issue);
    setTitle('');
    setDescription('');
    setFloorRoom('');
    setImageUrl('');
    setSpot(null);
    setErrors({});
  };

  if (submittedIssue) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-teal-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-teal-600" />
        </div>
        <div className="space-y-1.5">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-teal-700 font-mono text-xs font-semibold">
            Reference ID: {submittedIssue.refId}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Report Logged Successfully</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {submittedIssue.status === 'Published'
              ? 'Your report passed the automatic checks and is live on the campus map. Other students can now confirm it.'
              : `Your report is held for administrator review. ${submittedIssue.statusReason || ''}`}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Title:</span>
            <span className="text-slate-800 font-medium text-right max-w-xs">{submittedIssue.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Location:</span>
            <span className="text-slate-800">
              {getBuildingName(submittedIssue.buildingId)}
              {submittedIssue.floorRoom ? ` (${submittedIssue.floorRoom})` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Initial Severity:</span>
            <span className="text-slate-800">S{submittedIssue.severity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Status:</span>
            <StatusBadge status={submittedIssue.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setSelectedIssueId(submittedIssue.id);
              setSubmittedIssue(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            Open Issue Details
          </button>
          <button
            onClick={() => {
              navigateToBuildingOnMap(submittedIssue.buildingId);
              setSubmittedIssue(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium text-xs transition cursor-pointer"
          >
            View on Campus Map
          </button>
          <button
            onClick={() => {
              setActiveTab('my-reports');
              setSubmittedIssue(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium text-xs transition cursor-pointer"
          >
            Go to My Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header & Daily Quota Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-600" />
            Report a Campus Issue
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Provide clear location details so fellow students can confirm and facilities can act rapidly.
          </p>
        </div>

        <div
          className={`px-4 py-2.5 rounded-xl border text-xs shrink-0 ${
            quota.remaining > 0
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-700'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-700'
          }`}
        >
          <div className="font-semibold">
            Daily Allowance: {quota.remaining} / {quota.maxPerDay} left
          </div>
          <div className="text-[11px] opacity-80">Rolling 24-hour anti-spam limit</div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5"
      >
        {errors.form && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Issue Title */}
        <div>
          <label htmlFor="report-title" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Issue Title <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            id="report-title" value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Projector flickering & no HDMI audio in Room 302"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600"
          />
          {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
        </div>

        {spot && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-start justify-between gap-3 text-xs">
            <div className="text-teal-900">
              <div className="font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Pinned on map: {spot.placeName || 'Dropped pin'}
              </div>
              <div className="text-teal-800 mt-0.5">{spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}. Add the room number below.</div>
            </div>
            <button type="button" onClick={() => setSpot(null)} className="shrink-0 font-semibold text-teal-800 hover:underline cursor-pointer">
              Remove pin
            </button>
          </div>
        )}

        {/* Category & Location Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="report-category" className="block text-xs font-semibold text-slate-800 mb-1.5">
              Category <span className="text-rose-600">*</span>
            </label>
            <select
              id="report-category" value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.id}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="report-building" className="block text-xs font-semibold text-slate-800 mb-1.5">
              Campus Building / Location <span className="text-rose-600">*</span>
            </label>
            <select
              id="report-building" value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
            >
              {CAMPUS_BUILDINGS.map((bld) => (
                <option key={bld.id} value={bld.id}>
                  {bld.name} ({bld.zone})
                </option>
              ))}
            </select>
            {errors.buildingId && <p className="text-xs text-rose-600 mt-1">{errors.buildingId}</p>}
          </div>
        </div>

        {/* Floor / Room */}
        <div>
          <label htmlFor="report-room" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Room number / Floor <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            id="report-room" value={floorRoom}
            onChange={(e) => setFloorRoom(e.target.value)}
            placeholder="e.g., 2nd Floor, Lab 204 or Near North Water Fountain"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600"
          />
          {errors.floorRoom && <p className="text-xs text-rose-600 mt-1">{errors.floorRoom}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="report-description" className="block text-xs font-semibold text-slate-800 mb-1.5">
            Detailed Description <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={4}
            id="report-description" value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is broken, when it occurs, and how it impacts students..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600"
          />
          {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
        </div>

        {/* Severity Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-2">
            Severity Impact Level (S) <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SEVERITY_LEVELS.map((lvl) => {
              const selected = Number(severity) === lvl.value;
              return (
                <button
                  type="button"
                  key={lvl.value}
                  onClick={() => setSeverity(lvl.value)}
                  className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                    selected
                      ? 'bg-teal-500/10 border-teal-600 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{lvl.label}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selected ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                      }`}
                    >
                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{lvl.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Photo Evidence */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Attach Photo Evidence <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-200 text-xs text-slate-800 cursor-pointer transition">
              <Camera className="w-4 h-4 text-teal-600" />
              <span>Upload Image File</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {SAMPLE_PHOTOS.map((sample, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setImageUrl(sample.svgData)}
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 transition cursor-pointer"
              >
                Use Sample: {sample.label}
              </button>
            ))}

            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Remove Photo
              </button>
            )}
          </div>

          {imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-w-md">
              <img src={imageUrl} alt="Attached evidence preview" className="w-full h-40 object-cover" />
            </div>
          )}
        </div>

        {similarIssues.length > 0 && (
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-3" role="region" aria-label="Possible existing issues">
            <div className="text-xs font-semibold text-sky-800">Possible existing {similarIssues.length === 1 ? 'issue' : 'issues'} at this location</div>
            {similarIssues.map((match) => (
              <div key={match.id} className="p-3 rounded-lg bg-white border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">{match.title}</div>
                  <div className="text-slate-600 mt-0.5">
                    FRC-{match.ref_number} · {match.status} · {match.confirmations} {Number(match.confirmations) === 1 ? 'student has' : 'students have'} confirmed this
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => confirmIssue(match.id)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  I&apos;m experiencing this too
                </button>
              </div>
            ))}
            <p className="text-[11px] text-slate-600">If yours is genuinely a different problem, just continue and submit it as a separate report.</p>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-600">
            Submitting as <strong className="text-slate-800">{currentUser.name}</strong>
          </span>
          <button
            type="submit"
            disabled={quota.remaining <= 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Submit Issue Report
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// 9. MY REPORTS VIEW (STUDENT TRACKING & CLARIFICATION REPLY)
// ============================================================================

function MyReportsView() {
  const {
    data,
    currentUser,
    setSelectedIssueId,
    submitClarificationResponse,
    navigateToReportWithBuilding
  } = useFriction();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [clarifyDrafts, setClarifyDrafts] = useState({});

  const myReports = useMemo(() => {
    return data.issues
      .filter((i) => i.reporterId === currentUser.id)
      .map((issue) => ({
        ...issue,
        metrics: frictionService.computeIssueMetrics(issue, data.issues)
      }))
      .filter((issue) => {
        if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            issue.title.toLowerCase().includes(q) ||
            issue.refId.toLowerCase().includes(q) ||
            getBuildingName(issue.buildingId).toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data.issues, currentUser.id, statusFilter, search]);

  const statuses = [
    'ALL',
    'Pending Review',
    'Published',
    'In Progress',
    'Resolved',
    'Needs Clarification',
    'Rejected'
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Submitted Reports</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Track moderation reviews, admin notes, and resolution status for reports filed by {currentUser.name}.
          </p>
        </div>

        <button
          onClick={() => navigateToReportWithBuilding('')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Reports' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your reports..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Reports List */}
      {myReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">No reports match your current filter</p>
          <p className="text-xs text-slate-600 mt-1">
            Switch personas in the top bar or submit a new campus issue report.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {myReports.map((issue) => {
            const { metrics } = issue;
            const statusInfo = STATUS_META[issue.status];
            return (
              <div
                key={issue.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-600">{issue.refId}</span>
                    <StatusBadge status={issue.status} />
                    <SeverityBadge severity={issue.severity} />
                    {issue.parentCanonicalId && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 border border-indigo-500/30 text-[11px]">
                        Linked to {metrics.canonicalIssue.refId}
                      </span>
                    )}
                  </div>
                  <AfsBadge afs={metrics.afs} isHighPriority={metrics.isHighPriority} />
                </div>

                <div>
                  <button
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="text-left text-base font-semibold text-slate-900 hover:text-teal-700 transition cursor-pointer"
                  >
                    {issue.title}
                  </button>
                  <p className="text-xs text-slate-600 mt-1">
                    {getBuildingName(issue.buildingId)}
                    {issue.floorRoom ? ` · ${issue.floorRoom}` : ''} · {issue.category} · Reported{' '}
                    {formatRelativeTime(issue.createdAt)}
                  </p>
                </div>

                {statusInfo && (
                  <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-700">Status Note:</span> {statusInfo.description}{issue.statusReason ? ` ${issue.statusReason}.` : ''}
                  </div>
                )}

                {/* Latest Admin Note */}
                {issue.adminNotes.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800">
                    <div className="font-semibold text-amber-700 mb-0.5">
                      Latest Note from {issue.adminNotes[issue.adminNotes.length - 1].author}:
                    </div>
                    <p>{issue.adminNotes[issue.adminNotes.length - 1].text}</p>
                  </div>
                )}

                {/* Clarification Reply Box if Status is Needs Clarification */}
                {issue.status === 'Needs Clarification' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-orange-500/35 space-y-2">
                    <div className="text-xs font-semibold text-orange-700">
                      Action Required: Provide requested details to resume verification
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={clarifyDrafts[issue.id] || ''}
                        onChange={(e) =>
                          setClarifyDrafts((prev) => ({ ...prev, [issue.id]: e.target.value }))
                        }
                        placeholder="Enter exact room number, timing, or clarification..."
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                      />
                      <button
                        onClick={() => {
                          submitClarificationResponse(issue.id, clarifyDrafts[issue.id] || '');
                          setClarifyDrafts((prev) => ({ ...prev, [issue.id]: '' }));
                        }}
                        className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition cursor-pointer"
                      >
                        Send Clarification
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {metrics.V} student confirmations · {metrics.R} independent reports
                  </span>
                  <button
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Full Timeline &amp; Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 10. ISSUE DETAILS MODAL / DRAWER (AFS BREAKDOWN, CONFIRM, FLAG, AUDIT LOG)
// ============================================================================

function IssueDetailsModal() {
  const {
    data,
    currentUser,
    selectedIssueId,
    setSelectedIssueId,
    confirmIssue,
    flagIssue,
    moderateIssue
  } = useFriction();

  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('Duplicate of an existing issue');
  const [flagDetails, setFlagDetails] = useState('');
  const [adminQuickNote, setAdminQuickNote] = useState('');

  if (!selectedIssueId) return null;

  const issue = data.issues.find((i) => i.id === selectedIssueId);
  if (!issue) return null;

  const metrics = frictionService.computeIssueMetrics(issue, data.issues);
  const canonical = metrics.canonicalIssue;
  const hasConfirmed = metrics.uniqueConfirmers.includes(currentUser.id);
  const issueFlags = data.flags.filter((f) => f.issueId === issue.id);

  const handleFlagSubmit = (e) => {
    e.preventDefault();
    flagIssue(issue.id, flagReason, flagDetails);
    setFlagOpen(false);
    setFlagDetails('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Top Modal Bar */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {issue.refId}
            </span>
            <StatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
          </div>
          <button
            onClick={() => {
              setSelectedIssueId(null);
              setFlagOpen(false);
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Linked Notice if Child */}
          {issue.parentCanonicalId && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-800 flex items-center justify-between gap-2">
              <div>
                This report is linked as a{' '}
                <strong>
                  {issue.linkType === 'true_duplicate' ? 'True Duplicate' : 'Independent Grouped Report'}
                </strong>{' '}
                under canonical issue <strong>{canonical.refId}</strong> ({canonical.title}).
              </div>
              <button
                onClick={() => setSelectedIssueId(canonical.id)}
                className="shrink-0 px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-800 font-medium cursor-pointer"
              >
                View Canonical
              </button>
            </div>
          )}

          {/* Title & Metadata */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{issue.title}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-600">
              <CategoryChip category={issue.category} />
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                {getBuildingName(issue.buildingId)}
                {issue.floorRoom ? ` · ${issue.floorRoom}` : ''}
              </span>
              <span>
                Reported by <strong className="text-slate-800">{issue.reporterName}</strong> (
                {formatRelativeTime(issue.createdAt)})
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Problem Description
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {issue.description}
            </p>
            {issue.imageUrl && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                <img src={issue.imageUrl} alt="Submitted evidence" className="w-full max-h-60 object-cover" />
              </div>
            )}
          </div>

          {/* Actionable Friction Score (AFS) Breakdown Card */}
          <div className="bg-slate-50 border border-teal-500/30 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="text-xs font-semibold text-teal-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Actionable Friction Score (AFS) Engine
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                  Formula: AFS = (R + 0.5 × V) × S = ({metrics.R} + 0.5 × {metrics.V}) × {metrics.S}
                </div>
              </div>
              <div className="text-3xl font-extrabold text-teal-600">{metrics.afs.toFixed(1)}</div>
            </div>

            <div className="grid grid-cols-3 gap-3 my-3.5">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="text-[11px] text-slate-600">R · Independent Reports</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.R}</div>
                <div className="text-[10px] text-slate-500">Accepted independent reports</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="text-[11px] text-slate-600">V · Student Confirmations</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.V}</div>
                <div className="text-[10px] text-slate-500">Unique student validations</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="text-[11px] text-slate-600">S · Severity Multiplier</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.S}×</div>
                <div className="text-[10px] text-slate-500">Admin-reviewed impact</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              AFS is a prioritization indicator to guide resource allocation, not an objective measure of truth.
            </p>
          </div>

          {/* Student Interaction Controls: Confirm & Flag */}
          {currentUser.role === 'student' && issue.status !== 'Rejected' && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <button
                onClick={() => confirmIssue(issue.id)}
                disabled={hasConfirmed}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                  hasConfirmed
                    ? 'bg-teal-500/15 text-teal-700 border border-teal-500/35 cursor-default'
                    : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                }`}
              >
                {hasConfirmed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmed by you ({metrics.V} total)
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    I&apos;m experiencing this too
                  </>
                )}
              </button>

              <button
                onClick={() => setFlagOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-500/15 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                Flag Issue
              </button>
            </div>
          )}

          {/* Inline Flag Form */}
          {flagOpen && (
            <form
              onSubmit={handleFlagSubmit}
              className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3"
            >
              <div className="text-xs font-semibold text-rose-800">
                Flag this report for Administrator review
              </div>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
              >
                <option value="Duplicate of an existing issue">Duplicate of an existing issue</option>
                <option value="Incorrect building or room location">Incorrect building or room location</option>
                <option value="Spam, fake, or non-campus issue">Spam, fake, or non-campus issue</option>
                <option value="Inappropriate or offensive language">Inappropriate or offensive language</option>
              </select>
              <input
                type="text"
                value={flagDetails}
                onChange={(e) => setFlagDetails(e.target.value)}
                placeholder="Optional context for the moderator..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFlagOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Submit Flag
                </button>
              </div>
            </form>
          )}

          {/* Quick Admin Controls inside Modal when logged in as Admin */}
          {currentUser.role === 'admin' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-teal-500/30 space-y-3">
              <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Administrator Quick Actions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Update Status</label>
                  <select
                    value={issue.status}
                    onChange={(e) =>
                      moderateIssue(issue.id, {
                        status: e.target.value,
                        notifyType: e.target.value === 'Resolved' ? 'resolved' : 'progress',
                        notifyTitle: `Status Updated: ${e.target.value}`,
                        notifyMessage: `Your report ${issue.refId} (${issue.title}) is now marked as ${e.target.value}.`
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                  >
                    {Object.keys(STATUS_META).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Reviewed Severity (S)</label>
                  <select
                    value={issue.severity}
                    onChange={(e) =>
                      moderateIssue(issue.id, {
                        severity: Number(e.target.value),
                        notifyType: 'update',
                        notifyTitle: 'Issue Priority Updated',
                        notifyMessage: `Severity for ${issue.refId} was updated to S${e.target.value} by Campus Admin.`
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                  >
                    <option value={1}>S1 — Minor Inconvenience</option>
                    <option value={2}>S2 — Disruptive Issue</option>
                    <option value={3}>S3 — Critical Issue</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminQuickNote}
                  onChange={(e) => setAdminQuickNote(e.target.value)}
                  placeholder="Append official administrative note..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                />
                <button
                  onClick={() => {
                    if (!adminQuickNote.trim()) return;
                    moderateIssue(issue.id, {
                      adminNote: adminQuickNote,
                      notifyType: 'update',
                      notifyTitle: 'New Admin Note on Your Report',
                      notifyMessage: `Admin note added to ${issue.refId}: "${adminQuickNote.trim()}"`
                    });
                    setAdminQuickNote('');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Post Note
                </button>
              </div>
            </div>
          )}

          {/* Linked / Grouped Reports */}
          {metrics.linkedChildren.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Linked Reports ({metrics.linkedChildren.length})
              </h3>
              <div className="space-y-2">
                {metrics.linkedChildren.map((child) => (
                  <div
                    key={child.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono text-slate-600 mr-2">{child.refId}</span>
                      <span className="text-slate-800 font-medium">{child.title}</span>
                      <span className="text-slate-500 ml-2">by {child.reporterName}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        child.linkType === 'true_duplicate'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-sky-500/15 text-sky-700'
                      }`}
                    >
                      {child.linkType === 'true_duplicate' ? 'True Duplicate' : 'Independent (+R)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes & Audit Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Moderation &amp; Status History
            </h3>

            {issue.adminNotes.length > 0 && (
              <div className="space-y-2">
                {issue.adminNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span className="font-semibold text-teal-700">{note.author}</span>
                      <span>{formatRelativeTime(note.createdAt)}</span>
                    </div>
                    <p className="text-slate-800">{note.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-l-2 border-slate-200 ml-2 pl-4 space-y-2.5">
              {issue.history.map((entry, idx) => (
                <div key={idx} className="text-xs">
                  <div className="text-slate-800 font-medium">{entry.action}</div>
                  <div className="text-[11px] text-slate-500">
                    {entry.actor} · {formatRelativeTime(entry.at)}
                  </div>
                </div>
              ))}
            </div>

            {issueFlags.length > 0 && (
              <div className="pt-2 text-xs text-rose-700">
                {issueFlags.length} community flag(s) recorded on this report.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 11. NOTIFICATIONS DRAWER
// ============================================================================

function NotificationsDrawer() {
  const {
    data,
    currentUser,
    notificationsOpen,
    setNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedIssueId
  } = useFriction();

  if (!notificationsOpen) return null;

  const userNotifs = data.notifications.filter((n) => n.userId === currentUser.id);
  const unreadCount = userNotifs.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600">Updates for {currentUser.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setNotificationsOpen(false)}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {userNotifs.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No notifications yet for {currentUser.name}.
            </div>
          ) : (
            userNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.issueId) {
                    setSelectedIssueId(n.issueId);
                    setNotificationsOpen(false);
                  }
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  n.read
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : 'bg-teal-50 border-teal-500/35'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                    {n.title}
                  </span>
                  <span className="text-[11px] text-slate-500">{formatRelativeTime(n.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 12. ADMINISTRATOR INTERFACE (OVERVIEW, MODERATION, DUPLICATES, FLAGS)
// ============================================================================

function AdminDashboard({ section }) {
  if (section === 'admin-moderation') return <AdminModerationView />;
  if (section === 'admin-duplicates') return <AdminDuplicatesView />;
  if (section === 'admin-flags') return <AdminFlagsView />;
  if (section === 'admin-settings') return <AdminSettingsView />;
  return <AdminOverviewView />;
}

function AdminOverviewView() {
  const { data, setActiveTab, setSelectedIssueId } = useFriction();

  const canonicalIssues = useMemo(
    () =>
      data.issues
        .filter((i) => !i.parentCanonicalId)
        .map((i) => ({ ...i, metrics: frictionService.computeIssueMetrics(i, data.issues) })),
    [data.issues]
  );

  const metrics = useMemo(() => {
    const total = data.issues.length;
    const pending = data.issues.filter((i) => i.status === 'Pending Review').length;
    const published = canonicalIssues.filter((i) => i.status === 'Published').length;
    const inProgress = canonicalIssues.filter((i) => i.status === 'In Progress').length;
    const resolved = canonicalIssues.filter((i) => i.status === 'Resolved').length;
    const openFlags = data.flags.filter((f) => f.status === 'open').length;
    const highPriority = canonicalIssues.filter(
      (i) => !['Rejected', 'Resolved'].includes(i.status) && i.metrics.isHighPriority
    ).length;

    return { total, pending, published, inProgress, resolved, openFlags, highPriority };
  }, [data.issues, data.flags, canonicalIssues]);

  // Category distribution from real state
  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const count = data.issues.filter((i) => i.category === cat.id && i.status !== 'Rejected').length;
      return { ...cat, count };
    }).sort((a, b) => b.count - a.count);
  }, [data.issues]);

  // Severity distribution
  const severityStats = useMemo(() => {
    return [3, 2, 1].map((s) => {
      const count = canonicalIssues.filter((i) => i.status !== 'Rejected' && Number(i.severity) === s).length;
      return {
        s,
        label: s === 3 ? 'S3 · Critical' : s === 2 ? 'S2 · Disruptive' : 'S1 · Minor',
        count,
        color: s === 3 ? 'bg-rose-400' : s === 2 ? 'bg-amber-500' : 'bg-sky-400'
      };
    });
  }, [canonicalIssues]);

  // Building distribution
  const locationStats = useMemo(() => {
    return CAMPUS_BUILDINGS.map((bld) => {
      const bldIssues = canonicalIssues.filter((i) => i.buildingId === bld.id && i.status !== 'Rejected');
      const totalAfs = bldIssues.reduce((sum, i) => sum + i.metrics.afs, 0);
      return { ...bld, count: bldIssues.length, totalAfs: Math.round(totalAfs * 10) / 10 };
    }).sort((a, b) => b.totalAfs - a.totalAfs);
  }, [canonicalIssues]);

  // Highest-priority canonical issues ranked by AFS
  const topPriorityIssues = useMemo(() => {
    return canonicalIssues
      .filter((i) => !['Rejected', 'Resolved'].includes(i.status))
      .sort((a, b) => b.metrics.afs - a.metrics.afs)
      .slice(0, 6);
  }, [canonicalIssues]);

  // Recent moderation activity
  const recentActivity = useMemo(() => {
    const entries = [];
    data.issues.forEach((iss) => {
      iss.history.forEach((h) => {
        entries.push({ ...h, refId: iss.refId, issueId: iss.id });
      });
    });
    return entries.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);
  }, [data.issues]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-700 text-xs font-medium mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Campus Facilities Command Center
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Administrator Operations Overview</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time triage metrics, Actionable Friction Score (AFS) prioritization rankings, and campus hotspot telemetry.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab('admin-moderation')}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition cursor-pointer"
          >
            Review Pending ({metrics.pending})
          </button>
          <button
            onClick={() => setActiveTab('admin-flags')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium text-xs transition cursor-pointer"
          >
            Open Flags ({metrics.openFlags})
          </button>
        </div>
      </div>

      {/* 7 Live Admin KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Reports', value: metrics.total, accent: 'text-slate-900' },
          { label: 'Pending Review', value: metrics.pending, accent: 'text-amber-700' },
          { label: 'Published', value: metrics.published, accent: 'text-sky-700' },
          { label: 'In Progress', value: metrics.inProgress, accent: 'text-indigo-700' },
          { label: 'Resolved', value: metrics.resolved, accent: 'text-emerald-700' },
          { label: 'Open Flags', value: metrics.openFlags, accent: 'text-rose-700' },
          { label: 'High Priority', value: metrics.highPriority, accent: 'text-teal-600' }
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl shadow-sm p-3.5">
            <div className="text-[11px] text-slate-600">{kpi.label}</div>
            <div className={`text-2xl font-bold mt-1 ${kpi.accent}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Priority Queue Table with R, V, S and AFS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Highest-Priority Canonical Issues (Ranked by AFS)
            </h2>
            <p className="text-xs text-slate-600">
              AFS = (R + 0.5V) × S — Prioritization indicator combining independent reports (R), student confirmations (V), and reviewed severity (S).
            </p>
          </div>
          <button
            onClick={() => setActiveTab('admin-moderation')}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
          >
            Manage all issues →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-500">
                <th className="py-2.5 px-3">Ref</th>
                <th className="py-2.5 px-3">Issue &amp; Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">R (Reports)</th>
                <th className="py-2.5 px-3 text-center">V (Confirms)</th>
                <th className="py-2.5 px-3 text-center">S (Severity)</th>
                <th className="py-2.5 px-3 text-right">AFS Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {topPriorityIssues.map((iss) => (
                <tr
                  key={iss.id}
                  onClick={() => setSelectedIssueId(iss.id)}
                  className="hover:bg-slate-200 cursor-pointer transition"
                >
                  <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{iss.refId}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{iss.title}</div>
                    <div className="text-[11px] text-slate-600">
                      {getBuildingName(iss.buildingId)} · {iss.category}
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={iss.status} />
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-800">{iss.metrics.R}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-800">{iss.metrics.V}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-800">{iss.metrics.S}×</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <AfsBadge afs={iss.metrics.afs} isHighPriority={iss.metrics.isHighPriority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Distributions: Category, Severity, Campus Location, Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            Category Distribution
          </h3>
          <div className="space-y-2.5">
            {categoryStats.map((cat) => {
              const max = Math.max(...categoryStats.map((c) => c.count), 1);
              const pct = Math.round((cat.count / max) * 100);
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700">{cat.label}</span>
                    <span className="font-mono text-slate-600">{cat.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            Issues &amp; AFS by Location
          </h3>
          <div className="space-y-2.5">
            {locationStats.map((loc) => {
              const maxAfs = Math.max(...locationStats.map((l) => l.totalAfs), 1);
              const pct = Math.round((loc.totalAfs / maxAfs) * 100);
              return (
                <div key={loc.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700">{loc.shortName}</span>
                    <span className="font-mono text-slate-600">
                      {loc.count} iss · AFS {loc.totalAfs.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Distribution & Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Severity Breakdown</h3>
            <div className="space-y-2.5">
              {severityStats.map((item) => {
                const total = Math.max(
                  severityStats.reduce((a, b) => a + b.count, 0),
                  1
                );
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.s} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700">{item.label}</span>
                      <span className="font-mono text-slate-600">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2.5">
              Recent Audit Activity
            </h3>
            <div className="space-y-2">
              {recentActivity.map((act, idx) => (
                <div key={idx} className="text-[11px] leading-snug">
                  <span className="font-mono text-teal-600 mr-1.5">{act.refId}</span>
                  <span className="text-slate-700">{act.action}</span>
                  <span className="text-slate-500 ml-1">· {formatRelativeTime(act.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 13. ADMIN REPORT MODERATION QUEUE
// ============================================================================

function AdminModerationView() {
  const { data, moderateIssue, setSelectedIssueId, recordAbuse } = useFriction();
  const [filter, setFilter] = useState('PENDING'); // PENDING | ALL | Published | In Progress | Needs Clarification | Resolved | Rejected
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState(null); // { issue, mode: 'reject' | 'clarify' | 'note' }
  const [inputText, setInputText] = useState('');

  const filteredIssues = useMemo(() => {
    return data.issues
      .map((i) => ({ ...i, metrics: frictionService.computeIssueMetrics(i, data.issues) }))
      .filter((i) => {
        if (filter === 'PENDING' && !['Pending Review', 'Needs Clarification', 'Flagged'].includes(i.status)) {
          return false;
        }
        if (filter !== 'ALL' && filter !== 'PENDING' && i.status !== filter) {
          return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            i.title.toLowerCase().includes(q) ||
            i.refId.toLowerCase().includes(q) ||
            i.reporterName.toLowerCase().includes(q) ||
            getBuildingName(i.buildingId).toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.metrics.afs - a.metrics.afs);
  }, [data.issues, filter, search]);

  const executeModalAction = (e) => {
    e.preventDefault();
    if (!actionModal) return;
    const { issue, mode } = actionModal;
    if (!inputText.trim()) return;

    if (mode === 'reject') {
      moderateIssue(issue.id, {
        status: 'Rejected',
        adminNote: `Rejected: ${inputText.trim()}`,
        notifyType: 'rejected',
        notifyTitle: 'Report Rejected by Moderation',
        notifyMessage: `Your report ${issue.refId} (${issue.title}) was rejected: ${inputText.trim()}`
      });
    } else if (mode === 'clarify') {
      moderateIssue(issue.id, {
        status: 'Needs Clarification',
        adminNote: `Clarification Requested: ${inputText.trim()}`,
        notifyType: 'clarification',
        notifyTitle: 'Clarification Requested on Your Report',
        notifyMessage: `Admin requested details on ${issue.refId}: "${inputText.trim()}"`
      });
    } else if (mode === 'abuse') {
      recordAbuse(issue.reporterId, inputText.trim());
    } else if (mode === 'note') {
      moderateIssue(issue.id, {
        adminNote: inputText.trim(),
        notifyType: 'update',
        notifyTitle: 'Official Note Added to Your Report',
        notifyMessage: `Admin note on ${issue.refId}: "${inputText.trim()}"`
      });
    }

    setActionModal(null);
    setInputText('');
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Report Moderation &amp; Triage Queue</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Verify pending submissions, calibrate severity multipliers (S), update resolution status, and notify students.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by ID, student, title..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'PENDING', label: 'Needs Triage (Pending / Clarification)' },
          { id: 'ALL', label: 'All Reports' },
          { id: 'Published', label: 'Published' },
          { id: 'In Progress', label: 'In Progress' },
          { id: 'Resolved', label: 'Resolved' },
          { id: 'Rejected', label: 'Rejected' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filter === tab.id
                ? 'bg-teal-600 text-white font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Moderation Cards */}
      <div className="space-y-3.5">
        {filteredIssues.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center text-xs text-slate-600">
            No reports match this moderation queue filter.
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const { metrics } = issue;
            return (
              <div
                key={issue.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-slate-600">{issue.refId}</span>
                      <StatusBadge status={issue.status} />
                      <SeverityBadge severity={issue.severity} />
                      <AfsBadge afs={metrics.afs} isHighPriority={metrics.isHighPriority} />
                    </div>
                    <button
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="text-left text-base font-bold text-slate-900 hover:text-teal-700 transition cursor-pointer"
                    >
                      {issue.title}
                    </button>
                    <p className="text-xs text-slate-600">
                      {getBuildingName(issue.buildingId)}
                      {issue.floorRoom ? ` · ${issue.floorRoom}` : ''} · {issue.category} · Submitted by{' '}
                      <strong className="text-slate-800">{issue.reporterName}</strong> (
                      {formatRelativeTime(issue.createdAt)})
                    </p>
                  </div>

                  {/* Quick Severity & Status Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Severity Multiplier"
                      value={issue.severity}
                      onChange={(e) =>
                        moderateIssue(issue.id, {
                          severity: Number(e.target.value),
                          notifyType: 'update',
                          notifyTitle: 'Severity Calibrated by Admin',
                          notifyMessage: `Severity for ${issue.refId} set to S${e.target.value}.`
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    >
                      <option value={1}>S1 · Minor</option>
                      <option value={2}>S2 · Disruptive</option>
                      <option value={3}>S3 · Critical</option>
                    </select>

                    <select
                      aria-label="Issue Status"
                      value={issue.status}
                      onChange={(e) =>
                        moderateIssue(issue.id, {
                          status: e.target.value,
                          notifyType: e.target.value === 'Resolved' ? 'resolved' : 'progress',
                          notifyTitle: `Issue Status: ${e.target.value}`,
                          notifyMessage: `Your report ${issue.refId} (${issue.title}) was updated to ${e.target.value}.`
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    >
                      {Object.keys(STATUS_META).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {issue.statusReason && issue.status === 'Pending Review' && (


                  <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">{issue.statusReason}</p>


                )}

                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                  {issue.description}
                </p>

                {/* Moderation Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-xs text-slate-600 font-mono">
                    R={metrics.R} · V={metrics.V} · S={metrics.S} → AFS {metrics.afs.toFixed(1)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {issue.status !== 'Published' && issue.status !== 'In Progress' && issue.status !== 'Resolved' && (
                      <button
                        onClick={() =>
                          moderateIssue(issue.id, {
                            status: 'Published',
                            notifyType: 'approved',
                            notifyTitle: 'Report Approved & Published',
                            notifyMessage: `Your report ${issue.refId} (${issue.title}) has been verified and published to the campus map.`
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve &amp; Publish
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActionModal({ issue, mode: 'clarify' });
                        setInputText('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 border border-amber-500/30 text-xs font-medium transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Request Clarification
                    </button>

                    <button
                      onClick={() => {
                        setActionModal({ issue, mode: 'note' });
                        setInputText('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-medium transition cursor-pointer"
                    >
                      Add Note
                    </button>

                    <button
                      onClick={() => {
                        setActionModal({ issue, mode: 'abuse' });
                        setInputText('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-medium transition cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Confirm abuse
                    </button>

                    {issue.status !== 'Rejected' && (
                      <button
                        onClick={() => {
                          setActionModal({ issue, mode: 'reject' });
                          setInputText('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 border border-rose-500/30 text-xs font-medium transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Reason Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <form
            onSubmit={executeModalAction}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 w-full max-w-md space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900">
              {actionModal.mode === 'abuse'
                ? `Confirm misuse by ${actionModal.issue.reporterName}`
                : actionModal.mode === 'reject'
                ? `Reject Report ${actionModal.issue.refId}`
                : actionModal.mode === 'clarify'
                ? `Request Clarification (${actionModal.issue.refId})`
                : `Add Official Admin Note (${actionModal.issue.refId})`}
            </h3>
            <p className="text-xs text-slate-600">
              {actionModal.mode === 'abuse'
                ? 'Records a strike on the reporter: 1st is a warning, 2nd restricts new reports for 24 hours, 3rd for 7 days. Use only for confirmed misuse, not honest mistakes. The student is notified.'
                : actionModal.mode === 'reject'
                ? 'Provide a clear reason for declining this submission. The student will be notified.'
                : actionModal.mode === 'clarify'
                ? 'Specify what missing location, timing, or diagnostic details the student should provide.'
                : 'This note will be logged on the public issue audit timeline.'}
            </p>
            <textarea
              rows={3}
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter message..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
              >
                Confirm &amp; Notify
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 14. ADMIN DUPLICATE & GROUP MANAGEMENT
// ============================================================================

function AdminDuplicatesView() {
  const { data, linkIssueToCanonical, unlinkIssue, setSelectedIssueId } = useFriction();
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedCanonicalId, setSelectedCanonicalId] = useState('');
  const [linkMode, setLinkMode] = useState('independent'); // 'independent' | 'true_duplicate'

  const canonicalCandidates = useMemo(
    () => data.issues.filter((i) => !i.parentCanonicalId && i.status !== 'Rejected'),
    [data.issues]
  );

  const linkableCandidates = useMemo(
    () => data.issues.filter((i) => !i.parentCanonicalId && i.status !== 'Rejected'),
    [data.issues]
  );

  const linkedIssues = useMemo(
    () => data.issues.filter((i) => Boolean(i.parentCanonicalId)),
    [data.issues]
  );

  const handleLink = (e) => {
    e.preventDefault();
    if (!selectedChildId || !selectedCanonicalId || selectedChildId === selectedCanonicalId) return;
    linkIssueToCanonical(selectedChildId, selectedCanonicalId, linkMode);
    setSelectedChildId('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-teal-600" />
          Duplicate &amp; Independent Report Grouping
        </h1>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl">
          FRICTION distinguishes between <strong>True Duplicates</strong> (same single occurrence; does not increase R) and{' '}
          <strong>Independent Reports</strong> (different students reporting the same recurring issue; increments R when accepted). Nothing is ever auto-deleted.
        </p>
      </div>

      {/* Interactive Linker Tool */}
      <form
        onSubmit={handleLink}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Link a Report to a Canonical Issue</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1.5">
              1. Select Report to Link (Child)
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
            >
              <option value="">-- Choose standalone report --</option>
              {linkableCandidates.map((iss) => (
                <option key={iss.id} value={iss.id}>
                  {iss.refId} · {iss.title} ({getBuildingName(iss.buildingId)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1.5">
              2. Select Parent Canonical Issue
            </label>
            <select
              value={selectedCanonicalId}
              onChange={(e) => setSelectedCanonicalId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
            >
              <option value="">-- Choose primary canonical issue --</option>
              {canonicalCandidates
                .filter((c) => c.id !== selectedChildId)
                .map((iss) => (
                  <option key={iss.id} value={iss.id}>
                    {iss.refId} · {iss.title} ({getBuildingName(iss.buildingId)})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Relationship Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLinkMode('independent')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              linkMode === 'independent'
                ? 'bg-teal-500/10 border-teal-600 text-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="text-xs font-bold mb-0.5">Group as Independent Report (+R)</div>
            <div className="text-[11px] text-slate-600">
              Different student independently experienced the same recurring problem. Increases R and AFS.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLinkMode('true_duplicate')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              linkMode === 'true_duplicate'
                ? 'bg-teal-500/10 border-teal-600 text-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="text-xs font-bold mb-0.5">Link as True Duplicate (No +R)</div>
            <div className="text-[11px] text-slate-600">
              Exact same occurrence already logged. Merges unique student confirmations without inflating R.
            </div>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedChildId || !selectedCanonicalId}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-xs transition cursor-pointer"
          >
            <Link2 className="w-4 h-4" />
            Link Reports &amp; Recalculate AFS
          </button>
        </div>
      </form>

      {/* Currently Linked Relationships */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Active Grouped &amp; Duplicate Links ({linkedIssues.length})
        </h2>

        {linkedIssues.length === 0 ? (
          <p className="text-xs text-slate-600 py-4">No reports are currently linked to a parent issue.</p>
        ) : (
          <div className="space-y-2.5">
            {linkedIssues.map((child) => {
              const parent = data.issues.find((i) => i.id === child.parentCanonicalId);
              return (
                <div
                  key={child.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-slate-600">{child.refId}</span>
                      <span className="font-semibold text-slate-900">{child.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          child.linkType === 'true_duplicate'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-sky-500/15 text-sky-700'
                        }`}
                      >
                        {child.linkType === 'true_duplicate'
                          ? 'True Duplicate (R unchanged)'
                          : 'Independent Report (+1 R)'}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Linked under canonical issue:{' '}
                      <button
                        onClick={() => parent && setSelectedIssueId(parent.id)}
                        className="text-teal-600 hover:underline font-medium cursor-pointer"
                      >
                        {parent?.refId} · {parent?.title}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm('Unlink this report from its canonical issue? Scores will be recalculated.')) unlinkIssue(child.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-500/15 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-medium self-start sm:self-auto cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    Unlink
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 15. ADMIN FLAG MANAGEMENT VIEW
// ============================================================================

function AdminSettingsView() {
  const { authUser } = useAuth();
  const { dailyLimit, updateDailyLimit, showToast } = useFriction();
  const [limitInput, setLimitInput] = useState(String(dailyLimit));
  const [restrictedUsers, setRestrictedUsers] = useState([]);

  const loadRestrictedUsers = async () => setRestrictedUsers(await remoteStore.listFlaggedUsers());
  const [rules, setRules] = useState({ autoPublish: true, blockedWords: '', flagThreshold: 3 });
  useEffect(() => {
    if (authUser) remoteStore.getModerationSettings().then(setRules);
  }, [authUser?.id]);
  const isThresholdValid = Number.isInteger(rules.flagThreshold) && rules.flagThreshold >= 1 && rules.flagThreshold <= 20;
  const saveRules = async () => {
    const { error } = await remoteStore.saveModerationSettings(rules);
    if (error) showToast(remoteStore.friendlyError(error), 'error');
    else showToast('Moderation rules saved.');
  };

  useEffect(() => setLimitInput(String(dailyLimit)), [dailyLimit]);
  useEffect(() => {
    if (authUser) loadRestrictedUsers();
  }, [authUser?.id]);

  const limitValue = Number(limitInput);
  const isLimitValid = Number.isInteger(limitValue) && limitValue >= 1 && limitValue <= 20;

  const liftRestriction = async (userId) => {
    const { error } = await remoteStore.liftRestriction(userId);
    if (error) return showToast(remoteStore.friendlyError(error), 'error');
    showToast('Restriction lifted.');
    loadRestrictedUsers();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-teal-600" />
          Anti-spam Settings &amp; Account Restrictions
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Configure the reporting limit and review accounts with confirmed misuse. Use &ldquo;Confirm abuse&rdquo; on a report in the Moderation Queue to record a strike.
        </p>
      </div>

      {!authUser ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800">
          These settings are stored in the database. Sign in with an administrator account to change them.
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">New reports per student</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="daily-limit" className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Maximum per rolling 24 hours (1 to 20)
                </label>
                <input
                  id="daily-limit"
                  type="number"
                  min={1}
                  max={20}
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>
              <button
                onClick={() => updateDailyLimit(limitValue)}
                disabled={!isLimitValid || limitValue === dailyLimit}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm cursor-pointer"
              >
                Save limit
              </button>
            </div>
            {!isLimitValid && <p className="text-xs text-rose-600 mt-2">Enter a whole number from 1 to 20.</p>}
            <p className="text-[11px] text-slate-500 mt-3">Enforced by the database, so it applies to every student immediately.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Automatic publishing &amp; content checks</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reports that pass every check go live immediately. A report is held for review if it has a link, blocked language, gibberish, repeats a recent report, or the account has a strike.
              </p>
            </div>
            <label htmlFor="auto-publish" className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
              <input
                id="auto-publish"
                type="checkbox"
                checked={rules.autoPublish}
                onChange={(e) => setRules({ ...rules, autoPublish: e.target.checked })}
                className="w-4 h-4 accent-teal-600"
              />
              Publish reports automatically when they pass the checks (off = every report waits for an admin)
            </label>
            <div>
              <label htmlFor="blocked-words" className="block text-xs font-semibold text-slate-800 mb-1.5">Blocked words (comma separated)</label>
              <textarea
                id="blocked-words"
                rows={2}
                value={rules.blockedWords}
                onChange={(e) => setRules({ ...rules, blockedWords: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label htmlFor="flag-threshold" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Open flags that move a published report back to review (1 to 20)
              </label>
              <input
                id="flag-threshold"
                type="number"
                min={1}
                max={20}
                value={rules.flagThreshold}
                onChange={(e) => setRules({ ...rules, flagThreshold: Number(e.target.value) })}
                className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
              />
              {!isThresholdValid && <p className="text-xs text-rose-600 mt-1">Enter a whole number from 1 to 20.</p>}
            </div>
            <button
              onClick={saveRules}
              disabled={!isThresholdValid}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm cursor-pointer"
            >
              Save moderation rules
            </button>
          </div>


          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Accounts with strikes or restrictions</h2>
            <p className="text-[11px] text-slate-500 mb-3">1st strike is a warning, 2nd restricts new reports for 24 hours, 3rd and later for 7 days.</p>
            {restrictedUsers.length === 0 ? (
              <p className="text-xs text-slate-600 py-4">No accounts have strikes or active restrictions.</p>
            ) : (
              <div className="space-y-2.5">
                {restrictedUsers.map((user) => {
                  const isRestricted = user.restricted_until && new Date(user.restricted_until) > new Date();
                  return (
                    <div key={user.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{user.full_name || user.email}</div>
                        <div className="text-slate-600">
                          {user.abuse_strikes} {user.abuse_strikes === 1 ? 'strike' : 'strikes'} ·{' '}
                          {isRestricted
                            ? `Restricted until ${new Date(user.restricted_until).toLocaleString()}`
                            : 'No active restriction'}
                        </div>
                      </div>
                      {isRestricted && (
                        <button
                          onClick={() => liftRestriction(user.id)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-medium cursor-pointer"
                        >
                          Lift restriction
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AdminFlagsView() {
  const { data, resolveFlag, moderateIssue, setSelectedIssueId } = useFriction();

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Flag className="w-5 h-5 text-rose-600" />
          Community Flag Review Queue
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          A student flag triggers human review—it does not automatically invalidate a report. Dismiss invalid flags or take moderation action.
        </p>
      </div>

      <div className="space-y-3">
        {data.flags.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center text-xs text-slate-600">
            No flags have been submitted.
          </div>
        ) : (
          data.flags.map((flg) => {
            const issue = data.issues.find((i) => i.id === flg.issueId);
            if (!issue) return null;

            return (
              <div
                key={flg.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                        flg.status === 'open'
                          ? 'bg-rose-500/15 text-rose-700 border border-rose-500/30'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {flg.status}
                    </span>
                    <span className="text-xs font-semibold text-rose-700">{flg.reason}</span>
                    <span className="text-xs text-slate-500">
                      Flagged by {flg.flaggedByName} · {formatRelativeTime(flg.createdAt)}
                    </span>
                  </div>

                  {flg.details && <p className="text-xs text-slate-700">&ldquo;{flg.details}&rdquo;</p>}

                  <div className="pt-1 text-xs text-slate-600">
                    Target Report:{' '}
                    <button
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="text-teal-600 hover:underline font-medium cursor-pointer"
                    >
                      {issue.refId} — {issue.title}
                    </button>{' '}
                    ({issue.status})
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Inspect Issue
                  </button>

                  {flg.status === 'open' && (
                    <>
                      <button
                        onClick={() => resolveFlag(flg.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 border border-emerald-500/30 text-xs font-medium cursor-pointer"
                      >
                        Dismiss Flag (Keep Report)
                      </button>
                      <button
                        onClick={() => {
                          moderateIssue(issue.id, {
                            status: 'Needs Clarification',
                            adminNote: `Flagged for review (${flg.reason}): Please verify report details.`,
                            notifyType: 'clarification',
                            notifyTitle: 'Clarification Requested After Review',
                            notifyMessage: `Your report ${issue.refId} requires additional verification details.`
                          });
                          resolveFlag(flg.id, 'actioned');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 border border-amber-500/30 text-xs font-medium cursor-pointer"
                      >
                        Request Clarification
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 16. MAIN APPLICATION SHELL (NAVIGATION, ROLE SWITCHER, DEMO BANNER)
// ============================================================================

function ProfileView() {
  const { data, currentUser, setSelectedIssueId, setActiveTab, dailyLimit } = useFriction();
  const { authUser, profile, profileError, refreshProfile, signOut } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const myReports = useMemo(
    () => data.issues.filter((i) => i.reporterId === currentUser.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [data.issues, currentUser.id]
  );
  const confirmationsGiven = useMemo(
    () => data.issues.filter((i) => !i.parentCanonicalId && i.reporterId !== currentUser.id && (i.confirmedByUserIds || []).includes(currentUser.id)).length,
    [data.issues, currentUser.id]
  );
  const flagsRaised = data.flags.filter((f) => f.flaggedByUserId === currentUser.id).length;
  const quota = frictionService.getUserDailySubmissionStats(currentUser.id, data.issues);
  const resolvedCount = myReports.filter((i) => i.status === 'Resolved').length;
  const awaitingCount = myReports.filter((i) => ['Pending Review', 'Needs Clarification'].includes(i.status)).length;
  const isRestricted = profile?.restricted_until && new Date(profile.restricted_until) > new Date();
  const isAdmin = currentUser.role === 'admin';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
  };

  const statTiles = isAdmin
    ? [
        { label: 'Awaiting review', value: data.issues.filter((i) => ['Pending Review', 'Needs Clarification', 'Flagged'].includes(i.status)).length },
        { label: 'Open flags', value: data.flags.filter((f) => f.status === 'open').length },
        { label: 'Total reports', value: data.issues.length },
        { label: 'Resolved', value: data.issues.filter((i) => i.status === 'Resolved').length }
      ]
    : [
        { label: 'Reports submitted', value: myReports.length },
        { label: 'Resolved', value: resolvedCount },
        { label: 'Awaiting review', value: awaitingCount },
        { label: 'Issues confirmed', value: confirmationsGiven }
      ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-gradient-to-br from-teal-50 via-white to-sky-50 border border-teal-100 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        {authUser?.avatarUrl ? (
          <img src={authUser.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-20 h-20 rounded-2xl object-cover border border-white shadow" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-teal-100 text-teal-800 text-2xl font-bold flex items-center justify-center">
            {currentUser.avatar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{currentUser.name}</h1>
          <p className="text-sm text-slate-600 truncate">{authUser ? authUser.email : currentUser.department}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isAdmin ? 'bg-amber-500/15 text-amber-800 border-amber-500/30' : 'bg-teal-500/10 text-teal-800 border-teal-500/30'}`}>
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              {isAdmin ? 'Administrator' : 'Student'}
            </span>
            {authUser && profile?.created_at && (
              <span className="text-xs text-slate-500">Member since {new Date(profile.created_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        {authUser && (
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh role
            </button>
            <button onClick={signOut} className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-xs font-medium text-slate-800 hover:text-rose-700 cursor-pointer">
              Sign out
            </button>
          </div>
        )}
      </div>

      {profileError && (
        <div role="alert" className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <strong>Could not read your profile from the database:</strong> {profileError} The app is treating you as a student until this is fixed.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statTiles.map((tile) => (
          <div key={tile.label} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <div className="text-[11px] text-slate-600">{tile.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{tile.value}</div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-2.5 text-xs">
          <h2 className="text-sm font-semibold text-slate-900">Reporting status</h2>
          <div className="flex justify-between"><span className="text-slate-600">Reports left today</span><span className="font-semibold text-slate-900">{quota.remaining} of {quota.maxPerDay} (rolling 24 hours)</span></div>
          <div className="flex justify-between"><span className="text-slate-600">Flags you have raised</span><span className="font-semibold text-slate-900">{flagsRaised}</span></div>
          {authUser && (
            <div className="flex justify-between">
              <span className="text-slate-600">Account standing</span>
              <span className={`font-semibold ${isRestricted ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isRestricted
                  ? `Restricted until ${new Date(profile.restricted_until).toLocaleString()}`
                  : profile?.abuse_strikes > 0 ? `Good, with ${profile.abuse_strikes} recorded ${profile.abuse_strikes === 1 ? 'warning' : 'strikes'}` : 'Good'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">{isAdmin ? 'Quick links' : 'Your recent reports'}</h2>
          {!isAdmin && myReports.length > 0 && (
            <button onClick={() => setActiveTab('my-reports')} className="text-xs text-teal-700 hover:underline font-medium cursor-pointer">View all</button>
          )}
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('admin-moderation')} className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer">Moderation queue</button>
            <button onClick={() => setActiveTab('admin-flags')} className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 cursor-pointer">Flag management</button>
            <button onClick={() => setActiveTab('admin-settings')} className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 cursor-pointer">Settings &amp; abuse</button>
          </div>
        ) : myReports.length === 0 ? (
          <p className="text-xs text-slate-600 py-4">You have not submitted any reports yet.</p>
        ) : (
          <div className="space-y-2">
            {myReports.slice(0, 5).map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-mono text-slate-500">{issue.refId}</div>
                  <div className="text-sm font-medium text-slate-900 truncate">{issue.title}</div>
                </div>
                <StatusBadge status={issue.status} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FrictionAppShell() {
  const {
    data,
    currentUser,
    switchUser,
    activeTab,
    setActiveTab,
    setNotificationsOpen,
    resetDemoData,
    toast
  } = useFriction();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authUser } = useAuth();

  const unreadNotifCount = useMemo(
    () => data.notifications.filter((n) => n.userId === currentUser.id && !n.read).length,
    [data.notifications, currentUser.id]
  );

  const pendingCount = useMemo(
    () => data.issues.filter((i) => ['Pending Review', 'Needs Clarification', 'Flagged'].includes(i.status)).length,
    [data.issues]
  );

  const openFlagsCount = useMemo(
    () => data.flags.filter((f) => f.status === 'open').length,
    [data.flags]
  );

  const studentNav = [
    { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Campus Map', icon: MapIcon },
    { id: 'report', label: 'Report an Issue', icon: PlusCircle },
    { id: 'my-reports', label: 'My Reports', icon: FileText }
  ];

  const adminNav = [
    { id: 'admin-overview', label: 'Admin Overview', icon: BarChart3 },
    { id: 'admin-moderation', label: 'Moderation Queue', icon: ShieldCheck, badge: pendingCount },
    { id: 'admin-duplicates', label: 'Duplicates & Groups', icon: GitMerge },
    { id: 'admin-flags', label: 'Flag Management', icon: Flag, badge: openFlagsCount },
    { id: 'admin-settings', label: 'Settings & Abuse', icon: SlidersHorizontal },
    { id: 'map', label: 'Campus Map View', icon: MapIcon }
  ];

  const navItems = currentUser.role === 'admin' ? adminNav : studentNav;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Prototype Disclaimer Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-700 font-mono font-semibold text-[10px]">
            HCI PROTOTYPE
          </span>
          <span>
            {authUser
              ? 'Signed in with Google. Reports are stored in this browser until the Supabase database step is connected.'
              : <>Interactive browser demo using <code className="text-slate-700">localStorage</code> persistence (not production authentication).</>}
          </span>
        </div>
        <button
          onClick={resetDemoData}
          className="inline-flex items-center gap-1 text-slate-700 hover:text-teal-700 transition cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Demo Data
        </button>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() =>
                setActiveTab(currentUser.role === 'admin' ? 'admin-overview' : 'dashboard')
              }
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-600/20">
                F
              </div>
              <div>
                <div className="font-extrabold tracking-tight text-slate-900 text-base leading-none">
                  FRICTION
                </div>
                <div className="text-[10px] text-slate-600 hidden sm:block mt-0.5">
                  Campus Issue Intelligence
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-teal-700' : 'bg-amber-500/20 text-amber-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Demo Persona Switcher + Notifications */}
          <div className="flex items-center gap-2.5">
            {authUser ? <AccountMenu onOpenProfile={() => setActiveTab('profile')} /> : (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl shadow-sm px-2.5 py-1.5">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-500 text-white'
                    : 'bg-teal-500/20 text-teal-700'
                }`}
              >
                {currentUser.avatar}
              </div>
              <select
                aria-label="Switch Demo Persona"
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <optgroup label="Student Personas" className="bg-white text-slate-800">
                  {DEMO_USERS.filter((u) => u.role === 'student').map((u) => (
                    <option key={u.id} value={u.id}>
                      Student: {u.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Campus Administration" className="bg-white text-slate-800">
                  {DEMO_USERS.filter((u) => u.role === 'admin').map((u) => (
                    <option key={u.id} value={u.id}>
                      Admin: {u.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            )}

            {/* Notifications Bell */}
            <button
              onClick={() => setNotificationsOpen(true)}
              aria-label="Open Notifications"
              className="relative p-2.5 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 text-slate-800 transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive ? 'bg-teal-600 text-white font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-amber-700 text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && <StudentDashboard />}
        {activeTab === 'map' && <CampusMapView />}
        {activeTab === 'report' && <ReportIssueView />}
        {activeTab === 'my-reports' && <MyReportsView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab.startsWith('admin-') && <AdminDashboard section={activeTab} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-5 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-700">FRICTION</strong> — Making everyday campus problems impossible to ignore.
          </div>
          <div>
            Actionable Friction Score: <code className="text-slate-600">AFS = (R + 0.5V) × S</code> · Prioritization Indicator
          </div>
        </div>
      </footer>

      {/* Global Modals & Overlays */}
      <IssueDetailsModal />
      <NotificationsDrawer />

      {/* Live Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-white border border-teal-500/40 text-slate-800 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <FrictionProvider>
      <FrictionAppShell />
    </FrictionProvider>
  );
}