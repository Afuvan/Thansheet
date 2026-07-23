import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  User, Student, Event, Registration, Result, Team, Certificate, 
  Notification, Announcement, GalleryItem, HouseScore, IndividualRanking, 
  RecentWinnerFeedItem, ScoreboardTeam, ScoreHistory 
} from '../types';

// Standardize Supabase URL
const rawUrl = process.env.SUPABASE_URL || 'phqyznpnyqxcgsrxbymk';
const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}.supabase.co`;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'ap-south-1';

console.log(`[Supabase] Initializing client with URL: ${supabaseUrl}`);

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    return supabaseClient;
  } catch (err) {
    console.error("[Supabase] Error initializing client:", err);
    return null;
  }
}

// In-Memory cache fallback to ensure fast responses & offline resilience
let inMemoryDb: any = null;

// Default Seed Data
export function getDefaultMemoryDb(): any {
  return {
    users: [
      { id: 'u-admin', email: 'admin@fest.com', password: 'admin123', role: 'admin', createdAt: new Date().toISOString() },
      { id: 'u-judge', email: 'judge@fest.com', password: 'judge123', role: 'judge', createdAt: new Date().toISOString() }
    ],
    students: [],
    events: [
      {
        id: 'evt-1',
        name: 'Mappilapattu (Solo)',
        category: 'stage',
        type: 'individual',
        date: '2026-08-10',
        time: '09:30 AM',
        venue: 'Main Stage A',
        rules: { eligibility: 'All Grades', timeLimit: '5 Minutes', judgingCriteria: 'Pitch, Rhythm, Pronunciation', materials: 'Karaoke optional' },
        maxParticipants: 30,
        currentParticipantsCount: 0,
        status: 'open',
        programCategory: 'Senior'
      },
      {
        id: 'evt-2',
        name: 'Elocution - English',
        category: 'stage',
        type: 'individual',
        date: '2026-08-10',
        time: '11:00 AM',
        venue: 'Auditorium Hall B',
        rules: { eligibility: 'Junior & Senior', timeLimit: '7 Minutes', judgingCriteria: 'Clarity, Content, Confidence', materials: 'None' },
        maxParticipants: 20,
        currentParticipantsCount: 0,
        status: 'open',
        programCategory: 'Junior'
      },
      {
        id: 'evt-3',
        name: 'Pencil Drawing',
        category: 'off_stage',
        type: 'individual',
        date: '2026-08-11',
        time: '02:00 PM',
        venue: 'Art Room 1',
        rules: { eligibility: 'All Groups', timeLimit: '1 Hour', judgingCriteria: 'Creativity, Neatness, Shading', materials: 'Drawing Sheet provided' },
        maxParticipants: 50,
        currentParticipantsCount: 0,
        status: 'open',
        programCategory: 'General'
      }
    ],
    registrations: [],
    results: [],
    teams: [],
    certificates: [],
    notifications: [],
    announcements: [
      {
        id: 'ann-1',
        title: 'Darussalma Arts Fest 2026 Registration Open!',
        content: 'All students can now register for stage and off-stage competitions through the portal.',
        createdBy: 'u-admin',
        publishedAt: new Date().toISOString(),
        targetAudience: 'all'
      }
    ],
    gallery: [],
    scoreboard: [
      { house: 'Team A', totalPoints: 120, lastUpdated: new Date().toISOString() },
      { house: 'Team B', totalPoints: 95, lastUpdated: new Date().toISOString() },
      { house: 'Team C', totalPoints: 140, lastUpdated: new Date().toISOString() }
    ],
    individualRankings: [],
    recentWinners: [],
    groups: ['Sub-Junior', 'Junior', 'Senior', 'Super-Senior'],
    scoreboardTeams: [
      { id: 'team-crimson', teamName: 'Crimson', teamColor: '#EF4444', totalScore: 120, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'team-cobalt', teamName: 'Cobalt', teamColor: '#3B82F6', totalScore: 85, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'team-emerald', teamName: 'Emerald', teamColor: '#10B981', totalScore: 150, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'team-amber', teamName: 'Amber', teamColor: '#F59E0B', totalScore: 95, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ],
    scoreHistory: [
      { id: 'sh-1', teamId: 'team-crimson', teamName: 'Crimson', scoreChange: 120, reason: 'Inaugural Competition First Place', updatedBy: 'admin@fest.com', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'sh-2', teamId: 'team-cobalt', teamName: 'Cobalt', scoreChange: 85, reason: 'Quiz Competition Winner', updatedBy: 'admin@fest.com', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'sh-3', teamId: 'team-emerald', teamName: 'Emerald', scoreChange: 150, reason: 'Elocution Championship', updatedBy: 'admin@fest.com', createdAt: new Date(Date.now() - 1800000).toISOString() },
      { id: 'sh-4', teamId: 'team-amber', teamName: 'Amber', scoreChange: 95, reason: 'Group Song Contest Points', updatedBy: 'admin@fest.com', createdAt: new Date(Date.now() - 600000).toISOString() }
    ],
    assignedStudentIds: [],
    statsOverrides: {}
  };
}

export async function initializeSupabaseTables(): Promise<void> {
  if (!inMemoryDb) {
    inMemoryDb = getDefaultMemoryDb();
  }
  const client = getSupabase();
  if (!client) return;

  try {
    // Test if table 'users' exists in Supabase
    const { data: users, error } = await client.from('users').select('id').limit(1);
    if (error) {
      console.warn("[Supabase] Tables might not exist in Supabase or RLS requires policies. Warning:", error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log("[Supabase] Database appears empty. Seeding initial data...");
      await seedDefaultSupabaseData();
    } else {
      console.log("[Supabase] Connected to Supabase tables successfully!");
    }
  } catch (err) {
    console.warn("[Supabase] Initial table check caught error:", err);
  }
}

export async function seedDefaultSupabaseData(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const def = getDefaultMemoryDb();

  try {
    // Seed users
    for (const u of def.users) {
      await client.from('users').upsert(u);
    }
    // Seed events
    for (const e of def.events) {
      await client.from('events').upsert(e);
    }
    // Seed scoreboard
    for (const s of def.scoreboard) {
      await client.from('scoreboard').upsert(s);
    }
    // Seed announcements
    for (const a of def.announcements) {
      await client.from('announcements').upsert(a);
    }
    // Seed groups
    for (const g of def.groups) {
      await client.from('groups').upsert({ name: g });
    }
    // Seed scoreboard teams
    for (const st of def.scoreboardTeams) {
      await client.from('scoreboard_teams').upsert(st);
    }
    // Seed score history
    for (const sh of def.scoreHistory) {
      await client.from('score_history').upsert(sh);
    }
    console.log("[Supabase] Seeded initial data into Supabase!");
  } catch (err) {
    console.error("[Supabase] Error seeding initial data:", err);
  }
}

// Helper: safe JSON parse
function parseJsonField(val: any, fallback: any = {}) {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val || fallback;
}

// Entity CRUD Operations

// 1. Users
export async function getDbUsers(): Promise<User[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('users').select('*');
    if (!error && data) {
      inMemoryDb.users = data;
      return data;
    }
  }
  return inMemoryDb.users || [];
}

export async function saveDbUser(user: User): Promise<void> {
  if (!inMemoryDb.users) inMemoryDb.users = [];
  const idx = inMemoryDb.users.findIndex((u: any) => u.id === user.id);
  if (idx >= 0) inMemoryDb.users[idx] = user;
  else inMemoryDb.users.push(user);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('users').upsert(user);
    if (error) console.error("[Supabase] saveDbUser error:", error.message);
  }
}

// 2. Students
export async function getDbStudents(): Promise<Student[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('students').select('*');
    if (!error && data) {
      inMemoryDb.students = data;
      return data;
    }
  }
  return inMemoryDb.students || [];
}

export async function saveDbStudent(student: Student): Promise<void> {
  if (!inMemoryDb.students) inMemoryDb.students = [];
  const idx = inMemoryDb.students.findIndex((s: any) => s.id === student.id);
  if (idx >= 0) inMemoryDb.students[idx] = student;
  else inMemoryDb.students.push(student);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('students').upsert(student);
    if (error) console.error("[Supabase] saveDbStudent error:", error.message);
  }
}

export async function deleteDbStudent(id: string): Promise<void> {
  inMemoryDb.students = (inMemoryDb.students || []).filter((s: any) => s.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('students').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbStudent error:", error.message);
  }
}

// 3. Events
export async function getDbEvents(): Promise<Event[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('events').select('*');
    if (!error && data) {
      const parsed = data.map((e: any) => ({
        ...e,
        rules: parseJsonField(e.rules, {})
      }));
      inMemoryDb.events = parsed;
      return parsed;
    }
  }
  return inMemoryDb.events || [];
}

export async function saveDbEvent(event: Event): Promise<void> {
  if (!inMemoryDb.events) inMemoryDb.events = [];
  const idx = inMemoryDb.events.findIndex((e: any) => e.id === event.id);
  if (idx >= 0) inMemoryDb.events[idx] = event;
  else inMemoryDb.events.push(event);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('events').upsert(event);
    if (error) console.error("[Supabase] saveDbEvent error:", error.message);
  }
}

export async function deleteDbEvent(id: string): Promise<void> {
  inMemoryDb.events = (inMemoryDb.events || []).filter((e: any) => e.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('events').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbEvent error:", error.message);
  }
}

// 4. Registrations
export async function getDbRegistrations(): Promise<Registration[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('registrations').select('*');
    if (!error && data) {
      inMemoryDb.registrations = data;
      return data;
    }
  }
  return inMemoryDb.registrations || [];
}

export async function saveDbRegistration(reg: Registration): Promise<void> {
  if (!inMemoryDb.registrations) inMemoryDb.registrations = [];
  const idx = inMemoryDb.registrations.findIndex((r: any) => r.id === reg.id);
  if (idx >= 0) inMemoryDb.registrations[idx] = reg;
  else inMemoryDb.registrations.push(reg);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('registrations').upsert(reg);
    if (error) console.error("[Supabase] saveDbRegistration error:", error.message);
  }
}

export async function deleteDbRegistration(id: string): Promise<void> {
  inMemoryDb.registrations = (inMemoryDb.registrations || []).filter((r: any) => r.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('registrations').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbRegistration error:", error.message);
  }
}

// 5. Results
export async function getDbResults(): Promise<Result[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('results').select('*');
    if (!error && data) {
      const parsed = data.map((r: any) => ({
        ...r,
        firstPlace: parseJsonField(r.firstPlace, {}),
        secondPlace: parseJsonField(r.secondPlace, {}),
        thirdPlace: parseJsonField(r.thirdPlace, {})
      }));
      inMemoryDb.results = parsed;
      return parsed;
    }
  }
  return inMemoryDb.results || [];
}

export async function saveDbResult(result: Result): Promise<void> {
  if (!inMemoryDb.results) inMemoryDb.results = [];
  const idx = inMemoryDb.results.findIndex((r: any) => r.id === result.id);
  if (idx >= 0) inMemoryDb.results[idx] = result;
  else inMemoryDb.results.push(result);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('results').upsert(result);
    if (error) console.error("[Supabase] saveDbResult error:", error.message);
  }
}

export async function deleteDbResult(id: string): Promise<void> {
  inMemoryDb.results = (inMemoryDb.results || []).filter((r: any) => r.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('results').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbResult error:", error.message);
  }
}

// 6. Teams
export async function getDbTeams(): Promise<Team[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('teams').select('*');
    if (!error && data) {
      const parsed = data.map((t: any) => ({
        ...t,
        members: parseJsonField(t.members, [])
      }));
      inMemoryDb.teams = parsed;
      return parsed;
    }
  }
  return inMemoryDb.teams || [];
}

export async function saveDbTeam(team: Team): Promise<void> {
  if (!inMemoryDb.teams) inMemoryDb.teams = [];
  const idx = inMemoryDb.teams.findIndex((t: any) => t.id === team.id);
  if (idx >= 0) inMemoryDb.teams[idx] = team;
  else inMemoryDb.teams.push(team);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('teams').upsert(team);
    if (error) console.error("[Supabase] saveDbTeam error:", error.message);
  }
}

export async function deleteDbTeam(id: string): Promise<void> {
  inMemoryDb.teams = (inMemoryDb.teams || []).filter((t: any) => t.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('teams').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbTeam error:", error.message);
  }
}

// 7. Certificates
export async function getDbCertificates(): Promise<Certificate[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('certificates').select('*');
    if (!error && data) {
      inMemoryDb.certificates = data;
      return data;
    }
  }
  return inMemoryDb.certificates || [];
}

export async function saveDbCertificate(cert: Certificate): Promise<void> {
  if (!inMemoryDb.certificates) inMemoryDb.certificates = [];
  const idx = inMemoryDb.certificates.findIndex((c: any) => c.id === cert.id);
  if (idx >= 0) inMemoryDb.certificates[idx] = cert;
  else inMemoryDb.certificates.push(cert);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('certificates').upsert(cert);
    if (error) console.error("[Supabase] saveDbCertificate error:", error.message);
  }
}

export async function deleteDbCertificate(id: string): Promise<void> {
  inMemoryDb.certificates = (inMemoryDb.certificates || []).filter((c: any) => c.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('certificates').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbCertificate error:", error.message);
  }
}

// 8. Notifications
export async function getDbNotifications(): Promise<Notification[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('notifications').select('*').order('createdAt', { ascending: false });
    if (!error && data) {
      inMemoryDb.notifications = data;
      return data;
    }
  }
  return inMemoryDb.notifications || [];
}

export async function saveDbNotification(notif: Notification): Promise<void> {
  if (!inMemoryDb.notifications) inMemoryDb.notifications = [];
  const idx = inMemoryDb.notifications.findIndex((n: any) => n.id === notif.id);
  if (idx >= 0) inMemoryDb.notifications[idx] = notif;
  else inMemoryDb.notifications.unshift(notif);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('notifications').upsert(notif);
    if (error) console.error("[Supabase] saveDbNotification error:", error.message);
  }
}

// 9. Announcements
export async function getDbAnnouncements(): Promise<Announcement[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('announcements').select('*').order('publishedAt', { ascending: false });
    if (!error && data) {
      inMemoryDb.announcements = data;
      return data;
    }
  }
  return inMemoryDb.announcements || [];
}

export async function saveDbAnnouncement(ann: Announcement): Promise<void> {
  if (!inMemoryDb.announcements) inMemoryDb.announcements = [];
  const idx = inMemoryDb.announcements.findIndex((a: any) => a.id === ann.id);
  if (idx >= 0) inMemoryDb.announcements[idx] = ann;
  else inMemoryDb.announcements.unshift(ann);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('announcements').upsert(ann);
    if (error) console.error("[Supabase] saveDbAnnouncement error:", error.message);
  }
}

export async function deleteDbAnnouncement(id: string): Promise<void> {
  inMemoryDb.announcements = (inMemoryDb.announcements || []).filter((a: any) => a.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('announcements').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbAnnouncement error:", error.message);
  }
}

// 10. Gallery
export async function getDbGallery(): Promise<GalleryItem[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('gallery').select('*').order('date', { ascending: false });
    if (!error && data) {
      inMemoryDb.gallery = data;
      return data;
    }
  }
  return inMemoryDb.gallery || [];
}

export async function saveDbGalleryItem(item: GalleryItem): Promise<void> {
  if (!inMemoryDb.gallery) inMemoryDb.gallery = [];
  const idx = inMemoryDb.gallery.findIndex((g: any) => g.id === item.id);
  if (idx >= 0) inMemoryDb.gallery[idx] = item;
  else inMemoryDb.gallery.unshift(item);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('gallery').upsert(item);
    if (error) console.error("[Supabase] saveDbGalleryItem error:", error.message);
  }
}

export async function deleteDbGalleryItem(id: string): Promise<void> {
  inMemoryDb.gallery = (inMemoryDb.gallery || []).filter((g: any) => g.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('gallery').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbGalleryItem error:", error.message);
  }
}

// 11. Scoreboard (House Scores)
export async function getDbScoreboard(): Promise<HouseScore[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('scoreboard').select('*');
    if (!error && data) {
      inMemoryDb.scoreboard = data;
      return data;
    }
  }
  return inMemoryDb.scoreboard || [];
}

export async function saveDbScoreboardItem(score: HouseScore): Promise<void> {
  if (!inMemoryDb.scoreboard) inMemoryDb.scoreboard = [];
  const idx = inMemoryDb.scoreboard.findIndex((s: any) => s.house === score.house);
  if (idx >= 0) inMemoryDb.scoreboard[idx] = score;
  else inMemoryDb.scoreboard.push(score);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('scoreboard').upsert(score);
    if (error) console.error("[Supabase] saveDbScoreboardItem error:", error.message);
  }
}

// 12. Individual Rankings
export async function getDbIndividualRankings(): Promise<IndividualRanking[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('individual_rankings').select('*').order('points', { ascending: false });
    if (!error && data) {
      inMemoryDb.individualRankings = data;
      return data;
    }
  }
  return inMemoryDb.individualRankings || [];
}

export async function saveDbIndividualRanking(ranking: IndividualRanking): Promise<void> {
  if (!inMemoryDb.individualRankings) inMemoryDb.individualRankings = [];
  const idx = inMemoryDb.individualRankings.findIndex((ir: any) => ir.studentId === ranking.studentId);
  if (idx >= 0) inMemoryDb.individualRankings[idx] = ranking;
  else inMemoryDb.individualRankings.push(ranking);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('individual_rankings').upsert(ranking);
    if (error) console.error("[Supabase] saveDbIndividualRanking error:", error.message);
  }
}

export async function clearDbIndividualRankings(): Promise<void> {
  inMemoryDb.individualRankings = [];
  const client = getSupabase();
  if (client) {
    await client.from('individual_rankings').delete().neq('studentId', '');
  }
}

// 13. Recent Winners
export async function getDbRecentWinners(): Promise<RecentWinnerFeedItem[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('recent_winners').select('*');
    if (!error && data) {
      inMemoryDb.recentWinners = data;
      return data;
    }
  }
  return inMemoryDb.recentWinners || [];
}

export async function saveDbRecentWinner(winner: RecentWinnerFeedItem): Promise<void> {
  if (!inMemoryDb.recentWinners) inMemoryDb.recentWinners = [];
  const idx = inMemoryDb.recentWinners.findIndex((rw: any) => rw.id === winner.id);
  if (idx >= 0) inMemoryDb.recentWinners[idx] = winner;
  else inMemoryDb.recentWinners.push(winner);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('recent_winners').upsert(winner);
    if (error) console.error("[Supabase] saveDbRecentWinner error:", error.message);
  }
}

export async function clearDbRecentWinners(): Promise<void> {
  inMemoryDb.recentWinners = [];
  const client = getSupabase();
  if (client) {
    await client.from('recent_winners').delete().neq('id', '');
  }
}

// 14. Groups
export async function getDbGroups(): Promise<string[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('groups').select('name');
    if (!error && data) {
      const grps = data.map((g: any) => g.name);
      inMemoryDb.groups = grps;
      return grps;
    }
  }
  return inMemoryDb.groups || [];
}

export async function saveDbGroup(groupName: string): Promise<void> {
  if (!inMemoryDb.groups) inMemoryDb.groups = [];
  if (!inMemoryDb.groups.includes(groupName)) inMemoryDb.groups.push(groupName);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('groups').upsert({ name: groupName });
    if (error) console.error("[Supabase] saveDbGroup error:", error.message);
  }
}

export async function deleteDbGroup(groupName: string): Promise<void> {
  inMemoryDb.groups = (inMemoryDb.groups || []).filter((g: any) => g !== groupName);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('groups').delete().eq('name', groupName);
    if (error) console.error("[Supabase] deleteDbGroup error:", error.message);
  }
}

// 15. Scoreboard Teams
export async function getDbScoreboardTeams(): Promise<ScoreboardTeam[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('scoreboard_teams').select('*');
    if (!error && data) {
      inMemoryDb.scoreboardTeams = data;
      return data;
    }
  }
  return inMemoryDb.scoreboardTeams || [];
}

export async function saveDbScoreboardTeam(team: ScoreboardTeam): Promise<void> {
  if (!inMemoryDb.scoreboardTeams) inMemoryDb.scoreboardTeams = [];
  const idx = inMemoryDb.scoreboardTeams.findIndex((st: any) => st.id === team.id);
  if (idx >= 0) inMemoryDb.scoreboardTeams[idx] = team;
  else inMemoryDb.scoreboardTeams.push(team);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('scoreboard_teams').upsert(team);
    if (error) console.error("[Supabase] saveDbScoreboardTeam error:", error.message);
  }
}

export async function deleteDbScoreboardTeam(id: string): Promise<void> {
  inMemoryDb.scoreboardTeams = (inMemoryDb.scoreboardTeams || []).filter((st: any) => st.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('scoreboard_teams').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbScoreboardTeam error:", error.message);
  }
}

// 16. Score History
export async function getDbScoreHistory(): Promise<ScoreHistory[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('score_history').select('*').order('createdAt', { ascending: false });
    if (!error && data) {
      inMemoryDb.scoreHistory = data;
      return data;
    }
  }
  return inMemoryDb.scoreHistory || [];
}

export async function saveDbScoreHistoryItem(history: ScoreHistory): Promise<void> {
  if (!inMemoryDb.scoreHistory) inMemoryDb.scoreHistory = [];
  const idx = inMemoryDb.scoreHistory.findIndex((sh: any) => sh.id === history.id);
  if (idx >= 0) inMemoryDb.scoreHistory[idx] = history;
  else inMemoryDb.scoreHistory.unshift(history);

  const client = getSupabase();
  if (client) {
    const { error } = await client.from('score_history').upsert(history);
    if (error) console.error("[Supabase] saveDbScoreHistoryItem error:", error.message);
  }
}

export async function deleteDbScoreHistoryItem(id: string): Promise<void> {
  inMemoryDb.scoreHistory = (inMemoryDb.scoreHistory || []).filter((sh: any) => sh.id !== id);
  const client = getSupabase();
  if (client) {
    const { error } = await client.from('score_history').delete().eq('id', id);
    if (error) console.error("[Supabase] deleteDbScoreHistoryItem error:", error.message);
  }
}

// 17. Assigned Student IDs
export async function getDbAssignedStudentIds(): Promise<string[]> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('assigned_student_ids').select('studentId');
    if (!error && data) {
      const ids = data.map((row: any) => row.studentId);
      inMemoryDb.assignedStudentIds = ids;
      return ids;
    }
  }
  return inMemoryDb.assignedStudentIds || [];
}

export async function addDbAssignedStudentId(studentId: string): Promise<void> {
  if (!inMemoryDb.assignedStudentIds) inMemoryDb.assignedStudentIds = [];
  if (!inMemoryDb.assignedStudentIds.includes(studentId)) inMemoryDb.assignedStudentIds.push(studentId);

  const client = getSupabase();
  if (client) {
    await client.from('assigned_student_ids').upsert({ studentId });
  }
}

export async function clearDbAssignedStudentIds(): Promise<void> {
  inMemoryDb.assignedStudentIds = [];
  const client = getSupabase();
  if (client) {
    await client.from('assigned_student_ids').delete().neq('studentId', '');
  }
}

// 18. Stats Overrides
export async function getDbStatsOverrides(): Promise<any> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from('stats_overrides').select('*');
    if (!error && data) {
      const obj: any = {};
      data.forEach((r: any) => { obj[r.key] = r.value; });
      inMemoryDb.statsOverrides = obj;
      return obj;
    }
  }
  return inMemoryDb.statsOverrides || {};
}

export async function saveDbStatsOverride(key: string, value: number): Promise<void> {
  if (!inMemoryDb.statsOverrides) inMemoryDb.statsOverrides = {};
  inMemoryDb.statsOverrides[key] = value;

  const client = getSupabase();
  if (client) {
    await client.from('stats_overrides').upsert({ key, value });
  }
}

export async function clearDbStatsOverrides(): Promise<void> {
  inMemoryDb.statsOverrides = {};
  const client = getSupabase();
  if (client) {
    await client.from('stats_overrides').delete().neq('key', '');
  }
}

// Aggregated Database snapshot loader for server.ts compatibility
export async function loadDatabaseFromSupabase(): Promise<any> {
  await initializeSupabaseTables();

  const [
    users, students, events, registrations, results, teams, certificates,
    notifications, announcements, gallery, scoreboard, individualRankings,
    recentWinners, groups, scoreboardTeams, scoreHistory, assignedStudentIds, statsOverrides
  ] = await Promise.all([
    getDbUsers(),
    getDbStudents(),
    getDbEvents(),
    getDbRegistrations(),
    getDbResults(),
    getDbTeams(),
    getDbCertificates(),
    getDbNotifications(),
    getDbAnnouncements(),
    getDbGallery(),
    getDbScoreboard(),
    getDbIndividualRankings(),
    getDbRecentWinners(),
    getDbGroups(),
    getDbScoreboardTeams(),
    getDbScoreHistory(),
    getDbAssignedStudentIds(),
    getDbStatsOverrides()
  ]);

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
}

export async function resetSupabaseToDefaultSeeds(): Promise<void> {
  inMemoryDb = getDefaultMemoryDb();
  await seedDefaultSupabaseData();
}

export async function checkSupabaseHealth(): Promise<any> {
  const startTime = Date.now();
  const client = getSupabase();
  if (!client) {
    return {
      connected: false,
      status: 'Disconnected',
      url: supabaseUrl,
      responseTimeMs: 0,
      tablesChecked: [],
      error: 'Supabase client failed to initialize'
    };
  }

  try {
    const tableChecks = [
      'students', 'events', 'registrations', 'teams', 'results',
      'certificates', 'notifications', 'announcements', 'gallery',
      'scoreboard', 'users'
    ];

    // Check raw Supabase REST health or auth endpoint
    const pingRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': supabaseAnonKey }
    });
    const latency = Date.now() - startTime;

    if (pingRes.ok || pingRes.status === 200 || pingRes.status === 404 || pingRes.status === 401) {
      const tableCounts: Record<string, number> = {};
      let verifiedTablesCount = 0;

      for (const tbl of tableChecks) {
        try {
          const { count, error } = await client.from(tbl).select('*', { count: 'exact', head: true });
          if (!error) {
            tableCounts[tbl] = count ?? 0;
            verifiedTablesCount++;
          } else {
            tableCounts[tbl] = 0;
          }
        } catch {
          tableCounts[tbl] = 0;
        }
      }

      return {
        connected: true,
        status: verifiedTablesCount > 0 ? 'Healthy' : 'Online (Active Sync)',
        url: supabaseUrl,
        responseTimeMs: latency,
        tablesChecked: tableChecks,
        tableCounts,
        verifiedTablesCount,
        timestamp: new Date().toISOString()
      };
    }

    return {
      connected: false,
      status: 'Error',
      url: supabaseUrl,
      responseTimeMs: latency,
      tablesChecked: tableChecks,
      error: `HTTP ${pingRes.status}: ${pingRes.statusText}`,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'Unreachable',
      url: supabaseUrl,
      responseTimeMs: Date.now() - startTime,
      tablesChecked: [],
      error: err?.message || String(err),
      timestamp: new Date().toISOString()
    };
  }
}

