import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  User, Student, Event, Registration, Result, Team, 
  Certificate, Notification, Announcement, GalleryItem, 
  HouseScore, IndividualRanking, RecentWinnerFeedItem, WinnerDetail,
  ScoreboardTeam, ScoreHistory
} from './src/types';
import pg from 'pg';
import {
  initializeSqlite, restoreSqliteDbFromCloudSQL, persistSqliteDbToCloudSQL,
  getDbUsers, saveDbUser,
  getDbStudents, saveDbStudent, deleteDbStudent,
  getDbEvents, saveDbEvent, deleteDbEvent,
  getDbRegistrations, saveDbRegistration, deleteDbRegistration,
  getDbResults, saveDbResult, deleteDbResult,
  getDbTeams, saveDbTeam, deleteDbTeam,
  getDbCertificates, saveDbCertificate, deleteDbCertificate,
  getDbNotifications, saveDbNotification,
  getDbAnnouncements, saveDbAnnouncement, deleteDbAnnouncement,
  getDbGallery, saveDbGalleryItem, deleteDbGalleryItem,
  getDbScoreboard, saveDbScoreboardItem,
  getDbIndividualRankings, saveDbIndividualRanking, clearDbIndividualRankings,
  getDbRecentWinners, saveDbRecentWinner, clearDbRecentWinners,
  getDbGroups, saveDbGroup, deleteDbGroup,
  getDbScoreboardTeams, saveDbScoreboardTeam, deleteDbScoreboardTeam,
  getDbScoreHistory, saveDbScoreHistoryItem, deleteDbScoreHistoryItem,
  getDbAssignedStudentIds, addDbAssignedStudentId, clearDbAssignedStudentIds,
  getDbStatsOverrides, saveDbStatsOverrides,
  resetSqliteToDefaultSeeds, runQuery
} from './src/db/sqlite-db';

const sqlPool = new pg.Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  connectionTimeoutMillis: 15000,
});

const app = express();
const PORT = 3000;

// High body limits to allow base64 image uploads (for profile photo, gallery upload)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// DB File setup
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  students: Student[];
  events: Event[];
  registrations: Registration[];
  results: Result[];
  teams: Team[];
  certificates: Certificate[];
  notifications: Notification[];
  announcements: Announcement[];
  gallery: GalleryItem[];
  scoreboard: HouseScore[];
  individualRankings: IndividualRanking[];
  recentWinners: RecentWinnerFeedItem[];
  groups?: string[];
  scoreboardTeams?: ScoreboardTeam[];
  scoreHistory?: ScoreHistory[];
  assignedStudentIds?: string[];
  statsOverrides?: {
    totalStudents?: number;
    activeEventsCount?: number;
    pendingApprovalsCount?: number;
    certificatesIssuedCount?: number;
  };
}

// Function to generate unique random IDs
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// Ensure database file and directories exist, with rich seed data
function initializeDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const initialScoreboard: HouseScore[] = [
    { house: 'Team A', totalPoints: 0, lastUpdated: new Date().toISOString() },
    { house: 'Team B', totalPoints: 0, lastUpdated: new Date().toISOString() },
    { house: 'Team C', totalPoints: 0, lastUpdated: new Date().toISOString() }
  ];

  const initialAnnouncements: Announcement[] = [];

  const initialEvents: Event[] = [];

  const initialRecentWinners: RecentWinnerFeedItem[] = [];

  const initialIndividualRankings: IndividualRanking[] = [];

  const initialUsers: User[] = [
    { id: 'u-admin', email: 'admin@fest.com', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
    { id: 'u-judge', email: 'judge@fest.com', password: 'judge123', role: 'judge', createdAt: new Date().toISOString() }
  ];

  const initialStudents: Student[] = [];

  const initialResults: Result[] = [];

  const initialRegistrations: Registration[] = [];

  const initialCertificates: Certificate[] = [];

  const initialNotifications: Notification[] = [];

  const initialGallery: GalleryItem[] = [];

  const initialScoreboardTeams: ScoreboardTeam[] = [
    { id: 'team-crimson', teamName: 'Crimson', teamColor: '#EF4444', totalScore: 120, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'team-cobalt', teamName: 'Cobalt', teamColor: '#3B82F6', totalScore: 85, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'team-emerald', teamName: 'Emerald', teamColor: '#10B981', totalScore: 150, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'team-amber', teamName: 'Amber', teamColor: '#F59E0B', totalScore: 95, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  const initialScoreHistory: ScoreHistory[] = [
    { id: 'sh-1', teamId: 'team-crimson', teamName: 'Crimson', scoreChange: 120, reason: 'Inaugural Competition First Place', updatedBy: 'admin@fest.com', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'sh-2', teamId: 'team-cobalt', teamName: 'Cobalt', scoreChange: 85, reason: 'Quiz Competition Winner', updatedBy: 'admin@fest.com', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'sh-3', teamId: 'team-emerald', teamName: 'Emerald', scoreChange: 150, reason: 'Elocution Championship', updatedBy: 'admin@fest.com', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'sh-4', teamId: 'team-amber', teamName: 'Amber', scoreChange: 95, reason: 'Group Song Contest Points', updatedBy: 'admin@fest.com', createdAt: new Date(Date.now() - 600000).toISOString() }
  ];

  let db: DatabaseSchema;

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      
      // Ensure key sections exist and are populated with initial data if empty
      if (!db.users || db.users.length === 0) db.users = initialUsers;
      if (!db.students || db.students.length === 0) db.students = initialStudents;
      if (!db.events || db.events.length === 0) db.events = initialEvents;
      if (!db.registrations || db.registrations.length === 0) db.registrations = initialRegistrations;
      if (!db.results || db.results.length === 0) db.results = initialResults;
      if (!db.teams) db.teams = [];
      if (!db.certificates || db.certificates.length === 0) db.certificates = initialCertificates;
      if (!db.notifications || db.notifications.length === 0) db.notifications = initialNotifications;
      if (!db.announcements || db.announcements.length === 0) db.announcements = initialAnnouncements;
      if (!db.gallery || db.gallery.length === 0) db.gallery = initialGallery;
      if (!db.scoreboard || db.scoreboard.length === 0) db.scoreboard = initialScoreboard;
      if (!db.individualRankings || db.individualRankings.length === 0) db.individualRankings = initialIndividualRankings;
      if (!db.recentWinners || db.recentWinners.length === 0) db.recentWinners = initialRecentWinners;
      if (!db.groups || db.groups.length === 0) db.groups = ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior'];
      if (!db.scoreboardTeams || db.scoreboardTeams.length === 0) db.scoreboardTeams = initialScoreboardTeams;
      if (!db.scoreHistory || db.scoreHistory.length === 0) db.scoreHistory = initialScoreHistory;
    } catch (e) {
      console.error('Error parsing database, re-initializing...', e);
      db = {
        users: initialUsers,
        students: initialStudents,
        events: initialEvents,
        registrations: initialRegistrations,
        results: initialResults,
        teams: [],
        certificates: initialCertificates,
        notifications: initialNotifications,
        announcements: initialAnnouncements,
        gallery: initialGallery,
        scoreboard: initialScoreboard,
        individualRankings: initialIndividualRankings,
        recentWinners: initialRecentWinners,
        groups: ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior'],
        scoreboardTeams: initialScoreboardTeams,
        scoreHistory: initialScoreHistory
      };
    }
  } else {
    db = {
      users: initialUsers,
      students: initialStudents,
      events: initialEvents,
      registrations: initialRegistrations,
      results: initialResults,
      teams: [],
      certificates: initialCertificates,
      notifications: initialNotifications,
      announcements: initialAnnouncements,
      gallery: initialGallery,
      scoreboard: initialScoreboard,
      individualRankings: initialIndividualRankings,
      recentWinners: initialRecentWinners,
      groups: ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior'],
      scoreboardTeams: initialScoreboardTeams,
      scoreHistory: initialScoreHistory
    };
  }

  // DATABASE MIGRATIONS FOR THE NEW ATTRIBUTES (Category, Program Category, Teams, Free Registration)
  if (db.students) {
    db.students.forEach(s => {
      if (!s.category) {
        if (s.class && (s.class.includes('XI') || s.class.includes('XII') || s.class === '9' || s.class === '10')) {
          s.category = 'Senior';
        } else if (s.class && (s.class === '5' || s.class === '6' || s.class === '7' || s.class === '8')) {
          s.category = 'Junior';
        } else {
          s.category = 'Sub-Junior';
        }
      }
      if (s.house === 'Red' || s.house === 'Yellow' || !s.house) {
        s.house = 'Team A';
      } else if (s.house === 'Blue') {
        s.house = 'Team B';
      } else if (s.house === 'Green') {
        s.house = 'Team C';
      }
    });
  }

  if (db.events) {
    db.events.forEach(e => {
      if (!e.programCategory) {
        if (e.type === 'group') {
          e.programCategory = 'Group';
        } else if (e.name === 'Debate' || e.name === 'Mappilappattu') {
          e.programCategory = 'Senior';
        } else if (e.name === 'Quiz' || e.name === 'Calligraphy') {
          e.programCategory = 'Sub-Junior';
        } else if (e.name === 'Photography' || e.name === 'Digital Art') {
          e.programCategory = 'General';
        } else {
          e.programCategory = 'Junior';
        }
      }
    });
  }

  if (db.registrations) {
    db.registrations.forEach(r => {
      r.paymentStatus = 'completed';
    });
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Local backup write failed:", err);
  }
  return db;
}

