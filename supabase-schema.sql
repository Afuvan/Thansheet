-- Supabase Schema for Darussalma Arts Fest
-- Run this in Supabase SQL Editor if tables are not created yet.

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  role TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);

-- 2. Students
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  "studentId" TEXT NOT NULL UNIQUE,
  class TEXT NOT NULL,
  house TEXT NOT NULL,
  photo TEXT,
  "contactNumber" TEXT,
  "emergencyContact" TEXT,
  "group" TEXT,
  category TEXT
);

-- 3. Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  rules JSONB,
  "maxParticipants" INTEGER NOT NULL,
  "currentParticipantsCount" INTEGER NOT NULL,
  status TEXT NOT NULL,
  "programCategory" TEXT
);

-- 4. Registrations
CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "teamId" TEXT,
  status TEXT NOT NULL,
  "registeredAt" TEXT NOT NULL,
  "paymentStatus" TEXT NOT NULL,
  "confirmationNumber" TEXT NOT NULL
);

-- 5. Results
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "firstPlace" JSONB NOT NULL,
  "secondPlace" JSONB NOT NULL,
  "thirdPlace" JSONB NOT NULL,
  "judgeRemarks" TEXT,
  "publishedAt" TEXT NOT NULL
);

-- 6. Teams
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  house TEXT NOT NULL,
  members JSONB NOT NULL
);

-- 7. Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  house TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  category TEXT NOT NULL,
  "resultId" TEXT,
  "awardText" TEXT NOT NULL,
  points INTEGER NOT NULL,
  "issuedAt" TEXT NOT NULL,
  "verificationCode" TEXT NOT NULL
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TEXT NOT NULL
);

-- 9. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "publishedAt" TEXT NOT NULL,
  "targetAudience" TEXT NOT NULL
);

-- 10. Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  "imageUrl" TEXT NOT NULL,
  category TEXT NOT NULL,
  "eventId" TEXT,
  caption TEXT NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  date TEXT NOT NULL,
  photographer TEXT NOT NULL
);

-- 11. Scoreboard (House Scores)
CREATE TABLE IF NOT EXISTS scoreboard (
  house TEXT PRIMARY KEY,
  "totalPoints" INTEGER NOT NULL,
  "lastUpdated" TEXT NOT NULL
);

-- 12. Individual Rankings
CREATE TABLE IF NOT EXISTS individual_rankings (
  "studentId" TEXT PRIMARY KEY,
  rank INTEGER NOT NULL,
  name TEXT NOT NULL,
  house TEXT NOT NULL,
  "eventsCount" INTEGER NOT NULL,
  points INTEGER NOT NULL,
  trend TEXT NOT NULL
);

-- 13. Recent Winners
CREATE TABLE IF NOT EXISTS recent_winners (
  id TEXT PRIMARY KEY,
  "eventName" TEXT NOT NULL,
  "teamOrStudentName" TEXT NOT NULL,
  house TEXT NOT NULL,
  "pointsAdded" INTEGER NOT NULL,
  "timeAgo" TEXT NOT NULL
);

-- 14. Groups
CREATE TABLE IF NOT EXISTS groups (
  name TEXT PRIMARY KEY
);

-- 15. Scoreboard Teams
CREATE TABLE IF NOT EXISTS scoreboard_teams (
  id TEXT PRIMARY KEY,
  "teamName" TEXT NOT NULL,
  "teamColor" TEXT NOT NULL,
  "teamLogo" TEXT,
  "totalScore" INTEGER NOT NULL,
  status TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

-- 16. Score History
CREATE TABLE IF NOT EXISTS score_history (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL,
  "teamName" TEXT NOT NULL,
  "scoreChange" INTEGER NOT NULL,
  reason TEXT,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  "eventId" TEXT,
  "eventName" TEXT,
  "eventCategory" TEXT,
  "studentName" TEXT,
  position TEXT
);

-- 17. Assigned Student IDs
CREATE TABLE IF NOT EXISTS assigned_student_ids (
  "studentId" TEXT PRIMARY KEY
);

-- 18. Stats Overrides
CREATE TABLE IF NOT EXISTS stats_overrides (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

-- Enable RLS (Row Level Security) and public read/write policies for anon access if using standard Supabase REST API
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoreboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoreboard_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_student_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to registrations" ON registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to results" ON results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to certificates" ON certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to gallery" ON gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to scoreboard" ON scoreboard FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to individual_rankings" ON individual_rankings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to recent_winners" ON recent_winners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to groups" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to scoreboard_teams" ON scoreboard_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to score_history" ON score_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to assigned_student_ids" ON assigned_student_ids FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to stats_overrides" ON stats_overrides FOR ALL USING (true) WITH CHECK (true);
