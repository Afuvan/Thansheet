/**
 * Shared Type Definitions for Darussalma Arts Fest 2026
 */

export type UserRole = 'student' | 'admin' | 'judge';

export interface User {
  id: string;
  email: string;
  password?: string; // Stored server-side only
  role: UserRole;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  studentId: string;
  class: string;
  house: 'Team A' | 'Team B' | 'Team C' | 'Red' | 'Blue' | 'Green' | 'Yellow';
  photo?: string; // base64 or URL
  contactNumber?: string;
  emergencyContact?: string;
  group?: string;
  category?: 'Sub-Junior' | 'Junior' | 'Senior';
}

export interface EventRules {
  eligibility: string;
  timeLimit: string;
  judgingCriteria: string;
  materials: string;
}

export interface Event {
  id: string;
  name: string;
  category: 'stage' | 'off_stage';
  type: 'individual' | 'group';
  date: string;
  time: string;
  venue: string;
  rules: EventRules;
  maxParticipants: number;
  currentParticipantsCount: number;
  status: 'open' | 'registered' | 'completed' | 'results_published';
  programCategory?: 'Sub-Junior' | 'Junior' | 'Senior' | 'General' | 'Group';
}

export interface Registration {
  id: string;
  studentId: string;
  eventId: string;
  teamId?: string; // For group events
  status: 'registered' | 'cancelled' | 'completed';
  registeredAt: string;
  paymentStatus: 'pending' | 'completed';
  confirmationNumber: string;
}

export interface WinnerDetail {
  studentId?: string; // For individual
  teamId?: string; // For group
  name: string; // Display name
  house: 'Team A' | 'Team B' | 'Team C' | 'Red' | 'Blue' | 'Green' | 'Yellow';
  photo?: string;
  points: number;
}

export interface Result {
  id: string;
  eventId: string;
  firstPlace: WinnerDetail;
  secondPlace: WinnerDetail;
  thirdPlace: WinnerDetail;
  judgeRemarks: string;
  publishedAt: string;
}

export interface Team {
  id: string;
  name: string;
  eventId: string;
  house: 'Team A' | 'Team B' | 'Team C' | 'Red' | 'Blue' | 'Green' | 'Yellow';
  members: string[]; // List of student names or student IDs
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  house: 'Team A' | 'Team B' | 'Team C' | 'Red' | 'Blue' | 'Green' | 'Yellow';
  eventId: string;
  eventName: string;
  category: 'stage' | 'off_stage';
  resultId?: string; // if placed
  awardText: '1st Place' | '2nd Place' | '3rd Place' | 'Participation';
  points: number;
  issuedAt: string;
  verificationCode: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string; // admin user ID
  publishedAt: string;
  targetAudience: 'all' | 'students' | 'house_captains';
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  category: 'Opening Ceremony' | 'Competitions' | 'Audience' | 'Prize Distribution' | 'Closing Ceremony';
  eventId?: string;
  caption: string;
  uploadedBy: string;
  date: string;
  photographer: string;
}

export interface HouseScore {
  house: 'Team A' | 'Team B' | 'Team C' | 'Red' | 'Blue' | 'Green' | 'Yellow';
  totalPoints: number;
  lastUpdated: string;
}

export interface IndividualRanking {
  rank: number;
  studentId: string;
  name: string;
  house: 'Team A' | 'Team B' | 'Team C' | 'Red' | 'Blue' | 'Green' | 'Yellow';
  eventsCount: number;
  points: number;
  trend: 'up' | 'down' | 'same';
}

export interface RecentWinnerFeedItem {
  id: string;
  eventName: string;
  teamOrStudentName: string;
  house: 'Team A' | 'Team B' | 'Team C' | 'Red' | 'Blue' | 'Green' | 'Yellow';
  pointsAdded: number;
  timeAgo: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeEventsCount: number;
  pendingApprovalsCount: number;
  certificatesIssuedCount: number;
}

export interface ScoreboardTeam {
  id: string;
  teamName: string;
  teamColor: string;
  teamLogo?: string; // Optional (Base64 or URL)
  totalScore: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ScoreHistory {
  id: string;
  teamId: string;
  teamName: string; // convenient cached display name
  scoreChange: number;
  reason?: string;
  updatedBy: string;
  createdAt: string;
  eventId?: string;
  eventName?: string;
  eventCategory?: string;
  studentName?: string;
  position?: string;
}