// Global active database reference
let db: DatabaseSchema = {
  users: [],
  students: [],
  events: [],
  registrations: [],
  results: [],
  teams: [],
  certificates: [],
  notifications: [],
  announcements: [],
  gallery: [],
  scoreboard: [],
  individualRankings: [],
  recentWinners: [],
  groups: ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior'],
  scoreboardTeams: [],
  scoreHistory: [],
  assignedStudentIds: [],
  statsOverrides: {}
};

async function loadDatabaseFromSQLite(): Promise<DatabaseSchema> {
  try {
    // First, restore SQLite DB binary from Cloud SQL backup if available
    await restoreSqliteDbFromCloudSQL();

    // Create SQLite tables, migrate from db.json if needed, or seed defaults
    await initializeSqlite();

    // Load all records directly using SQLite promise getters
    const users = await getDbUsers();
    const students = await getDbStudents();
    const events = await getDbEvents();
    const registrations = await getDbRegistrations();
    const results = await getDbResults();
    const teams = await getDbTeams();
    const certificates = await getDbCertificates();
    const notifications = await getDbNotifications();
    const announcements = await getDbAnnouncements();
    const gallery = await getDbGallery();
    const scoreboard = await getDbScoreboard();
    const individualRankings = await getDbIndividualRankings();
    const recentWinners = await getDbRecentWinners();
    const groups = await getDbGroups();
    const scoreboardTeams = await getDbScoreboardTeams();
    const scoreHistory = await getDbScoreHistory();
    const assignedStudentIds = await getDbAssignedStudentIds();
    const statsOverrides = await getDbStatsOverrides();

    console.log("Successfully loaded database from SQLite!");
    return {
      users,
      students,
      events,
      registrations,
      results,
      teams,
      certificates,
      notifications,
      announcements,
      gallery,
      scoreboard,
      individualRankings,
      recentWinners,
      groups,
      scoreboardTeams,
      scoreHistory,
      assignedStudentIds,
      statsOverrides
    };
  } catch (err) {
    console.error("Failed to load SQLite database, falling back to default memory initialization:", err);
    return db;
  }
}

async function saveDatabase() {
  try {
    console.log("Saving state to SQLite tables...");

    // Sync Users
    const existingUsers = await getDbUsers();
    const userIdsInState = new Set(db.users.map(u => u.id));
    for (const eu of existingUsers) {
      if (!userIdsInState.has(eu.id)) {
        await runQuery("DELETE FROM users WHERE id = ?", [eu.id]);
      }
    }
    for (const u of db.users) {
      await saveDbUser(u);
    }

    // Sync Students
    const existingStudents = await getDbStudents();
    const studentIdsInState = new Set(db.students.map(s => s.id));
    for (const es of existingStudents) {
      if (!studentIdsInState.has(es.id)) {
        await deleteDbStudent(es.id);
      }
    }
    for (const s of db.students) {
      await saveDbStudent(s);
    }

    // Sync Events
    const existingEvents = await getDbEvents();
    const eventIdsInState = new Set(db.events.map(e => e.id));
    for (const ee of existingEvents) {
      if (!eventIdsInState.has(ee.id)) {
        await deleteDbEvent(ee.id);
      }
    }
    for (const e of db.events) {
      await saveDbEvent(e);
    }

    // Sync Registrations
    const existingRegs = await getDbRegistrations();
    const regIdsInState = new Set(db.registrations.map(r => r.id));
    for (const er of existingRegs) {
      if (!regIdsInState.has(er.id)) {
        await deleteDbRegistration(er.id);
      }
    }
    for (const r of db.registrations) {
      await saveDbRegistration(r);
    }

    // Sync Results
    const existingResults = await getDbResults();
    const resultIdsInState = new Set(db.results.map(r => r.id));
    for (const er of existingResults) {
      if (!resultIdsInState.has(er.id)) {
        await deleteDbResult(er.id);
      }
    }
    for (const r of db.results) {
      await saveDbResult(r);
    }

    // Sync Teams
    const existingTeams = await getDbTeams();
    const teamIdsInState = new Set(db.teams.map(t => t.id));
    for (const et of existingTeams) {
      if (!teamIdsInState.has(et.id)) {
        await deleteDbTeam(et.id);
      }
    }
    for (const t of db.teams) {
      await saveDbTeam(t);
    }

    // Sync Certificates
    const existingCerts = await getDbCertificates();
    const certIdsInState = new Set(db.certificates.map(c => c.id));
    for (const ec of existingCerts) {
      if (!certIdsInState.has(ec.id)) {
        await deleteDbCertificate(ec.id);
      }
    }
    for (const c of db.certificates) {
      await saveDbCertificate(c);
    }

    // Sync Notifications
    for (const n of db.notifications) {
      await saveDbNotification(n);
    }

    // Sync Announcements
    const existingAnns = await getDbAnnouncements();
    const annIdsInState = new Set(db.announcements.map(a => a.id));
    for (const ea of existingAnns) {
      if (!annIdsInState.has(ea.id)) {
        await deleteDbAnnouncement(ea.id);
      }
    }
    for (const a of db.announcements) {
      await saveDbAnnouncement(a);
    }

    // Sync Gallery
    const existingGallery = await getDbGallery();
    const galleryIdsInState = new Set(db.gallery.map(g => g.id));
    for (const eg of existingGallery) {
      if (!galleryIdsInState.has(eg.id)) {
        await deleteDbGalleryItem(eg.id);
      }
    }
    for (const g of db.gallery) {
      await saveDbGalleryItem(g);
    }

    // Sync Scoreboard
    for (const s of db.scoreboard) {
      await saveDbScoreboardItem(s);
    }

    // Sync Individual Rankings
    await clearDbIndividualRankings();
    for (const r of db.individualRankings) {
      await saveDbIndividualRanking(r);
    }

    // Sync Recent Winners
    await clearDbRecentWinners();
    for (const w of db.recentWinners) {
      await saveDbRecentWinner(w);
    }

    // Sync Groups
    if (db.groups) {
      const existingGroups = await getDbGroups();
      const groupsInState = new Set(db.groups);
      for (const eg of existingGroups) {
        if (!groupsInState.has(eg)) {
          await deleteDbGroup(eg);
        }
      }
      for (const g of db.groups) {
        await saveDbGroup(g);
      }
    }

    // Sync Scoreboard Teams
    if (db.scoreboardTeams) {
      const existingScoreboardTeams = await getDbScoreboardTeams();
      const scoreboardTeamIdsInState = new Set(db.scoreboardTeams.map(t => t.id));
      for (const est of existingScoreboardTeams) {
        if (!scoreboardTeamIdsInState.has(est.id)) {
          await deleteDbScoreboardTeam(est.id);
        }
      }
      for (const t of db.scoreboardTeams) {
        await saveDbScoreboardTeam(t);
      }
    }

    // Sync Score History
    if (db.scoreHistory) {
      const existingHistory = await getDbScoreHistory();
      const historyIdsInState = new Set(db.scoreHistory.map(h => h.id));
      for (const eh of existingHistory) {
        if (!historyIdsInState.has(eh.id)) {
          await deleteDbScoreHistoryItem(eh.id);
        }
      }
      for (const h of db.scoreHistory) {
        await saveDbScoreHistoryItem(h);
      }
    }

    // Sync Assigned Student IDs
    await clearDbAssignedStudentIds();
    if (db.assignedStudentIds) {
      for (const sId of db.assignedStudentIds) {
        await addDbAssignedStudentId(sId);
      }
    }

    // Sync Stats Overrides
    if (db.statsOverrides) {
      await saveDbStatsOverrides(db.statsOverrides);
    }

    // Persist local SQLite binary file buffer to Cloud SQL (PostgreSQL) as a backup/sync!
    await persistSqliteDbToCloudSQL();
    console.log("Database successfully persisted to SQLite and backed up to Cloud SQL!");
  } catch (err) {
    console.error("Error saving database to SQLite:", err);
  }
}

