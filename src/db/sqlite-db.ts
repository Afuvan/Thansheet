import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { 
  User, Student, Event, Registration, Result, Team, 
  Certificate, Notification, Announcement, GalleryItem, 
  HouseScore, IndividualRanking, RecentWinnerFeedItem, 
  ScoreboardTeam, ScoreHistory 
} from '../types';

const DB_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'database');
const DB_FILE = path.join(DB_DIR, 'app.db');
const OLD_DB_FILE = path.join(process.cwd(), 'data', 'db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const sqliteDb = new sqlite3.Database(DB_FILE);

// Promisified query wrappers
export function runQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export function getQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Table Initialization SQL
export async function initializeSqlite() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      role TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      studentId TEXT NOT NULL UNIQUE,
      class TEXT NOT NULL,
      house TEXT NOT NULL,
      photo TEXT,
      contactNumber TEXT,
      emergencyContact TEXT,
      "group" TEXT,
      category TEXT
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      rules TEXT NOT NULL,
      maxParticipants INTEGER NOT NULL,
      currentParticipantsCount INTEGER NOT NULL,
      status TEXT NOT NULL,
      programCategory TEXT
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      eventId TEXT NOT NULL,
      teamId TEXT,
      status TEXT NOT NULL,
      registeredAt TEXT NOT NULL,
      paymentStatus TEXT NOT NULL,
      confirmationNumber TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      firstPlace TEXT NOT NULL,
      secondPlace TEXT NOT NULL,
      thirdPlace TEXT NOT NULL,
      judgeRemarks TEXT,
      publishedAt TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      eventId TEXT NOT NULL,
      house TEXT NOT NULL,
      members TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      house TEXT NOT NULL,
      eventId TEXT NOT NULL,
      eventName TEXT NOT NULL,
      category TEXT NOT NULL,
      resultId TEXT,
      awardText TEXT NOT NULL,
      points INTEGER NOT NULL,
      issuedAt TEXT NOT NULL,
      verificationCode TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      read INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      publishedAt TEXT NOT NULL,
      targetAudience TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      imageUrl TEXT NOT NULL,
      category TEXT NOT NULL,
      eventId TEXT,
      caption TEXT NOT NULL,
      uploadedBy TEXT NOT NULL,
      date TEXT NOT NULL,
      photographer TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS scoreboard (
      house TEXT PRIMARY KEY,
      totalPoints INTEGER NOT NULL,
      lastUpdated TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS individual_rankings (
      studentId TEXT PRIMARY KEY,
      rank INTEGER NOT NULL,
      name TEXT NOT NULL,
      house TEXT NOT NULL,
      eventsCount INTEGER NOT NULL,
      points INTEGER NOT NULL,
      trend TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS recent_winners (
      id TEXT PRIMARY KEY,
      eventName TEXT NOT NULL,
      teamOrStudentName TEXT NOT NULL,
      house TEXT NOT NULL,
      pointsAdded INTEGER NOT NULL,
      timeAgo TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS groups (
      name TEXT PRIMARY KEY
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS scoreboard_teams (
      id TEXT PRIMARY KEY,
      teamName TEXT NOT NULL,
      teamColor TEXT NOT NULL,
      teamLogo TEXT,
      totalScore INTEGER NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS score_history (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      teamName TEXT NOT NULL,
      scoreChange INTEGER NOT NULL,
      reason TEXT,
      updatedBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      eventId TEXT,
      eventName TEXT,
      eventCategory TEXT,
      studentName TEXT,
      position TEXT
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS assigned_student_ids (
      studentId TEXT PRIMARY KEY
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS stats_overrides (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL
    )
  `);

  // Migrate or Seed if DB is empty
  const userCheck = await getQuery("SELECT count(*) as count FROM users");
  if (userCheck && userCheck.count === 0) {
    console.log("SQLite tables are empty. Checking for migration from old db.json...");
    if (fs.existsSync(OLD_DB_FILE)) {
      try {
        console.log("Found existing db.json. Performing migration to SQLite...");
        const rawJson = fs.readFileSync(OLD_DB_FILE, 'utf-8');
        const dbData = JSON.parse(rawJson);
        await migrateDataToSqlite(dbData);
        console.log("Migration successful!");
        // Safely rename db.json to preserve it as backup but disable JSON DB loading
        fs.renameSync(OLD_DB_FILE, OLD_DB_FILE + '.bak');
      } catch (err) {
        console.error("Migration from db.json failed, falling back to default seed:", err);
        await seedDefaultSqliteData();
      }
    } else {
      console.log("No db.json found. Seeding pristine database...");
      await seedDefaultSqliteData();
    }
  }
}

// Migration executor
async function migrateDataToSqlite(data: any) {
  if (Array.isArray(data.users)) {
    for (const u of data.users) {
      await runQuery(
        "INSERT OR REPLACE INTO users (id, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)",
        [u.id, u.email, u.password, u.role, u.createdAt]
      );
    }
  }

  if (Array.isArray(data.students)) {
    for (const s of data.students) {
      await runQuery(
        'INSERT OR REPLACE INTO students (id, userId, name, studentId, class, house, photo, contactNumber, emergencyContact, "group", category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.id, s.userId, s.name, s.studentId, s.class, s.house, s.photo || '', s.contactNumber || '', s.emergencyContact || '', s.group || '', s.category || '']
      );
    }
  }

  if (Array.isArray(data.events)) {
    for (const e of data.events) {
      await runQuery(
        "INSERT OR REPLACE INTO events (id, name, category, type, date, time, venue, rules, maxParticipants, currentParticipantsCount, status, programCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [e.id, e.name, e.category, e.type, e.date, e.time, e.venue, JSON.stringify(e.rules || {}), e.maxParticipants, e.currentParticipantsCount || 0, e.status, e.programCategory || '']
      );
    }
  }

  if (Array.isArray(data.registrations)) {
    for (const r of data.registrations) {
      await runQuery(
        "INSERT OR REPLACE INTO registrations (id, studentId, eventId, teamId, status, registeredAt, paymentStatus, confirmationNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [r.id, r.studentId, r.eventId, r.teamId || '', r.status, r.registeredAt, r.paymentStatus, r.confirmationNumber]
      );
    }
  }

  if (Array.isArray(data.results)) {
    for (const r of data.results) {
      await runQuery(
        "INSERT OR REPLACE INTO results (id, eventId, firstPlace, secondPlace, thirdPlace, judgeRemarks, publishedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [r.id, r.eventId, JSON.stringify(r.firstPlace || {}), JSON.stringify(r.secondPlace || {}), JSON.stringify(r.thirdPlace || {}), r.judgeRemarks || '', r.publishedAt]
      );
    }
  }

  if (Array.isArray(data.teams)) {
    for (const t of data.teams) {
      await runQuery(
        "INSERT OR REPLACE INTO teams (id, name, eventId, house, members) VALUES (?, ?, ?, ?, ?)",
        [t.id, t.name, t.eventId, t.house, JSON.stringify(t.members || [])]
      );
    }
  }

  if (Array.isArray(data.certificates)) {
    for (const c of data.certificates) {
      await runQuery(
        "INSERT OR REPLACE INTO certificates (id, studentId, studentName, house, eventId, eventName, category, resultId, awardText, points, issuedAt, verificationCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [c.id, c.studentId, c.studentName, c.house, c.eventId, c.eventName, c.category, c.resultId || '', c.awardText, c.points, c.issuedAt, c.verificationCode]
      );
    }
  }

  if (Array.isArray(data.notifications)) {
    for (const n of data.notifications) {
      await runQuery(
        "INSERT OR REPLACE INTO notifications (id, userId, message, type, read, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        [n.id, n.userId, n.message, n.type, n.read ? 1 : 0, n.createdAt]
      );
    }
  }

  if (Array.isArray(data.announcements)) {
    for (const a of data.announcements) {
      await runQuery(
        "INSERT OR REPLACE INTO announcements (id, title, content, createdBy, publishedAt, targetAudience) VALUES (?, ?, ?, ?, ?, ?)",
        [a.id, a.title, a.content, a.createdBy, a.publishedAt, a.targetAudience]
      );
    }
  }

  if (Array.isArray(data.gallery)) {
    for (const g of data.gallery) {
      await runQuery(
        "INSERT OR REPLACE INTO gallery (id, imageUrl, category, eventId, caption, uploadedBy, date, photographer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [g.id, g.imageUrl, g.category, g.eventId || '', g.caption, g.uploadedBy, g.date, g.photographer]
      );
    }
  }

  if (Array.isArray(data.scoreboard)) {
    for (const s of data.scoreboard) {
      await runQuery(
        "INSERT OR REPLACE INTO scoreboard (house, totalPoints, lastUpdated) VALUES (?, ?, ?)",
        [s.house, s.totalPoints, s.lastUpdated]
      );
    }
  }

  if (Array.isArray(data.individualRankings)) {
    for (const i of data.individualRankings) {
      await runQuery(
        "INSERT OR REPLACE INTO individual_rankings (studentId, rank, name, house, eventsCount, points, trend) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [i.studentId, i.rank, i.name, i.house, i.eventsCount, i.points, i.trend]
      );
    }
  }

  if (Array.isArray(data.recentWinners)) {
    for (const w of data.recentWinners) {
      await runQuery(
        "INSERT OR REPLACE INTO recent_winners (id, eventName, teamOrStudentName, house, pointsAdded, timeAgo) VALUES (?, ?, ?, ?, ?, ?)",
        [w.id, w.eventName, w.teamOrStudentName, w.house, w.pointsAdded, w.timeAgo]
      );
    }
  }

  if (Array.isArray(data.groups)) {
    for (const g of data.groups) {
      await runQuery("INSERT OR REPLACE INTO groups (name) VALUES (?)", [g]);
    }
  } else {
    for (const g of ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior']) {
      await runQuery("INSERT OR REPLACE INTO groups (name) VALUES (?)", [g]);
    }
  }

  if (Array.isArray(data.scoreboardTeams)) {
    for (const t of data.scoreboardTeams) {
      await runQuery(
        "INSERT OR REPLACE INTO scoreboard_teams (id, teamName, teamColor, teamLogo, totalScore, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [t.id, t.teamName, t.teamColor, t.teamLogo || '', t.totalScore, t.status, t.createdAt, t.updatedAt]
      );
    }
  }

  if (Array.isArray(data.scoreHistory)) {
    for (const h of data.scoreHistory) {
      await runQuery(
        "INSERT OR REPLACE INTO score_history (id, teamId, teamName, scoreChange, reason, updatedBy, createdAt, eventId, eventName, eventCategory, studentName, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [h.id, h.teamId, h.teamName, h.scoreChange, h.reason || '', h.updatedBy, h.createdAt, h.eventId || '', h.eventName || '', h.eventCategory || '', h.studentName || '', h.position || '']
      );
    }
  }

  if (Array.isArray(data.assignedStudentIds)) {
    for (const sId of data.assignedStudentIds) {
      await runQuery("INSERT OR REPLACE INTO assigned_student_ids (studentId) VALUES (?)", [sId]);
    }
  }

  if (data.statsOverrides) {
    for (const k of Object.keys(data.statsOverrides)) {
      await runQuery(
        "INSERT OR REPLACE INTO stats_overrides (key, value) VALUES (?, ?)",
        [k, data.statsOverrides[k]]
      );
    }
  }
}

// Default seed populator for a clean database
async function seedDefaultSqliteData() {
  const initialUsers: User[] = [
    { id: 'u-admin', email: 'admin@fest.com', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
    { id: 'u-judge', email: 'judge@fest.com', password: 'judge123', role: 'judge', createdAt: new Date().toISOString() }
  ];

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

  const initialScoreboard: HouseScore[] = [
    { house: 'Team A', totalPoints: 0, lastUpdated: new Date().toISOString() },
    { house: 'Team B', totalPoints: 0, lastUpdated: new Date().toISOString() },
    { house: 'Team C', totalPoints: 0, lastUpdated: new Date().toISOString() }
  ];

  // Seed standard groups
  for (const group of ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior']) {
    await runQuery("INSERT OR REPLACE INTO groups (name) VALUES (?)", [group]);
  }

  // Seed initial users
  for (const u of initialUsers) {
    await runQuery(
      "INSERT OR REPLACE INTO users (id, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)",
      [u.id, u.email, u.password, u.role, u.createdAt]
    );
  }

  // Seed scoreboard teams
  for (const t of initialScoreboardTeams) {
    await runQuery(
      "INSERT OR REPLACE INTO scoreboard_teams (id, teamName, teamColor, teamLogo, totalScore, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [t.id, t.teamName, t.teamColor, t.teamLogo || '', t.totalScore, t.status, t.createdAt, t.updatedAt]
    );
  }

  // Seed score history
  for (const h of initialScoreHistory) {
    await runQuery(
      "INSERT OR REPLACE INTO score_history (id, teamId, teamName, scoreChange, reason, updatedBy, createdAt, eventId, eventName, eventCategory, studentName, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [h.id, h.teamId, h.teamName, h.scoreChange, h.reason || '', h.updatedBy, h.createdAt, h.eventId || '', h.eventName || '', h.eventCategory || '', h.studentName || '', h.position || '']
    );
  }

  // Seed scoreboard houses
  for (const s of initialScoreboard) {
    await runQuery(
      "INSERT OR REPLACE INTO scoreboard (house, totalPoints, lastUpdated) VALUES (?, ?, ?)",
      [s.house, s.totalPoints, s.lastUpdated]
    );
  }
}

// Direct SQL CRUD helper functions to abstract SQLite calls in the server APIs
export async function getDbUsers(): Promise<User[]> {
  const rows = await allQuery("SELECT * FROM users");
  return rows.map(r => ({ id: r.id, email: r.email, password: r.password, role: r.role, createdAt: r.createdAt }));
}

export async function saveDbUser(user: User): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO users (id, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)",
    [user.id, user.email, user.password, user.role, user.createdAt]
  );
}

export async function getDbStudents(): Promise<Student[]> {
  const rows = await allQuery("SELECT * FROM students");
  return rows.map(r => ({
    id: r.id,
    userId: r.userId,
    name: r.name,
    studentId: r.studentId,
    class: r.class,
    house: r.house,
    photo: r.photo,
    contactNumber: r.contactNumber,
    emergencyContact: r.emergencyContact,
    group: r.group,
    category: r.category
  }));
}

export async function saveDbStudent(student: Student): Promise<void> {
  await runQuery(
    'INSERT OR REPLACE INTO students (id, userId, name, studentId, class, house, photo, contactNumber, emergencyContact, "group", category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      student.id, student.userId, student.name, student.studentId, student.class, 
      student.house, student.photo || '', student.contactNumber || '', 
      student.emergencyContact || '', student.group || '', student.category || ''
    ]
  );
}

export async function deleteDbStudent(id: string): Promise<void> {
  await runQuery("DELETE FROM students WHERE id = ?", [id]);
}

export async function getDbEvents(): Promise<Event[]> {
  const rows = await allQuery("SELECT * FROM events");
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category as 'stage' | 'off_stage',
    type: r.type as 'individual' | 'group',
    date: r.date,
    time: r.time,
    venue: r.venue,
    rules: JSON.parse(r.rules || '{}'),
    maxParticipants: r.maxParticipants,
    currentParticipantsCount: r.currentParticipantsCount,
    status: r.status as 'open' | 'registered' | 'completed' | 'results_published',
    programCategory: r.programCategory
  }));
}

export async function saveDbEvent(event: Event): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO events (id, name, category, type, date, time, venue, rules, maxParticipants, currentParticipantsCount, status, programCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      event.id, event.name, event.category, event.type, event.date, event.time, 
      event.venue, JSON.stringify(event.rules || {}), event.maxParticipants, 
      event.currentParticipantsCount || 0, event.status, event.programCategory || ''
    ]
  );
}

export async function deleteDbEvent(id: string): Promise<void> {
  await runQuery("DELETE FROM events WHERE id = ?", [id]);
}

export async function getDbRegistrations(): Promise<Registration[]> {
  const rows = await allQuery("SELECT * FROM registrations");
  return rows.map(r => ({
    id: r.id,
    studentId: r.studentId,
    eventId: r.eventId,
    teamId: r.teamId || undefined,
    status: r.status as 'registered' | 'cancelled' | 'completed',
    registeredAt: r.registeredAt,
    paymentStatus: r.paymentStatus as 'pending' | 'completed',
    confirmationNumber: r.confirmationNumber
  }));
}

export async function saveDbRegistration(reg: Registration): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO registrations (id, studentId, eventId, teamId, status, registeredAt, paymentStatus, confirmationNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      reg.id, reg.studentId, reg.eventId, reg.teamId || '', reg.status, 
      reg.registeredAt, reg.paymentStatus, reg.confirmationNumber
    ]
  );
}

export async function deleteDbRegistration(id: string): Promise<void> {
  await runQuery("DELETE FROM registrations WHERE id = ?", [id]);
}

export async function getDbResults(): Promise<Result[]> {
  const rows = await allQuery("SELECT * FROM results");
  return rows.map(r => ({
    id: r.id,
    eventId: r.eventId,
    firstPlace: JSON.parse(r.firstPlace || '{}'),
    secondPlace: JSON.parse(r.secondPlace || '{}'),
    thirdPlace: JSON.parse(r.thirdPlace || '{}'),
    judgeRemarks: r.judgeRemarks || '',
    publishedAt: r.publishedAt
  }));
}

export async function saveDbResult(result: Result): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO results (id, eventId, firstPlace, secondPlace, thirdPlace, judgeRemarks, publishedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      result.id, result.eventId, JSON.stringify(result.firstPlace || {}), 
      JSON.stringify(result.secondPlace || {}), JSON.stringify(result.thirdPlace || {}), 
      result.judgeRemarks || '', result.publishedAt
    ]
  );
}

export async function deleteDbResult(id: string): Promise<void> {
  await runQuery("DELETE FROM results WHERE id = ?", [id]);
}

export async function getDbTeams(): Promise<Team[]> {
  const rows = await allQuery("SELECT * FROM teams");
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    eventId: r.eventId,
    house: r.house as 'Team A' | 'Team B' | 'Team C',
    members: JSON.parse(r.members || '[]')
  }));
}

export async function saveDbTeam(team: Team): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO teams (id, name, eventId, house, members) VALUES (?, ?, ?, ?, ?)",
    [team.id, team.name, team.eventId, team.house, JSON.stringify(team.members || [])]
  );
}

export async function deleteDbTeam(id: string): Promise<void> {
  await runQuery("DELETE FROM teams WHERE id = ?", [id]);
}

export async function getDbCertificates(): Promise<Certificate[]> {
  const rows = await allQuery("SELECT * FROM certificates");
  return rows.map(r => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.studentName,
    house: r.house as any,
    eventId: r.eventId,
    eventName: r.eventName,
    category: r.category as any,
    resultId: r.resultId || undefined,
    awardText: r.awardText as any,
    points: r.points,
    issuedAt: r.issuedAt,
    verificationCode: r.verificationCode
  }));
}

export async function saveDbCertificate(cert: Certificate): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO certificates (id, studentId, studentName, house, eventId, eventName, category, resultId, awardText, points, issuedAt, verificationCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      cert.id, cert.studentId, cert.studentName, cert.house, cert.eventId, 
      cert.eventName, cert.category, cert.resultId || '', cert.awardText, 
      cert.points, cert.issuedAt, cert.verificationCode
    ]
  );
}

export async function deleteDbCertificate(id: string): Promise<void> {
  await runQuery("DELETE FROM certificates WHERE id = ?", [id]);
}

export async function getDbNotifications(): Promise<Notification[]> {
  const rows = await allQuery("SELECT * FROM notifications ORDER BY createdAt DESC");
  return rows.map(r => ({
    id: r.id,
    userId: r.userId,
    message: r.message,
    type: r.type as any,
    read: r.read === 1,
    createdAt: r.createdAt
  }));
}

export async function saveDbNotification(notif: Notification): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO notifications (id, userId, message, type, read, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
    [notif.id, notif.userId, notif.message, notif.type, notif.read ? 1 : 0, notif.createdAt]
  );
}

export async function getDbAnnouncements(): Promise<Announcement[]> {
  const rows = await allQuery("SELECT * FROM announcements ORDER BY publishedAt DESC");
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    content: r.content,
    createdBy: r.createdBy,
    publishedAt: r.publishedAt,
    targetAudience: r.targetAudience as any
  }));
}

export async function saveDbAnnouncement(ann: Announcement): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO announcements (id, title, content, createdBy, publishedAt, targetAudience) VALUES (?, ?, ?, ?, ?, ?)",
    [ann.id, ann.title, ann.content, ann.createdBy, ann.publishedAt, ann.targetAudience]
  );
}

export async function deleteDbAnnouncement(id: string): Promise<void> {
  await runQuery("DELETE FROM announcements WHERE id = ?", [id]);
}

export async function getDbGallery(): Promise<GalleryItem[]> {
  const rows = await allQuery("SELECT * FROM gallery ORDER BY date DESC");
  return rows.map(r => ({
    id: r.id,
    imageUrl: r.imageUrl,
    category: r.category as any,
    eventId: r.eventId || undefined,
    caption: r.caption,
    uploadedBy: r.uploadedBy,
    date: r.date,
    photographer: r.photographer
  }));
}

export async function saveDbGalleryItem(item: GalleryItem): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO gallery (id, imageUrl, category, eventId, caption, uploadedBy, date, photographer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      item.id, item.imageUrl, item.category, item.eventId || '', item.caption, 
      item.uploadedBy, item.date, item.photographer
    ]
  );
}

export async function deleteDbGalleryItem(id: string): Promise<void> {
  await runQuery("DELETE FROM gallery WHERE id = ?", [id]);
}

export async function getDbScoreboard(): Promise<HouseScore[]> {
  const rows = await allQuery("SELECT * FROM scoreboard");
  return rows.map(r => ({
    house: r.house as any,
    totalPoints: r.totalPoints,
    lastUpdated: r.lastUpdated
  }));
}

export async function saveDbScoreboardItem(score: HouseScore): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO scoreboard (house, totalPoints, lastUpdated) VALUES (?, ?, ?)",
    [score.house, score.totalPoints, score.lastUpdated]
  );
}

export async function getDbIndividualRankings(): Promise<IndividualRanking[]> {
  const rows = await allQuery("SELECT * FROM individual_rankings ORDER BY points DESC, rank ASC");
  return rows.map(r => ({
    rank: r.rank,
    studentId: r.studentId,
    name: r.name,
    house: r.house as any,
    eventsCount: r.eventsCount,
    points: r.points,
    trend: r.trend as any
  }));
}

export async function saveDbIndividualRanking(ranking: IndividualRanking): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO individual_rankings (studentId, rank, name, house, eventsCount, points, trend) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [ranking.studentId, ranking.rank, ranking.name, ranking.house, ranking.eventsCount, ranking.points, ranking.trend]
  );
}

export async function clearDbIndividualRankings(): Promise<void> {
  await runQuery("DELETE FROM individual_rankings");
}

export async function getDbRecentWinners(): Promise<RecentWinnerFeedItem[]> {
  const rows = await allQuery("SELECT * FROM recent_winners");
  return rows.map(r => ({
    id: r.id,
    eventName: r.eventName,
    teamOrStudentName: r.teamOrStudentName,
    house: r.house as any,
    pointsAdded: r.pointsAdded,
    timeAgo: r.timeAgo
  }));
}

export async function saveDbRecentWinner(winner: RecentWinnerFeedItem): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO recent_winners (id, eventName, teamOrStudentName, house, pointsAdded, timeAgo) VALUES (?, ?, ?, ?, ?, ?)",
    [winner.id, winner.eventName, winner.teamOrStudentName, winner.house, winner.pointsAdded, winner.timeAgo]
  );
}

export async function clearDbRecentWinners(): Promise<void> {
  await runQuery("DELETE FROM recent_winners");
}

export async function getDbGroups(): Promise<string[]> {
  const rows = await allQuery("SELECT name FROM groups");
  return rows.map(r => r.name);
}

export async function saveDbGroup(groupName: string): Promise<void> {
  await runQuery("INSERT OR REPLACE INTO groups (name) VALUES (?)", [groupName]);
}

export async function deleteDbGroup(groupName: string): Promise<void> {
  await runQuery("DELETE FROM groups WHERE name = ?", [groupName]);
}

export async function getDbScoreboardTeams(): Promise<ScoreboardTeam[]> {
  const rows = await allQuery("SELECT * FROM scoreboard_teams");
  return rows.map(r => ({
    id: r.id,
    teamName: r.teamName,
    teamColor: r.teamColor,
    teamLogo: r.teamLogo || undefined,
    totalScore: r.totalScore,
    status: r.status as any,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  }));
}

export async function saveDbScoreboardTeam(team: ScoreboardTeam): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO scoreboard_teams (id, teamName, teamColor, teamLogo, totalScore, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [team.id, team.teamName, team.teamColor, team.teamLogo || '', team.totalScore, team.status, team.createdAt, team.updatedAt]
  );
}

export async function deleteDbScoreboardTeam(id: string): Promise<void> {
  await runQuery("DELETE FROM scoreboard_teams WHERE id = ?", [id]);
}

export async function getDbScoreHistory(): Promise<ScoreHistory[]> {
  const rows = await allQuery("SELECT * FROM score_history ORDER BY createdAt DESC");
  return rows.map(r => ({
    id: r.id,
    teamId: r.teamId,
    teamName: r.teamName,
    scoreChange: r.scoreChange,
    reason: r.reason || undefined,
    updatedBy: r.updatedBy,
    createdAt: r.createdAt,
    eventId: r.eventId || undefined,
    eventName: r.eventName || undefined,
    eventCategory: r.eventCategory || undefined,
    studentName: r.studentName || undefined,
    position: r.position || undefined
  }));
}

export async function saveDbScoreHistoryItem(history: ScoreHistory): Promise<void> {
  await runQuery(
    "INSERT OR REPLACE INTO score_history (id, teamId, teamName, scoreChange, reason, updatedBy, createdAt, eventId, eventName, eventCategory, studentName, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      history.id, history.teamId, history.teamName, history.scoreChange, 
      history.reason || '', history.updatedBy, history.createdAt, 
      history.eventId || '', history.eventName || '', history.eventCategory || '', 
      history.studentName || '', history.position || ''
    ]
  );
}

export async function deleteDbScoreHistoryItem(id: string): Promise<void> {
  await runQuery("DELETE FROM score_history WHERE id = ?", [id]);
}

export async function getDbAssignedStudentIds(): Promise<string[]> {
  const rows = await allQuery("SELECT studentId FROM assigned_student_ids");
  return rows.map(r => r.studentId);
}

export async function addDbAssignedStudentId(studentId: string): Promise<void> {
  await runQuery("INSERT OR REPLACE INTO assigned_student_ids (studentId) VALUES (?)", [studentId]);
}

export async function clearDbAssignedStudentIds(): Promise<void> {
  await runQuery("DELETE FROM assigned_student_ids");
}

export async function getDbStatsOverrides(): Promise<any> {
  const rows = await allQuery("SELECT * FROM stats_overrides");
  const stats: any = {};
  for (const r of rows) {
    stats[r.key] = r.value;
  }
  return stats;
}

export async function saveDbStatsOverrides(stats: any): Promise<void> {
  if (stats) {
    for (const k of Object.keys(stats)) {
      await runQuery(
        "INSERT OR REPLACE INTO stats_overrides (key, value) VALUES (?, ?)",
        [k, stats[k]]
      );
    }
  }
}

// Complete SQLite database reset to standard seeds
export async function resetSqliteToDefaultSeeds() {
  await runQuery("DELETE FROM users");
  await runQuery("DELETE FROM students");
  await runQuery("DELETE FROM events");
  await runQuery("DELETE FROM registrations");
  await runQuery("DELETE FROM results");
  await runQuery("DELETE FROM teams");
  await runQuery("DELETE FROM certificates");
  await runQuery("DELETE FROM notifications");
  await runQuery("DELETE FROM announcements");
  await runQuery("DELETE FROM gallery");
  await runQuery("DELETE FROM scoreboard");
  await runQuery("DELETE FROM individual_rankings");
  await runQuery("DELETE FROM recent_winners");
  await runQuery("DELETE FROM groups");
  await runQuery("DELETE FROM scoreboard_teams");
  await runQuery("DELETE FROM score_history");
  await runQuery("DELETE FROM assigned_student_ids");
  await runQuery("DELETE FROM stats_overrides");

  await seedDefaultSqliteData();
}

// Global hook to back up the entire SQLite binary file buffer into Cloud SQL (PostgreSQL)
// This guarantees file persistence across ephemeral Cloud Run container rebuilds/restarts!
import pg from 'pg';
const sqlPool = new pg.Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  connectionTimeoutMillis: 15000,
});

export async function persistSqliteDbToCloudSQL() {
  if (!process.env.SQL_HOST) {
    console.log("No Cloud SQL config detected. Skipping Cloud SQL binary synchronization.");
    return;
  }
  try {
    // Read local SQLite binary file as byte stream
    const dbBuffer = fs.readFileSync(DB_FILE);
    
    // Create backup table in Cloud SQL if it doesn't exist
    await sqlPool.query(`
      CREATE TABLE IF NOT EXISTS sqlite_backups (
        key VARCHAR(255) PRIMARY KEY,
        value BYTEA NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert binary buffer directly into Cloud SQL
    await sqlPool.query(`
      INSERT INTO sqlite_backups (key, value, updated_at)
      VALUES ('sqlite_file', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    `, [dbBuffer]);

    console.log("SQLite binary database successfully backed up to Cloud SQL!");
  } catch (err) {
    console.error("Failed to back up SQLite to Cloud SQL:", err);
  }
}

export async function restoreSqliteDbFromCloudSQL() {
  if (!process.env.SQL_HOST) {
    console.log("No Cloud SQL config detected. Skipping Cloud SQL recovery.");
    return;
  }
  try {
    // Create backup table in Cloud SQL if it doesn't exist
    await sqlPool.query(`
      CREATE TABLE IF NOT EXISTS sqlite_backups (
        key VARCHAR(255) PRIMARY KEY,
        value BYTEA NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const res = await sqlPool.query("SELECT value FROM sqlite_backups WHERE key = 'sqlite_file'");
    if (res.rows.length > 0) {
      const dbBuffer = res.rows[0].value;
      fs.writeFileSync(DB_FILE, dbBuffer);
      console.log("SQLite binary database successfully restored from Cloud SQL!");
    } else {
      console.log("No existing SQLite database found in Cloud SQL. Initializing fresh.");
    }
  } catch (err) {
    console.error("Failed to restore SQLite from Cloud SQL:", err);
  }
}