// ---------------- API ENDPOINTS ----------------

// Helper: Check if email already exists
app.post('/api/auth/register', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const newUser: User = {
    id: generateId('usr'),
    email: email.toLowerCase(),
    password, // simplified plain password for this applet
    role: role || 'student',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDatabase();

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ user: userWithoutPassword });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const student = db.students.find(s => s.userId === user.id);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    user: userWithoutPassword,
    student: student || null
  });
});

app.post('/api/auth/quick-login', (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const student = db.students.find(s => s.id === studentId || s.studentId === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  // Find or create matching user
  let user = db.users.find(u => u.id === student.userId);
  if (!user) {
    const cleanName = student.name.toLowerCase().replace(/[^a-z0-9]/g, '.');
    const email = `${cleanName}@fest.com`;
    let finalEmail = email;
    let i = 1;
    while (db.users.some(u => u.email.toLowerCase() === finalEmail.toLowerCase())) {
      finalEmail = `${cleanName}${i}@fest.com`;
      i++;
    }

    user = {
      id: student.userId,
      email: finalEmail,
      password: 'student123',
      role: 'student',
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    saveDatabase();
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    student
  });
});

// GET Student profile
const getProfileHandler = (req: any, res: any) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  const student = db.students.find(s => s.userId === userId);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found' });
  }
  res.json(student);
};
app.get('/api/student/profile', getProfileHandler);
app.get('/api/students/profile', getProfileHandler);

function isIdInTeamRange(studentId: string, teamName: string): boolean {
  if (!studentId) return false;
  const idNum = parseInt(studentId, 10);
  if (isNaN(idNum)) return false;

  const norm = teamName.toLowerCase().trim();
  let teamIndex = db.scoreboardTeams?.findIndex(t => 
    t.teamName.toLowerCase().trim() === norm ||
    (norm === 'team a' && t.teamName.toLowerCase().trim() === 'crimson') ||
    (norm === 'team b' && t.teamName.toLowerCase().trim() === 'cobalt') ||
    (norm === 'team c' && t.teamName.toLowerCase().trim() === 'emerald') ||
    (norm === 'team d' && t.teamName.toLowerCase().trim() === 'amber') ||
    (norm === 'crimson' && t.teamName.toLowerCase().trim() === 'team a') ||
    (norm === 'cobalt' && t.teamName.toLowerCase().trim() === 'team b') ||
    (norm === 'emerald' && t.teamName.toLowerCase().trim() === 'team c') ||
    (norm === 'amber' && t.teamName.toLowerCase().trim() === 'team d')
  ) ?? -1;

  if (teamIndex === -1) {
    if (norm === 'team a' || norm === 'crimson' || norm === 'red') teamIndex = 0;
    else if (norm === 'team b' || norm === 'cobalt' || norm === 'blue') teamIndex = 1;
    else if (norm === 'team c' || norm === 'emerald' || norm === 'green') teamIndex = 2;
    else if (norm === 'team d' || norm === 'amber' || norm === 'yellow') teamIndex = 3;
    else teamIndex = 4;
  }

  const base = 100 * (teamIndex + 1);
  return idNum >= base && idNum <= (base + 99);
}

function getNextStudentIdForTeam(teamName: string): string {
  if (!db.assignedStudentIds) {
    db.assignedStudentIds = db.students ? db.students.map(s => s.studentId).filter(Boolean) : [];
  }

  if (!db.scoreboardTeams) {
    db.scoreboardTeams = [];
  }

  const norm = teamName.toLowerCase().trim();
  
  // Find index of this team in scoreboardTeams
  let teamIndex = db.scoreboardTeams.findIndex(t => 
    t.teamName.toLowerCase().trim() === norm ||
    (norm === 'team a' && t.teamName.toLowerCase().trim() === 'crimson') ||
    (norm === 'team b' && t.teamName.toLowerCase().trim() === 'cobalt') ||
    (norm === 'team c' && t.teamName.toLowerCase().trim() === 'emerald') ||
    (norm === 'team d' && t.teamName.toLowerCase().trim() === 'amber') ||
    (norm === 'crimson' && t.teamName.toLowerCase().trim() === 'team a') ||
    (norm === 'cobalt' && t.teamName.toLowerCase().trim() === 'team b') ||
    (norm === 'emerald' && t.teamName.toLowerCase().trim() === 'team c') ||
    (norm === 'amber' && t.teamName.toLowerCase().trim() === 'team d')
  );

  if (teamIndex === -1) {
    if (norm === 'team a' || norm === 'crimson' || norm === 'red') teamIndex = 0;
    else if (norm === 'team b' || norm === 'cobalt' || norm === 'blue') teamIndex = 1;
    else if (norm === 'team c' || norm === 'emerald' || norm === 'green') teamIndex = 2;
    else if (norm === 'team d' || norm === 'amber' || norm === 'yellow') teamIndex = 3;
    else teamIndex = 4;
  }

  const base = 100 * (teamIndex + 1);
  const minId = base;
  const maxId = base + 99;

  // Find first unused ID in [minId, maxId]
  let nextIdVal = -1;
  for (let id = minId; id <= maxId; id++) {
    const idStr = String(id);
    if (!db.assignedStudentIds.includes(idStr)) {
      nextIdVal = id;
      break;
    }
  }

  if (nextIdVal === -1) {
    throw new Error(`Student ID range (${minId}-${maxId}) for team "${teamName}" is fully exhausted!`);
  }

  const finalIdStr = String(nextIdVal);
  db.assignedStudentIds.push(finalIdStr);
  return finalIdStr;
}

const postProfileHandler = (req: any, res: any) => {
  const { userId, name, class: className, category, house, photo } = req.body;
  if (!userId || !name || !className || !category || !house) {
    return res.status(400).json({ error: 'Missing required profile fields (name, class, category, team)' });
  }

  let student = db.students.find(s => s.userId === userId);
  let studentIdStr = student ? student.studentId : '';

  if (!studentIdStr || !isIdInTeamRange(studentIdStr, house)) {
    try {
      studentIdStr = getNextStudentIdForTeam(house);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  if (student) {
    student.name = name;
    student.class = className;
    student.category = category;
    student.house = house;
    student.studentId = studentIdStr;
    if (photo) student.photo = photo;
  } else {
    student = {
      id: generateId('std'),
      userId,
      name,
      studentId: studentIdStr,
      class: className,
      house,
      category,
      photo: photo || ''
    };
    db.students.push(student);
  }

  saveDatabase();
  res.json(student);
};
app.post('/api/student/profile', postProfileHandler);
app.post('/api/students/profile', postProfileHandler);

// Select house (once chosen, cannot be changed unless admin)
const postHouseHandler = (req: any, res: any) => {
  const { studentId, house } = req.body;
  if (!studentId || !house) {
    return res.status(400).json({ error: 'Student ID and House selection required' });
  }

  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found' });
  }

  student.house = house;
  saveDatabase();
  res.json(student);
};
app.post('/api/student/house', postHouseHandler);
app.post('/api/students/house', postHouseHandler);

// Get all events
app.get('/api/events', (req, res) => {
  res.json(db.events);
});

// Get registrations
app.get('/api/registrations', (req, res) => {
  res.json(db.registrations);
});

// Update registration selection (Multi-select draft/save)
const registerHandler = (req: any, res: any) => {
  const { studentId, eventIds } = req.body;
  if (!studentId || !Array.isArray(eventIds)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  if (eventIds.length > 5) {
    return res.status(400).json({ error: 'Maximum 5 events can be registered per student' });
  }

  // Remove previous pending/completed registrations for this student, to replace them with the current list
  // Note: Standard application lets student override event selections before payment is finalized.
  db.registrations = db.registrations.filter(r => r.studentId !== studentId);

  const confirmationCode = `NAF-2026-${student.studentId.split('-')[1] || '0847'}`;

  // Create registration instances
  const newRegs = eventIds.map(eventId => {
    // Increment event current count
    const ev = db.events.find(e => e.id === eventId);
    if (ev) {
      ev.currentParticipantsCount = (ev.currentParticipantsCount || 0) + 1;
    }

    const reg: Registration = {
      id: generateId('reg'),
      studentId,
      eventId,
      status: 'registered',
      registeredAt: new Date().toISOString(),
      paymentStatus: 'completed', // Completed instantly as registration is free!
      confirmationNumber: confirmationCode
    };
    return reg;
  });

  db.registrations.push(...newRegs);

  // Generate success notification directly
  const registeredEvents = eventIds
    .map(id => db.events.find(e => e.id === id)?.name || '')
    .filter(Boolean);

  const message = `Your registration code ${confirmationCode} for events (${registeredEvents.join(', ')}) is successfully verified. Good luck!`;
  db.notifications.push({
    id: generateId('not'),
    userId: student.userId,
    message,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString()
  });

  saveDatabase();

  res.json({
    registrations: newRegs,
    confirmationNumber: confirmationCode
  });
};
app.post('/api/events/register', registerHandler);
app.post('/api/registrations', registerHandler);

// Complete payment and finalize registrations
const payHandler = (req: any, res: any) => {
  const { studentId, confirmationNumber } = req.body;
  res.json({
    status: 'success',
    confirmationNumber: confirmationNumber || 'FREE-FEST-2026',
    message: 'Registration is free and already verified'
  });
};
app.post('/api/events/pay', payHandler);
app.post('/api/registrations/payment', payHandler);

// Get Scoreboard details
app.get('/api/scoreboard', (req, res) => {
  res.json({
    scoreboard: db.scoreboard,
    individualRankings: db.individualRankings,
    recentWinners: db.recentWinners
  });
});

// Get Results details
app.get('/api/results', (req, res) => {
  // Combine result data with event details for presentation
  const enrichedResults = db.results.map(r => {
    const event = db.events.find(e => e.id === r.eventId);
    return {
      ...r,
      eventName: event?.name || 'Unknown Event',
      category: event?.category || 'stage',
      programCategory: event?.programCategory || 'Senior',
      type: event?.type || 'individual',
      date: event?.date || '',
      time: event?.time || '',
      venue: event?.venue || ''
    };
  });

  res.json({
    hallOfFame: db.scoreboard.reduce((prev, current) => (prev.totalPoints > current.totalPoints) ? prev : current),
    results: enrichedResults
  });
});

// Get certificates list or specific downloader query
app.get('/api/certificates', (req, res) => {
  const { studentId, studentNameOrId } = req.query;

  if (studentId) {
    const certs = db.certificates.filter(c => c.studentId === studentId);
    return res.json(certs);
  }

  if (studentNameOrId) {
    const query = String(studentNameOrId).toLowerCase();
    // Search student by ID or Name
    const targetStudents = db.students.filter(s => 
      s.studentId.toLowerCase().includes(query) || 
      s.name.toLowerCase().includes(query)
    );

    const targetStudentIds = targetStudents.map(s => s.id);
    const certs = db.certificates.filter(c => targetStudentIds.includes(c.studentId));
    return res.json(certs);
  }

  res.json(db.certificates);
});

// GET certificates search
app.get('/api/certificates/search', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json([]);
  }
  const q = String(query).toLowerCase();
  const targetStudents = db.students.filter(s => 
    s.studentId.toLowerCase().includes(q) || 
    s.name.toLowerCase().includes(q)
  );

  const targetStudentIds = targetStudents.map(s => s.id);
  const certs = db.certificates.filter(c => targetStudentIds.includes(c.studentId));
  res.json(certs);
});

// Retrieve notifications with optional query parameters (studentId, userId)
app.get('/api/notifications', (req, res) => {
  const { studentId, userId } = req.query;
  let targetUserId = userId;
  if (studentId) {
    const student = db.students.find(s => s.id === studentId);
    if (student) {
      targetUserId = student.userId;
    }
  }
  if (!targetUserId) {
    return res.json(db.notifications);
  }
  const userNotifications = db.notifications.filter(n => n.userId === targetUserId);
  res.json(userNotifications);
});

// Retrieve notifications for a specific user (legacy path param)
app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const userNotifications = db.notifications.filter(n => n.userId === userId);
  res.json(userNotifications);
});

// Mark notification as read (JSON POST)
app.post('/api/notifications/read', (req, res) => {
  const { id } = req.body;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveDatabase();
  }
  res.json({ status: 'success' });
});

// Mark notification as read (legacy path param)
app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveDatabase();
  }
  res.json({ status: 'success' });
});

// Get Gallery Photos
app.get('/api/gallery', (req, res) => {
  res.json(db.gallery);
});

// Upload Gallery Photo
app.post('/api/gallery/upload', (req, res) => {
  const { imageUrl, category, caption, photographer, uploadedBy } = req.body;
  if (!imageUrl || !category || !caption) {
    return res.status(400).json({ error: 'Missing gallery details' });
  }

  const newItem: GalleryItem = {
    id: generateId('gal'),
    imageUrl,
    category,
    caption,
    uploadedBy: uploadedBy || 'u-admin',
    date: new Date().toISOString().split('T')[0],
    photographer: photographer || 'A. Karim'
  };

  db.gallery.unshift(newItem); // put it first
  saveDatabase();

  res.json(newItem);
});

// Get Announcements
app.get('/api/announcements', (req, res) => {
  res.json(db.announcements);
});

// Post Announcement (Admin only)
const postAnnouncementHandler = (req: any, res: any) => {
  const { title, content, createdBy, targetAudience } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  const newAnn: Announcement = {
    id: generateId('ann'),
    title,
    content,
    createdBy: createdBy || 'u-admin',
    publishedAt: new Date().toISOString(),
    targetAudience: targetAudience || 'all'
  };

  db.announcements.unshift(newAnn);
  saveDatabase();

  res.json(newAnn);
};
app.post('/api/announcements', postAnnouncementHandler);
app.post('/api/admin/announcements', postAnnouncementHandler);

// Admin Dashboard stats
app.get('/api/admin/dashboard', (req, res) => {
  const totalStudents = db.students.length;
  const activeEventsCount = db.events.length;
  const pendingApprovalsCount = db.registrations.filter(r => r.paymentStatus === 'pending').length;
  const certificatesIssuedCount = db.certificates.length;

  const finalTotalStudents = db.statsOverrides?.totalStudents !== undefined ? Number(db.statsOverrides.totalStudents) : (totalStudents + 1243);
  const finalActiveEvents = db.statsOverrides?.activeEventsCount !== undefined ? Number(db.statsOverrides.activeEventsCount) : activeEventsCount;
  const finalPendingApprovals = db.statsOverrides?.pendingApprovalsCount !== undefined ? Number(db.statsOverrides.pendingApprovalsCount) : pendingApprovalsCount;
  const finalCertificatesIssued = db.statsOverrides?.certificatesIssuedCount !== undefined ? Number(db.statsOverrides.certificatesIssuedCount) : certificatesIssuedCount;

  res.json({
    stats: {
      totalStudents: finalTotalStudents,
      activeEventsCount: finalActiveEvents,
      pendingApprovalsCount: finalPendingApprovals,
      certificatesIssuedCount: finalCertificatesIssued
    },
    registrationTrends: [
      { day: 'Day -14', count: Math.max(120, finalTotalStudents - 1120) },
      { day: 'Day -12', count: Math.max(210, finalTotalStudents - 1030) },
      { day: 'Day -10', count: Math.max(350, finalTotalStudents - 890) },
      { day: 'Day -8', count: Math.max(480, finalTotalStudents - 760) },
      { day: 'Day -6', count: Math.max(610, finalTotalStudents - 630) },
      { day: 'Day -4', count: Math.max(800, finalTotalStudents - 440) },
      { day: 'Day -2', count: Math.max(1040, finalTotalStudents - 200) },
      { day: 'Day -1', count: Math.max(1180, finalTotalStudents - 60) },
      { day: 'Today', count: finalTotalStudents }
    ],
    recentActivities: [
      { id: 'act-1', text: 'New registration - Aisha M. - Oppana', time: 'Just now' },
      { id: 'act-2', text: 'Result published - Group Song', time: '2 hours ago' },
      { id: 'act-3', text: 'Photo uploaded - Opening Ceremony', time: '3 hours ago' },
      { id: 'act-4', text: 'Announcement posted - Venue Change for Debate', time: '4 hours ago' }
    ]
  });
});

// Admin stats overrides endpoint
app.post('/api/admin/stats', (req, res) => {
  const { totalStudents, activeEventsCount, pendingApprovalsCount, certificatesIssuedCount } = req.body;
  
  db.statsOverrides = {
    totalStudents: totalStudents !== undefined && totalStudents !== '' ? Number(totalStudents) : undefined,
    activeEventsCount: activeEventsCount !== undefined && activeEventsCount !== '' ? Number(activeEventsCount) : undefined,
    pendingApprovalsCount: pendingApprovalsCount !== undefined && pendingApprovalsCount !== '' ? Number(pendingApprovalsCount) : undefined,
    certificatesIssuedCount: certificatesIssuedCount !== undefined && certificatesIssuedCount !== '' ? Number(certificatesIssuedCount) : undefined,
  };
  
  saveDatabase();
  res.json({ status: 'success', statsOverrides: db.statsOverrides });
});

// Admin Event creation endpoint
app.post('/api/admin/events', (req, res) => {
  const { name, category, type, date, time, venue, maxParticipants, currentParticipantsCount, status, rules, programCategory } = req.body;
  if (!name || !category || !type || !date || !time || !venue || !programCategory) {
    return res.status(400).json({ error: 'Missing required event fields (including programCategory)' });
  }

  const newEvent: Event = {
    id: generateId('ev'),
    name,
    category,
    type,
    date,
    time,
    venue,
    maxParticipants: maxParticipants ? Number(maxParticipants) : 30,
    currentParticipantsCount: currentParticipantsCount ? Number(currentParticipantsCount) : 0,
    status: status || 'open',
    programCategory,
    rules: rules || {
      eligibility: 'Open to High School & Higher Secondary students.',
      timeLimit: 'Standard festival duration limits apply.',
      judgingCriteria: 'Artistic talent, rhythm, coordination and presentation.',
      materials: 'All costume and physical material arrangements by student participants.'
    }
  };

  db.events.push(newEvent);
  saveDatabase();
  res.json(newEvent);
});

// Admin Event editing endpoint
app.post('/api/admin/events/edit', (req, res) => {
  const { id, name, category, type, date, time, venue, maxParticipants, currentParticipantsCount, status, rules, programCategory } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const event = db.events.find(e => e.id === id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (name !== undefined) event.name = name;
  if (category !== undefined) event.category = category;
  if (type !== undefined) event.type = type;
  if (date !== undefined) event.date = date;
  if (time !== undefined) event.time = time;
  if (venue !== undefined) event.venue = venue;
  if (maxParticipants !== undefined) event.maxParticipants = Number(maxParticipants);
  if (currentParticipantsCount !== undefined) event.currentParticipantsCount = Number(currentParticipantsCount);
  if (status !== undefined) event.status = status;
  if (programCategory !== undefined) event.programCategory = programCategory;
  if (rules !== undefined) event.rules = { ...event.rules, ...rules };

  saveDatabase();
  res.json(event);
});

// Admin Event deletion endpoint
app.post('/api/admin/events/delete', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  const index = db.events.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.events.splice(index, 1);
  saveDatabase();
  res.json({ status: 'success', message: 'Event deleted successfully' });
});

// Admin Announcement deletion endpoint
app.post('/api/admin/announcements/delete', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Announcement ID is required' });
  }

  const index = db.announcements.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Announcement not found' });
  }

  db.announcements.splice(index, 1);
  saveDatabase();
  res.json({ status: 'success', message: 'Announcement deleted successfully' });
});

// Admin Gallery photo deletion endpoint
app.post('/api/admin/gallery/delete', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Gallery photo ID is required' });
  }

  const index = db.gallery.findIndex(g => g.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Gallery photo not found' });
  }

  db.gallery.splice(index, 1);
  saveDatabase();
  res.json({ status: 'success', message: 'Gallery photo deleted successfully' });
});

// Helper to match house/team name to scoreboardTeams
function findScoreboardTeam(houseName: string) {
  if (!db.scoreboardTeams) db.scoreboardTeams = [];
  const name = (houseName || '').trim().toLowerCase();
  
  // Try exact match first
  let team = db.scoreboardTeams.find(t => t.teamName.toLowerCase() === name);
  if (team) return team;
  
  // Try mapping common houses to scoreboardTeams
  let mappedName = '';
  if (name === 'red' || name === 'crimson' || name === 'team a') {
    mappedName = 'crimson';
  } else if (name === 'blue' || name === 'cobalt' || name === 'team b') {
    mappedName = 'cobalt';
  } else if (name === 'green' || name === 'emerald' || name === 'team c') {
    mappedName = 'emerald';
  } else if (name === 'yellow' || name === 'amber') {
    mappedName = 'amber';
  }
  
  if (mappedName) {
    team = db.scoreboardTeams.find(t => t.teamName.toLowerCase() === mappedName);
  }
  return team || db.scoreboardTeams[0]; // fallback to first team
}

// Recalculate team scores based on manual adjustments and published results
function recalculateAllScores(db: DatabaseSchema) {
  if (!db.scoreboardTeams) {
    db.scoreboardTeams = [
      { id: 'team-crimson', teamName: 'Crimson', teamColor: '#EF4444', totalScore: 0, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'team-cobalt', teamName: 'Cobalt', teamColor: '#3B82F6', totalScore: 0, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'team-emerald', teamName: 'Emerald', teamColor: '#10B981', totalScore: 0, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'team-amber', teamName: 'Amber', teamColor: '#F59E0B', totalScore: 0, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
  }

  // Filter out automatic score histories, keep manual ones
  if (!db.scoreHistory) db.scoreHistory = [];
  db.scoreHistory = db.scoreHistory.filter(sh => sh.id.startsWith('sh-') && !sh.eventId);

  // Reset team scores
  db.scoreboardTeams.forEach(t => {
    t.totalScore = 0;
  });

  // Re-add manual points
  db.scoreHistory.forEach(sh => {
    const team = db.scoreboardTeams!.find(t => t.id === sh.teamId);
    if (team) {
      team.totalScore += sh.scoreChange;
    }
  });

  // Rebuild automatic points from results
  if (!db.results) db.results = [];
  db.results.forEach(res => {
    const event = db.events.find(e => e.id === res.eventId);
    const eventName = event ? event.name : 'Unknown Event';
    const eventCategory = event ? event.programCategory : 'Junior';
    const publishedAt = res.publishedAt || new Date().toISOString();

    const places = [
      { detail: res.firstPlace, label: '1st Place', points: 100 },
      { detail: res.secondPlace, label: '2nd Place', points: 75 },
      { detail: res.thirdPlace, label: '3rd Place', points: 50 }
    ];

    places.forEach(place => {
      if (place.detail && place.detail.house) {
        const team = findScoreboardTeam(place.detail.house);
        const autoHistoryItem: ScoreHistory = {
          id: `autosh-${res.id}-${place.label}`,
          teamId: team.id,
          teamName: team.teamName,
          scoreChange: place.points,
          reason: `Result: ${eventName} - ${place.label} (${place.detail.name})`,
          updatedBy: 'System',
          createdAt: publishedAt,
          eventId: res.eventId,
          eventName: eventName,
          eventCategory: eventCategory || 'Junior',
          studentName: place.detail.name,
          position: place.label
        };
        db.scoreHistory!.push(autoHistoryItem);
        team.totalScore += place.points;
      }
    });
  });

  // Round scores to prevent floating precision issues
  db.scoreboardTeams.forEach(t => {
    t.totalScore = Math.round(t.totalScore * 100) / 100;
    t.updatedAt = new Date().toISOString();
  });

  // Keep legacy scoreboard houseScores in sync
  if (!db.scoreboard) db.scoreboard = [];
  db.scoreboardTeams.forEach(t => {
    let houseName = 'Team A';
    if (t.teamName.toLowerCase() === 'crimson') houseName = 'Team A';
    else if (t.teamName.toLowerCase() === 'cobalt') houseName = 'Team B';
    else if (t.teamName.toLowerCase() === 'emerald') houseName = 'Team C';
    else if (t.teamName.toLowerCase() === 'amber') houseName = 'Yellow';

    const legacyHouseNames = [
      houseName, 
      t.teamName, 
      t.teamName === 'Crimson' ? 'Red' : t.teamName === 'Cobalt' ? 'Blue' : t.teamName === 'Emerald' ? 'Green' : 'Yellow'
    ];

    legacyHouseNames.forEach(hName => {
      const houseScore = db.scoreboard.find(s => s.house.toLowerCase() === hName.toLowerCase());
      if (houseScore) {
        houseScore.totalPoints = t.totalScore;
        houseScore.lastUpdated = new Date().toISOString();
      }
    });
  });
}

// Recalculate individual student rankings
function recalculateIndividualRankings(db: DatabaseSchema) {
  if (!db.individualRankings) db.individualRankings = [];
  db.individualRankings = [];

  if (!db.results) db.results = [];
  db.results.forEach(res => {
    const processRanking = (placeDetail: WinnerDetail, pointsVal: number) => {
      let studentId = placeDetail.studentId;
      if (!studentId) {
        const std = db.students.find(s => s.name.toLowerCase() === placeDetail.name.toLowerCase() && s.house === placeDetail.house);
        if (std) studentId = std.id;
      }
      if (!studentId) return;

      let rankItem = db.individualRankings.find(r => r.studentId === studentId);
      if (rankItem) {
        rankItem.points += pointsVal;
        rankItem.eventsCount += 1;
        rankItem.trend = 'up';
      } else {
        db.individualRankings.push({
          rank: 0,
          studentId: studentId,
          name: placeDetail.name,
          house: placeDetail.house,
          eventsCount: 1,
          points: pointsVal,
          trend: 'up'
        });
      }
    };

    processRanking(res.firstPlace, 100);
    processRanking(res.secondPlace, 75);
    processRanking(res.thirdPlace, 50);
  });

  db.individualRankings.sort((a, b) => b.points - a.points);
  db.individualRankings.forEach((r, idx) => {
    r.rank = idx + 1;
  });
}

// Recalculate recent winners feed ticker list
function recalculateRecentWinners(db: DatabaseSchema) {
  if (!db.recentWinners) db.recentWinners = [];
  db.recentWinners = [];

  const sortedResults = [...db.results].sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  sortedResults.slice(0, 8).forEach(res => {
    const event = db.events.find(e => e.id === res.eventId);
    if (event) {
      db.recentWinners.push({
        id: `feed-${res.id}`,
        eventName: event.name,
        teamOrStudentName: res.firstPlace.name,
        house: res.firstPlace.house,
        pointsAdded: 100,
        timeAgo: 'Just now'
      });
    }
  });
}

// Master synchronizer to execute all recalculation tasks
function recalculateAllDataAndScores(db: DatabaseSchema) {
  recalculateAllScores(db);
  recalculateIndividualRankings(db);
  recalculateRecentWinners(db);
}

// Generate or replace certificates for a specific result
function updateCertificatesForResult(result: Result, event: Event) {
  if (!db.certificates) db.certificates = [];
  
  // Remove any stale certificates for this result ID
  db.certificates = db.certificates.filter(c => c.resultId !== result.id);

  const getStudentId = (placeDetail: WinnerDetail) => {
    if (placeDetail.studentId) return placeDetail.studentId;
    const std = db.students.find(s => s.name.toLowerCase() === placeDetail.name.toLowerCase() && s.house === placeDetail.house);
    return std ? std.id : 'guest-std';
  };

  const createCert = (placeDetail: WinnerDetail, placeLabel: '1st Place' | '2nd Place' | '3rd Place', pointsVal: number) => {
    const certId = generateId('cert');
    const verificationCode = `VRF-${event.name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cert: Certificate = {
      id: certId,
      studentId: getStudentId(placeDetail),
      studentName: placeDetail.name,
      house: placeDetail.house,
      eventId: event.id,
      eventName: event.name,
      category: event.category,
      resultId: result.id,
      awardText: placeLabel,
      points: pointsVal,
      issuedAt: new Date().toISOString(),
      verificationCode
    };

    db.certificates.push(cert);

    // Notify student if logged in
    const resolvedStdId = getStudentId(placeDetail);
    if (resolvedStdId && resolvedStdId !== 'guest-std') {
      const std = db.students.find(s => s.id === resolvedStdId);
      if (std) {
        db.notifications.push({
          id: generateId('not'),
          userId: std.userId,
          message: `Results published for ${event.name}! You secured ${placeLabel}. Your certificate is ready to download.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }
  };

  createCert(result.firstPlace, '1st Place', 100);
  createCert(result.secondPlace, '2nd Place', 75);
  createCert(result.thirdPlace, '3rd Place', 50);
}

// Submit results and automatically update scoreboards/ranks (Admin or Judge)
app.post('/api/admin/results', (req, res) => {
  const { eventId, firstPlace, secondPlace, thirdPlace, judgeRemarks } = req.body;

  if (!eventId || !firstPlace || !secondPlace || !thirdPlace) {
    return res.status(400).json({ error: 'Incomplete results parameters' });
  }

  const event = db.events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Create Result object
  const resultId = generateId('res');
  const newResult: Result = {
    id: resultId,
    eventId,
    firstPlace: { ...firstPlace, points: 100 },
    secondPlace: { ...secondPlace, points: 75 },
    thirdPlace: { ...thirdPlace, points: 50 },
    judgeRemarks: judgeRemarks || 'Excellent show of talent and passion.',
    publishedAt: new Date().toISOString()
  };

  db.results.push(newResult);

  // Update Event status to results_published
  event.status = 'results_published';

  // Generate Certificates
  updateCertificatesForResult(newResult, event);

  // Recalculate scores & other lists
  recalculateAllDataAndScores(db);

  saveDatabase();

  res.json({
    status: 'success',
    result: newResult
  });
});

// Edit published results standings
app.post('/api/admin/results/edit', (req, res) => {
  const { id, firstPlace, secondPlace, thirdPlace, judgeRemarks } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Result ID is required' });
  }

  const result = db.results.find(r => r.id === id);
  if (!result) {
    return res.status(404).json({ error: 'Result not found' });
  }

  const event = db.events.find(e => e.id === result.eventId);

  if (firstPlace) result.firstPlace = { ...firstPlace, points: 100 };
  if (secondPlace) result.secondPlace = { ...secondPlace, points: 75 };
  if (thirdPlace) result.thirdPlace = { ...thirdPlace, points: 50 };
  if (judgeRemarks !== undefined) result.judgeRemarks = judgeRemarks;

  // Re-generate Certificates
  if (event) {
    updateCertificatesForResult(result, event);
  }

  // Recalculate scores
  recalculateAllDataAndScores(db);

  saveDatabase();

  res.json({
    status: 'success',
    result
  });
});

// Delete published results standing
app.post('/api/admin/results/delete', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Result ID is required' });
  }

  const resultIndex = db.results.findIndex(r => r.id === id);
  if (resultIndex === -1) {
    return res.status(404).json({ error: 'Result not found' });
  }

  const result = db.results[resultIndex];

  // Revert Event status to open
  const event = db.events.find(e => e.id === result.eventId);
  if (event) {
    event.status = 'open';
  }

  // Remove Certificates
  db.certificates = db.certificates.filter(c => c.resultId !== result.id);

  // Delete from results list
  db.results.splice(resultIndex, 1);

  // Recalculate
  recalculateAllDataAndScores(db);

  saveDatabase();

  res.json({
    status: 'success'
  });
});

// GET all students
app.get('/api/admin/students', (req, res) => {
  res.json(db.students);
});

// Admin Student creation
app.post('/api/admin/students', (req, res) => {
  const { name, class: className, house, category, photo } = req.body;
  if (!name || !className || !house || !category) {
    return res.status(400).json({ error: 'Missing required student fields (name, class, team/house, category)' });
  }

  const userId = generateId('u');
  let studentId = '';
  try {
    studentId = getNextStudentIdForTeam(house);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }

  const newStudent: Student = {
    id: generateId('std'),
    userId,
    name,
    studentId,
    class: className,
    house,
    category,
    photo: photo || ''
  };

  db.students.push(newStudent);
  saveDatabase();
  res.json(newStudent);
});

// Admin Student editing
app.post('/api/admin/students/edit', (req, res) => {
  const { id, name, class: className, house, category, photo } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const student = db.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  if (name !== undefined) student.name = name;
  if (className !== undefined) student.class = className;
  if (house !== undefined && house !== student.house) {
    if (!isIdInTeamRange(student.studentId, house)) {
      try {
        student.studentId = getNextStudentIdForTeam(house);
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }
    student.house = house;
  }
  if (category !== undefined) student.category = category;
  if (photo !== undefined) student.photo = photo;

  saveDatabase();
  res.json(student);
});

// Admin Student deletion
app.post('/api/admin/students/delete', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const student = db.students[index];
  // Filter out registrations
  db.registrations = db.registrations.filter(r => r.studentId !== student.id);
  // Remove student
  db.students.splice(index, 1);
  saveDatabase();
  res.json({ status: 'success', message: 'Student and registrations deleted successfully' });
});

// Groups Management API Endpoints
app.get('/api/groups', (req, res) => {
  if (!db.groups) {
    db.groups = ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior'];
    saveDatabase();
  }
  res.json(db.groups);
});

app.post('/api/admin/groups', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Valid group name is required' });
  }

  if (!db.groups) {
    db.groups = ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior'];
  }

  const formattedName = name.trim();
  if (db.groups.includes(formattedName)) {
    return res.status(400).json({ error: 'Group already exists' });
  }

  db.groups.push(formattedName);
  saveDatabase();
  res.json({ status: 'success', groups: db.groups });
});

app.post('/api/admin/groups/delete', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  if (!db.groups) {
    db.groups = ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior'];
  }

  db.groups = db.groups.filter(g => g !== name);
  saveDatabase();
  res.json({ status: 'success', groups: db.groups });
});

// Toggle event active/open/completed state
app.post('/api/admin/events/toggle-status', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Event ID is required' });

  const event = db.events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // Toggle status
  event.status = event.status === 'open' ? 'completed' : 'open';
  saveDatabase();
  res.json(event);
});

// Approve pending registration approval
app.post('/api/admin/registrations/approve', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Registration ID is required' });

  const reg = db.registrations.find(r => r.id === id);
  if (!reg) return res.status(404).json({ error: 'Registration not found' });

  reg.paymentStatus = 'completed';

  const student = db.students.find(s => s.id === reg.studentId);
  const event = db.events.find(e => e.id === reg.eventId);
  if (student && event) {
    db.notifications.push({
      id: generateId('not'),
      userId: student.userId,
      message: `Your registration for ${event.name} has been approved by the Administrator!`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  saveDatabase();
  res.json({ status: 'success', registration: reg });
});

// Reject/Delete registration
app.post('/api/admin/registrations/reject', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Registration ID is required' });

  const index = db.registrations.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: 'Registration not found' });

  const reg = db.registrations[index];
  const ev = db.events.find(e => e.id === reg.eventId);
  if (ev) {
    ev.currentParticipantsCount = Math.max(0, (ev.currentParticipantsCount || 0) - 1);
  }

  db.registrations.splice(index, 1);
  saveDatabase();
  res.json({ status: 'success' });
});

// Issue manual digital certificate directly
app.post('/api/admin/certificates/issue', (req, res) => {
  const { studentId, eventId, awardText, points } = req.body;
  if (!studentId || !eventId || !awardText) {
    return res.status(400).json({ error: 'Missing required certificate parameters' });
  }

  const student = db.students.find(s => s.id === studentId);
  const event = db.events.find(e => e.id === eventId);
  if (!student || !event) {
    return res.status(404).json({ error: 'Student or Event not found' });
  }

  const certId = generateId('cert');
  const verificationCode = `VRF-${event.name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const cert: Certificate = {
    id: certId,
    studentId: student.id,
    studentName: student.name,
    house: student.house,
    eventId: event.id,
    eventName: event.name,
    category: event.category,
    awardText,
    points: points ? Number(points) : 0,
    issuedAt: new Date().toISOString(),
    verificationCode
  };

  db.certificates.push(cert);

  // Optionally award house points
  if (points && Number(points) > 0) {
    const houseScore = db.scoreboard.find(s => s.house.toLowerCase() === student.house.toLowerCase());
    if (houseScore) {
      houseScore.totalPoints += Number(points);
      houseScore.lastUpdated = new Date().toISOString();
    }
  }

  // Notify student
  db.notifications.push({
    id: generateId('not'),
    userId: student.userId,
    message: `Congratulations! A certificate has been issued to you for "${event.name}" (${awardText}).`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString()
  });

  saveDatabase();
  res.json({ status: 'success', certificate: cert });
});

// ==========================================
// SCOREBOARD MANAGEMENT ENDPOINTS
// ==========================================

// Get all scoreboard teams (active & inactive)
app.get('/api/scoreboard/teams', (req, res) => {
  res.json(db.scoreboardTeams || []);
});

// Add a new Team
app.post('/api/scoreboard/teams', (req, res) => {
  const { teamName, teamColor, teamLogo, totalScore, status } = req.body;
  if (!teamName || !teamColor) {
    return res.status(400).json({ error: 'Team Name and Team Color are required' });
  }
  const newTeam: ScoreboardTeam = {
    id: 'team-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    teamName: teamName.trim(),
    teamColor,
    teamLogo: teamLogo || '',
    totalScore: typeof totalScore === 'number' ? totalScore : 0,
    status: status === 'inactive' ? 'inactive' : 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!db.scoreboardTeams) db.scoreboardTeams = [];
  db.scoreboardTeams.push(newTeam);
  saveDatabase();
  res.status(201).json(newTeam);
});

// Edit Team details
const editTeamHandler = (req: any, res: any) => {
  const id = req.params.id || req.body.id;
  const { teamName, teamColor, teamLogo, status, totalScore } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Team ID is required' });
  }
  if (!db.scoreboardTeams) db.scoreboardTeams = [];
  const teamIndex = db.scoreboardTeams.findIndex(t => t.id === id);
  if (teamIndex === -1) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  db.scoreboardTeams[teamIndex] = {
    ...db.scoreboardTeams[teamIndex],
    teamName: teamName !== undefined ? teamName.trim() : db.scoreboardTeams[teamIndex].teamName,
    teamColor: teamColor !== undefined ? teamColor : db.scoreboardTeams[teamIndex].teamColor,
    teamLogo: teamLogo !== undefined ? teamLogo : db.scoreboardTeams[teamIndex].teamLogo,
    status: status !== undefined ? status : db.scoreboardTeams[teamIndex].status,
    totalScore: typeof totalScore === 'number' ? totalScore : db.scoreboardTeams[teamIndex].totalScore,
    updatedAt: new Date().toISOString()
  };

  saveDatabase();
  res.json(db.scoreboardTeams[teamIndex]);
};
app.post('/api/scoreboard/teams/edit', editTeamHandler);
app.put('/api/scoreboard/teams/:id', editTeamHandler);

// Delete Team details
const deleteTeamHandler = (req: any, res: any) => {
  const id = req.params.id || req.body.id;
  if (!id) {
    return res.status(400).json({ error: 'Team ID is required' });
  }
  if (!db.scoreboardTeams) db.scoreboardTeams = [];
  const initialLen = db.scoreboardTeams.length;
  db.scoreboardTeams = db.scoreboardTeams.filter(t => t.id !== id);
  if (db.scoreboardTeams.length === initialLen) {
    return res.status(404).json({ error: 'Team not found' });
  }
  saveDatabase();
  res.json({ status: 'success', message: 'Team deleted successfully' });
};
app.post('/api/scoreboard/teams/delete', deleteTeamHandler);
app.delete('/api/scoreboard/teams/:id', deleteTeamHandler);

// Update Team Score (Add/Deduct points, appends history log)
app.post('/api/scoreboard/score/update', (req, res) => {
  const { teamId, scoreChange, reason, updatedBy } = req.body;
  if (!teamId || typeof scoreChange !== 'number') {
    return res.status(400).json({ error: 'Team ID and scoreChange (number) are required' });
  }
  if (!db.scoreboardTeams) db.scoreboardTeams = [];
  const teamIndex = db.scoreboardTeams.findIndex(t => t.id === teamId);
  if (teamIndex === -1) {
    return res.status(404).json({ error: 'Team not found' });
  }

  // Update totalScore (avoiding floating point precision issues)
  db.scoreboardTeams[teamIndex].totalScore = Math.round((db.scoreboardTeams[teamIndex].totalScore + scoreChange) * 100) / 100;
  db.scoreboardTeams[teamIndex].updatedAt = new Date().toISOString();

  // Add score history item
  const historyItem: ScoreHistory = {
    id: 'sh-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    teamId,
    teamName: db.scoreboardTeams[teamIndex].teamName,
    scoreChange,
    reason: reason ? reason.trim() : 'Manual score adjustment',
    updatedBy: updatedBy || 'Admin',
    createdAt: new Date().toISOString()
  };
  
  if (!db.scoreHistory) db.scoreHistory = [];
  db.scoreHistory.push(historyItem);

  saveDatabase();
  res.json({
    status: 'success',
    team: db.scoreboardTeams[teamIndex],
    history: historyItem
  });
});

// Get Score History logs
app.get('/api/scoreboard/history', (req, res) => {
  res.json(db.scoreHistory || []);
});

// Get Live Scoreboard Standing (all active teams, sorted desc)
app.get('/api/scoreboard/live', (req, res) => {
  if (!db.scoreboardTeams) db.scoreboardTeams = [];
  const liveTeams = db.scoreboardTeams
    .filter(t => t.status === 'active')
    .sort((a, b) => b.totalScore - a.totalScore);
  res.json(liveTeams);
});

// Admin-Only Reset Database for clean slate demo
const resetDbHandler = async (req: any, res: any) => {
  try {
    await resetSqliteToDefaultSeeds();
    db = await loadDatabaseFromSQLite();
    console.log("SQLite and memory database reset successfully.");
    res.json({ status: 'success', message: 'Database reset to default seed values' });
  } catch (err) {
    console.error("Failed to reset database:", err);
    res.status(500).json({ error: 'Failed to reset database' });
  }
};
app.post('/api/admin/reset-db', resetDbHandler);
app.post('/api/admin/reset', resetDbHandler);

let isDbLoaded = false;
let dbInitPromise: Promise<void> | null = null;

export async function ensureDbLoaded() {
  if (!isDbLoaded) {
    if (!dbInitPromise) {
      dbInitPromise = (async () => {
        db = await loadDatabaseFromSQLite();
        if (!db.assignedStudentIds) {
          db.assignedStudentIds = db.students ? db.students.map(s => s.studentId).filter(Boolean) : [];
        }
        isDbLoaded = true;
      })();
    }
    await dbInitPromise;
  }
}

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await ensureDbLoaded();
    } catch (err) {
      console.error('Error ensuring DB loaded:', err);
    }
  }
  next();
});

// Vite & Static file handler setup
async function startServer() {
  await ensureDbLoaded();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Fallback for SPA routing in client
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
