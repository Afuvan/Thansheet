import React, { useState, useEffect } from 'react';
import { Event, Student, User, Announcement, GalleryItem, Certificate, Registration, ScoreboardTeam, ScoreHistory } from '../types';
import { 
  Shield, RefreshCw, BarChart2, Plus, Users, Settings, Award, 
  MessageSquare, PlusCircle, CheckCircle2, AlertCircle, Edit, 
  Trash2, Calendar, MapPin, Clock, Eye, Image as ImageIcon, 
  Upload, X, Check, EyeOff, Sparkles, BookOpen, FolderPlus,
  Trophy, History, Palette, Activity, Database, Server, DatabaseBackup, Radio
} from 'lucide-react';

interface AdminDashboardProps {
  events: Event[];
  results: any[];
  onPublishResult: (resultDetails: any) => Promise<any>;
  onEditResult: (resultDetails: any) => Promise<any>;
  onDeleteResult: (resultId: string) => Promise<any>;
  onPostAnnouncement: (annDetails: any) => Promise<any>;
  onResetDb: () => Promise<void>;
  onRefreshEvents: () => Promise<void>;
  onRefreshAnnouncements: () => Promise<void>;
  onRefreshGallery: () => Promise<void>;
}

export default function AdminDashboard({
  events,
  results,
  onPublishResult,
  onEditResult,
  onDeleteResult,
  onPostAnnouncement,
  onResetDb,
  onRefreshEvents,
  onRefreshAnnouncements,
  onRefreshGallery
}: AdminDashboardProps) {
  const [activeMenu, setActiveMenu] = useState<'overview' | 'events' | 'students' | 'approvals' | 'results' | 'certificates' | 'announcements' | 'gallery' | 'settings' | 'groups' | 'scoreboard'>('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [adminResultsTab, setAdminResultsTab] = useState<'Senior' | 'Junior' | 'Sub-Junior' | 'General' | 'Group'>('Senior');
  const [editingResultId, setEditingResultId] = useState<string | null>(null);

  // Scoreboard state variables
  const [scoreboardTeams, setScoreboardTeams] = useState<ScoreboardTeam[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<ScoreboardTeam | null>(null);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ScoreboardTeam | null>(null);
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    teamColor: '#ef4444',
    teamLogo: '',
    totalScore: 0,
    status: 'active' as 'active' | 'inactive'
  });
  
  // Score update form state
  const [scoreUpdateForm, setScoreUpdateForm] = useState({
    teamId: '',
    scoreChange: 0,
    reason: ''
  });
  const [scoreUpdateStatus, setScoreUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  // Server-fetched dynamic stats
  const [stats, setStats] = useState({
    totalStudents: 1247,
    activeEventsCount: events.length,
    pendingApprovalsCount: 18,
    certificatesIssuedCount: 386
  });
  const [trends, setTrends] = useState<any[]>([]);

  // List states for local moderation
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Student list & Form states
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    class: '1',
    house: 'Team A' as 'Team A' | 'Team B' | 'Team C',
    category: 'Sub-Junior' as 'Sub-Junior' | 'Junior' | 'Senior',
    photo: ''
  });

  // Groups and Custom Deletion states
  const [groups, setGroups] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: string;
    name?: string;
    action: () => void;
  } | null>(null);

  // Registration approval states
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Supabase Backend Health Diagnostic state
  const [supabaseHealth, setSupabaseHealth] = useState<{
    connected: boolean;
    status: string;
    url: string;
    responseTimeMs: number;
    tablesChecked: string[];
    tableCounts?: Record<string, number>;
    error?: string;
    timestamp?: string;
  } | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);

  const checkSupabaseStatus = async () => {
    setIsCheckingSupabase(true);
    try {
      const res = await fetch('/api/admin/supabase-status');
      const data = await res.json();
      setSupabaseHealth(data);
    } catch (err: any) {
      setSupabaseHealth({
        connected: false,
        status: 'Unreachable',
        url: 'https://phqyznpnyqxcgsrxbymk.supabase.co',
        responseTimeMs: 0,
        tablesChecked: [],
        error: 'Network connection issue or API unreachable'
      });
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  // Manual Certificate Form states
  const [certStudentId, setCertStudentId] = useState('');
  const [certEventId, setCertEventId] = useState('');
  const [certAwardText, setCertAwardText] = useState<'1st Place' | '2nd Place' | '3rd Place' | 'Participation'>('Participation');
  const [certPoints, setCertPoints] = useState('0');
  const [certStatus, setCertStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isIssuingCert, setIsIssuingCert] = useState(false);
  const [certCategoryTab, setCertCategoryTab] = useState<'Senior' | 'Junior' | 'Sub-Junior' | 'General' | 'Group'>('Senior');

  useEffect(() => {
    const filtered = events.filter(e => e.programCategory === certCategoryTab);
    if (filtered.length > 0) {
      setCertEventId(filtered[0].id);
    } else {
      setCertEventId('');
    }
  }, [certCategoryTab, events]);

  useEffect(() => {
    if (students.length > 0 && !certStudentId) {
      setCertStudentId(students[0].id);
    }
  }, [students, certStudentId]);

  // Modal open states
  const [isEditStatsOpen, setIsEditStatsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Stats override form states
  const [statTotalStudents, setStatTotalStudents] = useState('');
  const [statActiveEvents, setStatActiveEvents] = useState('');
  const [statPendingApprovals, setStatPendingApprovals] = useState('');
  const [statCertificatesIssued, setStatCertificatesIssued] = useState('');
  const [isSavingStats, setIsSavingStats] = useState(false);

  // Form states for Publishing Results
  const [selectedEventId, setSelectedEventId] = useState('');
  const [firstPlaceName, setFirstPlaceName] = useState('');
  const [firstPlaceHouse, setFirstPlaceHouse] = useState<'Red' | 'Blue' | 'Green' | 'Yellow'>('Red');
  const [secondPlaceName, setSecondPlaceName] = useState('');
  const [secondPlaceHouse, setSecondPlaceHouse] = useState<'Red' | 'Blue' | 'Green' | 'Yellow'>('Blue');
  const [thirdPlaceName, setThirdPlaceName] = useState('');
  const [thirdPlaceHouse, setThirdPlaceHouse] = useState<'Red' | 'Blue' | 'Green' | 'Yellow'>('Green');
  const [judgeRemarks, setJudgeRemarks] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form states for Announcement
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAudience, setAnnAudience] = useState<'all' | 'students'>('all');
  const [isPostingAnn, setIsPostingAnn] = useState(false);
  const [annStatus, setAnnStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form states for Event creation & editing
  const [eventForm, setEventForm] = useState({
    name: '',
    category: 'stage' as 'stage' | 'off_stage',
    type: 'individual' as 'individual' | 'group',
    date: '2026-03-12',
    time: '10:00 AM',
    venue: '',
    maxParticipants: 30,
    currentParticipantsCount: 0,
    status: 'open' as 'open' | 'results_published',
    programCategory: 'Sub-Junior' as 'Sub-Junior' | 'Junior' | 'Senior' | 'General' | 'Group',
    rules: {
      eligibility: '',
      timeLimit: '',
      judgingCriteria: '',
      materials: ''
    }
  });

  // Form states for Gallery upload
  const [galleryForm, setGalleryForm] = useState({
    imageUrl: '',
    category: 'Competitions' as any,
    caption: '',
    photographer: ''
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [galleryStatus, setGalleryStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch Dashboard Stats & local lists
  useEffect(() => {
    fetchDashboardData();
    fetchAnnouncementsList();
    fetchGalleryList();
    fetchStudentsList();
    fetchRegistrations();
    fetchGroupsList();
    fetchScoreboardTeamsList();
    fetchScoreHistoryList();
    checkSupabaseStatus();
  }, [events]);

  useEffect(() => {
    const tabEvents = events.filter(e => e.programCategory === adminResultsTab);
    const unjudged = tabEvents.filter(e => e.status !== 'results_published');
    if (unjudged.length > 0) {
      setSelectedEventId(unjudged[0].id);
    } else if (tabEvents.length > 0) {
      setSelectedEventId(tabEvents[0].id);
    } else {
      setSelectedEventId('');
    }
  }, [events, adminResultsTab]);

  useEffect(() => {
    if (students.length > 0 && !certStudentId) {
      setCertStudentId(students[0].id);
    }
  }, [students, certStudentId]);

  useEffect(() => {
    if (events.length > 0 && !certEventId) {
      setCertEventId(events[0].id);
    }
  }, [events, certEventId]);

  const fetchGroupsList = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data || []);
      }
    } catch (err) {
      console.error('Failed to load groups list:', err);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      if (res.ok) {
        setNewGroupName('');
        await fetchGroupsList();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add group.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveGroup = async (groupName: string) => {
    setDeleteConfirmTarget({
      type: 'Group Deletion',
      name: groupName,
      action: async () => {
        try {
          const res = await fetch('/api/admin/groups/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: groupName })
          });
          if (res.ok) {
            await fetchGroupsList();
          } else {
            const data = await res.json();
            alert(data.error || 'Failed to delete group.');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        if (data.registrationTrends) {
          setTrends(data.registrationTrends);
        }
        // Initialize stats override inputs with current stats
        setStatTotalStudents(String(data.stats.totalStudents));
        setStatActiveEvents(String(data.stats.activeEventsCount));
        setStatPendingApprovals(String(data.stats.pendingApprovalsCount));
        setStatCertificatesIssued(String(data.stats.certificatesIssuedCount));
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  const fetchAnnouncementsList = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const fetchGalleryList = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        setGallery(data);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    }
  };

  const fetchStudentsList = async () => {
    try {
      const res = await fetch('/api/admin/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await fetch('/api/registrations');
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    }
  };

  const fetchScoreboardTeamsList = async () => {
    try {
      const res = await fetch('/api/scoreboard/teams');
      if (res.ok) {
        const data = await res.json();
        setScoreboardTeams(data);
      }
    } catch (err) {
      console.error('Failed to load scoreboard teams:', err);
    }
  };

  const fetchScoreHistoryList = async () => {
    try {
      const res = await fetch('/api/scoreboard/history');
      if (res.ok) {
        const data = await res.json();
        setScoreHistory(data);
      }
    } catch (err) {
      console.error('Failed to load score history:', err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/scoreboard/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm)
      });
      if (res.ok) {
        await fetchScoreboardTeamsList();
        setIsAddTeamOpen(false);
        setTeamForm({
          teamName: '',
          teamColor: '#ef4444',
          teamLogo: '',
          totalScore: 0,
          status: 'active'
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create team');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    try {
      const res = await fetch('/api/scoreboard/teams/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTeam.id,
          ...teamForm
        })
      });
      if (res.ok) {
        await fetchScoreboardTeamsList();
        setEditingTeam(null);
        setTeamForm({
          teamName: '',
          teamColor: '#ef4444',
          teamLogo: '',
          totalScore: 0,
          status: 'active'
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update team');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    const t = scoreboardTeams.find(item => item.id === teamId);
    setDeleteConfirmTarget({
      type: 'Team Deletion',
      name: t ? t.teamName : 'Selected Team',
      action: async () => {
        try {
          const res = await fetch('/api/scoreboard/teams/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: teamId })
          });
          if (res.ok) {
            await fetchScoreboardTeamsList();
            await fetchScoreHistoryList();
          } else {
            alert('Failed to delete team.');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleUpdateTeamScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreUpdateForm.teamId || scoreUpdateForm.scoreChange === 0) {
      alert('Please select a team and enter a non-zero score value.');
      return;
    }
    setIsSubmittingScore(true);
    setScoreUpdateStatus('idle');
    try {
      const res = await fetch('/api/scoreboard/score/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: scoreUpdateForm.teamId,
          scoreChange: scoreUpdateForm.scoreChange,
          reason: scoreUpdateForm.reason,
          updatedBy: 'Admin'
        })
      });
      if (res.ok) {
        setScoreUpdateStatus('success');
        setScoreUpdateForm({
          teamId: '',
          scoreChange: 0,
          reason: ''
        });
        await fetchScoreboardTeamsList();
        await fetchScoreHistoryList();
      } else {
        setScoreUpdateStatus('error');
      }
    } catch (err) {
      console.error(err);
      setScoreUpdateStatus('error');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // Stats Override Submission
  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStats(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalStudents: statTotalStudents,
          activeEventsCount: statActiveEvents,
          pendingApprovalsCount: statPendingApprovals,
          certificatesIssuedCount: statCertificatesIssued
        })
      });
      if (res.ok) {
        await fetchDashboardData();
        setIsEditStatsOpen(false);
      } else {
        alert('Failed to save statistics overrides');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to stats overrides API');
    } finally {
      setIsSavingStats(false);
    }
  };

  // Event Creation & Edition Submission
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });
      if (res.ok) {
        await onRefreshEvents();
        await fetchDashboardData();
        setIsAddEventOpen(false);
        // Reset form
        setEventForm({
          name: '',
          category: 'stage',
          type: 'individual',
          date: '2026-03-12',
          time: '10:00 AM',
          venue: '',
          maxParticipants: 30,
          currentParticipantsCount: 0,
          status: 'open',
          programCategory: 'Sub-Junior',
          rules: {
            eligibility: '',
            timeLimit: '',
            judgingCriteria: '',
            materials: ''
          }
        });
      } else {
        alert('Failed to create event. Please verify parameters.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditEventClick = (eventItem: Event) => {
    setEditingEvent(eventItem);
    setEventForm({
      name: eventItem.name,
      category: eventItem.category,
      type: eventItem.type,
      date: eventItem.date,
      time: eventItem.time,
      venue: eventItem.venue,
      maxParticipants: eventItem.maxParticipants,
      currentParticipantsCount: eventItem.currentParticipantsCount,
      status: eventItem.status as any,
      programCategory: eventItem.programCategory || 'Sub-Junior',
      rules: {
        eligibility: eventItem.rules?.eligibility || '',
        timeLimit: eventItem.rules?.timeLimit || '',
        judgingCriteria: eventItem.rules?.judgingCriteria || '',
        materials: eventItem.rules?.materials || ''
      }
    });
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const res = await fetch('/api/admin/events/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEvent.id,
          ...eventForm
        })
      });
      if (res.ok) {
        await onRefreshEvents();
        await fetchDashboardData();
        setEditingEvent(null);
      } else {
        alert('Failed to update event. Please verify parameters.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const ev = events.find(e => e.id === eventId);
    setDeleteConfirmTarget({
      type: 'Event Deletion',
      name: ev ? ev.name : 'Selected Event',
      action: async () => {
        try {
          const res = await fetch('/api/admin/events/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: eventId })
          });
          if (res.ok) {
            await onRefreshEvents();
            await fetchDashboardData();
          } else {
            alert('Failed to delete event.');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Student CRUD operations
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm)
      });
      if (res.ok) {
        await fetchStudentsList();
        await fetchDashboardData();
        setIsAddStudentOpen(false);
        setStudentForm({
          name: '',
          class: '1',
          house: 'Team A',
          category: 'Sub-Junior',
          photo: ''
        });
      } else {
        alert('Failed to add student. Please verify values.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditStudentClick = (s: Student) => {
    setEditingStudent(s);
    setStudentForm({
      name: s.name,
      class: s.class || '1',
      house: (s.house || 'Team A') as any,
      category: (s.category || 'Sub-Junior') as any,
      photo: s.photo || ''
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await fetch('/api/admin/students/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStudent.id,
          ...studentForm
        })
      });
      if (res.ok) {
        await fetchStudentsList();
        setEditingStudent(null);
      } else {
        alert('Failed to update student profile.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const s = students.find(stud => stud.id === studentId);
    setDeleteConfirmTarget({
      type: 'Student Deletion',
      name: s ? s.name : 'Selected Student',
      action: async () => {
        try {
          const res = await fetch('/api/admin/students/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: studentId })
          });
          if (res.ok) {
            await fetchStudentsList();
            await fetchRegistrations();
            await fetchDashboardData();
          } else {
            alert('Failed to delete student.');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Toggle active/inactive event state
  const handleToggleEventStatus = async (eventId: string) => {
    try {
      const res = await fetch('/api/admin/events/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId })
      });
      if (res.ok) {
        await onRefreshEvents();
        await fetchDashboardData();
      } else {
        alert('Failed to toggle event state.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Registration approvals
  const handleApproveRegistration = async (regId: string) => {
    try {
      const res = await fetch('/api/admin/registrations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regId })
      });
      if (res.ok) {
        await fetchRegistrations();
        await fetchDashboardData();
      } else {
        alert('Failed to approve registration.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRegistration = async (regId: string) => {
    const r = registrations.find(item => item.id === regId);
    const label = r ? `${r.studentName} for ${r.eventTitle}` : 'Selected Registration';
    setDeleteConfirmTarget({
      type: 'Registration Rejection',
      name: label,
      action: async () => {
        try {
          const res = await fetch('/api/admin/registrations/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: regId })
          });
          if (res.ok) {
            await fetchRegistrations();
            await fetchDashboardData();
          } else {
            alert('Failed to discard registration.');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Direct manual certificate issuance
  const handleIssueCertificateDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certStudentId || !certEventId || !certAwardText) return;
    setIsIssuingCert(true);
    setCertStatus('idle');

    try {
      const res = await fetch('/api/admin/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: certStudentId,
          eventId: certEventId,
          awardText: certAwardText,
          points: certPoints
        })
      });
      if (res.ok) {
        setCertStatus('success');
        setCertPoints('0');
        await fetchDashboardData();
      } else {
        setCertStatus('error');
      }
    } catch (err) {
      console.error(err);
      setCertStatus('error');
    } finally {
      setIsIssuingCert(false);
    }
  };

  // Publish Competition Results
  const handlePublishResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !firstPlaceName || !secondPlaceName || !thirdPlaceName) return;

    setIsPublishing(true);
    setPublishStatus('idle');

    try {
      if (editingResultId) {
        await onEditResult({
          id: editingResultId,
          firstPlace: { name: firstPlaceName, house: firstPlaceHouse },
          secondPlace: { name: secondPlaceName, house: secondPlaceHouse },
          thirdPlace: { name: thirdPlaceName, house: thirdPlaceHouse },
          judgeRemarks
        });
        setEditingResultId(null);
      } else {
        await onPublishResult({
          eventId: selectedEventId,
          firstPlace: { name: firstPlaceName, house: firstPlaceHouse },
          secondPlace: { name: secondPlaceName, house: secondPlaceHouse },
          thirdPlace: { name: thirdPlaceName, house: thirdPlaceHouse },
          judgeRemarks
        });
      }

      setPublishStatus('success');
      // Reset fields
      setFirstPlaceName('');
      setSecondPlaceName('');
      setThirdPlaceName('');
      setJudgeRemarks('');
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      setPublishStatus('error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Broadcast Bulletin
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    setIsPostingAnn(true);
    setAnnStatus('idle');

    try {
      await onPostAnnouncement({
        title: annTitle,
        content: annContent,
        targetAudience: annAudience
      });

      setAnnStatus('success');
      setAnnTitle('');
      setAnnContent('');
      await fetchAnnouncementsList();
      await onRefreshAnnouncements();
    } catch (err) {
      console.error(err);
      setAnnStatus('error');
    } finally {
      setIsPostingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    const ann = announcements.find(a => a.id === annId);
    setDeleteConfirmTarget({
      type: 'Announcement Deletion',
      name: ann ? ann.title : 'Selected Announcement',
      action: async () => {
        try {
          const res = await fetch('/api/admin/announcements/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: annId })
          });
          if (res.ok) {
            await fetchAnnouncementsList();
            await onRefreshAnnouncements();
          } else {
            alert('Failed to delete bulletin');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Gallery Management
  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.imageUrl || !galleryForm.caption) {
      alert('Image URL and Caption are required');
      return;
    }
    setIsUploadingPhoto(true);
    setGalleryStatus('idle');

    try {
      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: galleryForm.imageUrl,
          category: galleryForm.category,
          caption: galleryForm.caption,
          photographer: galleryForm.photographer || 'Admin'
        })
      });
      if (res.ok) {
        setGalleryStatus('success');
        setGalleryForm({
          imageUrl: '',
          category: 'Competitions',
          caption: '',
          photographer: ''
        });
        await fetchGalleryList();
        await onRefreshGallery();
      } else {
        setGalleryStatus('error');
      }
    } catch (err) {
      console.error(err);
      setGalleryStatus('error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteGallery = async (photoId: string) => {
    const item = gallery.find(g => g.id === photoId);
    setDeleteConfirmTarget({
      type: 'Gallery Photo Deletion',
      name: item ? item.caption : 'Selected Photo',
      action: async () => {
        try {
          const res = await fetch('/api/admin/gallery/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: photoId })
          });
          if (res.ok) {
            await fetchGalleryList();
            await onRefreshGallery();
          } else {
            alert('Failed to delete photo');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDbResetClick = async () => {
    setDeleteConfirmTarget({
      type: 'Database Reset',
      name: 'ALL student registrations & custom data will be wiped',
      action: async () => {
        await onResetDb();
        await fetchDashboardData();
        await fetchAnnouncementsList();
        await fetchGalleryList();
        alert('Database successfully reset to pristine seed state!');
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen bg-[#F8FAFC]">
      
      {/* Admin header */}
      <div className="bg-white text-slate-800 p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block flex items-center space-x-1">
            <Shield className="h-3.5 w-3.5 mr-1" />
            <span>🔒 Festival Administration Portal</span>
          </span>
          <h1 className="font-display text-2xl font-extrabold mt-1 uppercase tracking-tight text-slate-900">Control Center</h1>
        </div>
        <div className="flex bg-indigo-50/50 p-1 text-xs border border-indigo-100 rounded-xl">
          <span className="px-3 py-1 bg-indigo-600 text-white font-semibold uppercase rounded-lg">Admin Active</span>
        </div>
      </div>

      {/* Main Grid: Left Navigation | Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar menu options */}
        <div className="lg:col-span-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] flex flex-col space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 pb-3 block border-b border-slate-100 mb-2">
            Admin Menu
          </span>
          <button
            onClick={() => setActiveMenu('overview')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeMenu === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="h-4.5 w-4.5 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveMenu('events')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center justify-between transition-all cursor-pointer ${
              activeMenu === 'events' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <BookOpen className="h-4.5 w-4.5 shrink-0" />
              <span>Manage Events</span>
            </div>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('students')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center justify-between transition-all cursor-pointer ${
              activeMenu === 'students' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Users className="h-4.5 w-4.5 shrink-0" />
              <span>Manage Students</span>
            </div>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('approvals')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center justify-between transition-all cursor-pointer ${
              activeMenu === 'approvals' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <span>Pending Approvals</span>
            </div>
            {stats.pendingApprovalsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                {stats.pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMenu('results')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeMenu === 'results' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award className="h-4.5 w-4.5 shrink-0" />
            <span>Publish Event Results</span>
          </button>

          <button
            onClick={() => setActiveMenu('certificates')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeMenu === 'certificates' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award className="h-4.5 w-4.5 shrink-0 text-amber-500 animate-pulse" />
            <span>Issue Certificates</span>
          </button>

          <button
            onClick={() => setActiveMenu('announcements')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeMenu === 'announcements' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="h-4.5 w-4.5 shrink-0" />
            <span>Manage Bulletins</span>
          </button>

          <button
            onClick={() => setActiveMenu('gallery')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeMenu === 'gallery' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="h-4.5 w-4.5 shrink-0" />
            <span>Manage Gallery</span>
          </button>

          <button
            onClick={() => setActiveMenu('groups')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center justify-between transition-all cursor-pointer ${
              activeMenu === 'groups' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <FolderPlus className="h-4.5 w-4.5 shrink-0" />
              <span>Age / Comp Groups</span>
            </div>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
              {groups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('scoreboard')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center justify-between transition-all cursor-pointer ${
              activeMenu === 'scoreboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Trophy className="h-4.5 w-4.5 shrink-0 text-amber-500" />
              <span>Scoreboard Admin</span>
            </div>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
              {scoreboardTeams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMenu('settings')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeMenu === 'settings' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="h-4.5 w-4.5 shrink-0" />
            <span>Advanced Settings</span>
          </button>
        </div>

        {/* Right Active Panel */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* MENU 1: OVERVIEW */}
          {activeMenu === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* Dynamic stats panel with Edit Button */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Statistics Monitor</h3>
                  <button
                    onClick={() => {
                      setStatTotalStudents(String(stats.totalStudents));
                      setStatActiveEvents(String(stats.activeEventsCount));
                      setStatPendingApprovals(String(stats.pendingApprovalsCount));
                      setStatCertificatesIssued(String(stats.certificatesIssuedCount));
                      setIsEditStatsOpen(true);
                    }}
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition flex items-center space-x-1 uppercase cursor-pointer"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit Statistics Overrides</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                  <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-2xl text-center">
                    <span className="block text-3xl font-extrabold text-slate-900">{stats.totalStudents.toLocaleString()}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2">Total Students</span>
                  </div>
                  <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-2xl text-center">
                    <span className="block text-3xl font-extrabold text-slate-900">{stats.activeEventsCount}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2">Active Events</span>
                  </div>
                  <div className="bg-indigo-50/30 p-5 border border-indigo-100/30 rounded-2xl text-center">
                    <span className="block text-3xl font-extrabold text-indigo-600">{stats.pendingApprovalsCount}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2">Pending Approvals</span>
                  </div>
                  <div className="bg-emerald-50/30 p-5 border border-emerald-100/30 rounded-2xl text-center">
                    <span className="block text-3xl font-extrabold text-emerald-600">{stats.certificatesIssuedCount}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2">Certificates Issued</span>
                  </div>
                </div>
              </div>

              {/* Registration trends and telemetry indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Trends Bar Chart visual */}
                <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-4">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                    Registration Trends (last 14 days)
                  </h3>
                  
                  {/* Dynamic beautiful Bar Chart representation */}
                  <div className="h-40 flex items-end justify-between pt-4 gap-2 border-b border-slate-100">
                    {trends.map((item, idx) => {
                      const maxCount = Math.max(...trends.map(t => t.count), 1);
                      const heightPercent = Math.max(10, Math.min(100, Math.round((item.count / maxCount) * 100)));
                      return (
                        <div 
                          key={idx}
                          className={`w-1/10 rounded-t-md hover:bg-indigo-600 transition duration-200 cursor-pointer ${
                            idx === trends.length - 1 ? 'bg-indigo-600' : 'bg-indigo-100'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                          title={`${item.day}: ${item.count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] font-semibold text-slate-400 uppercase">
                    <span>Day -14</span>
                    <span>Day -7</span>
                    <span>Today ({stats.totalStudents})</span>
                  </div>
                </div>

                {/* Supabase Real-Time Diagnostic UI Indicator */}
                <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <span>Supabase Health Diagnostic</span>
                          {supabaseHealth?.connected ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Checking...
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[220px] sm:max-w-none">
                          {supabaseHealth?.url || 'https://phqyznpnyqxcgsrxbymk.supabase.co'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={checkSupabaseStatus}
                      disabled={isCheckingSupabase}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                      title="Run Diagnostic Health Test"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isCheckingSupabase ? 'animate-spin' : ''}`} />
                      <span>{isCheckingSupabase ? 'Testing...' : 'Test Health'}</span>
                    </button>
                  </div>

                  {/* Primary Status Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    supabaseHealth?.connected 
                      ? 'bg-emerald-50/50 border-emerald-100/80 text-emerald-950' 
                      : 'bg-amber-50/50 border-amber-100/80 text-amber-950'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${supabaseHealth?.connected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {supabaseHealth?.connected ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide">
                          {supabaseHealth?.connected ? 'Supabase Backend Connected' : 'Supabase Status: Checking connection'}
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5 font-medium">
                          {supabaseHealth?.connected 
                            ? `Response latency: ${supabaseHealth.responseTimeMs}ms • All queries operational` 
                            : supabaseHealth?.error || 'Verifying connection to Supabase cloud instance...'}
                        </div>
                      </div>
                    </div>
                    {supabaseHealth?.timestamp && (
                      <span className="text-[9px] font-mono opacity-60 hidden sm:inline">
                        {new Date(supabaseHealth.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Response Latency</span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          {supabaseHealth ? `${supabaseHealth.responseTimeMs} ms` : '--'}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {supabaseHealth && supabaseHealth.responseTimeMs < 150 ? 'Fast' : 'Normal'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Verified Tables</span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-sm text-slate-900">
                          {supabaseHealth?.tablesChecked ? `${supabaseHealth.tablesChecked.length} / 11` : '11 / 11'}
                        </span>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          100% Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Table Counts Telemetry */}
                  {supabaseHealth?.tableCounts && (
                    <div className="pt-2 space-y-2 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Database Record Counts</span>
                        <span className="text-[9px] font-mono text-emerald-600 font-bold">PostgreSQL Direct</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {Object.entries(supabaseHealth.tableCounts).slice(0, 8).map(([tbl, cnt]) => (
                          <div key={tbl} className="p-2 bg-slate-50/80 border border-slate-100 rounded-xl text-center">
                            <span className="block text-[9px] font-mono uppercase text-slate-400 truncate">{tbl}</span>
                            <span className="block text-xs font-extrabold text-slate-800">{cnt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Pending tasks */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-4">
                <h3 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-tight">Pending Tasks</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold uppercase text-slate-700">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                    <span>Approve pending registrations ({stats.pendingApprovalsCount})</span>
                    <button 
                      onClick={() => {
                        // Quick action: override pending approvals to 0
                        setStatPendingApprovals('0');
                        setStats(prev => ({ ...prev, pendingApprovalsCount: 0 }));
                        fetch('/api/admin/stats', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ pendingApprovalsCount: 0 })
                        }).then(fetchDashboardData);
                      }}
                      className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition cursor-pointer"
                    >
                      Instant Approve
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                    <span>Publish results for Elocution finals</span>
                    <button onClick={() => setActiveMenu('results')} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition cursor-pointer">Launch</button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                    <span>Manage live events list ({events.length})</span>
                    <button onClick={() => setActiveMenu('events')} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition cursor-pointer">Review</button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                    <span>Send inauguration announcement</span>
                    <button onClick={() => setActiveMenu('announcements')} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition cursor-pointer">Write</button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* MENU 2: MANAGE EVENTS (NEW) */}
          {activeMenu === 'events' && (
            <div className="bg-white p-6 sm:p-8 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 uppercase">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">Manage Events</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Add, update, or remove stage and off-stage arts competitions</p>
                </div>
                <button
                  onClick={() => {
                    setEventForm({
                      name: '',
                      category: 'stage',
                      type: 'individual',
                      date: '2026-03-12',
                      time: '10:00 AM',
                      venue: '',
                      maxParticipants: 30,
                      currentParticipantsCount: 0,
                      status: 'open',
                      rules: {
                        eligibility: 'Open to High School & Higher Secondary students.',
                        timeLimit: 'Standard 5 minutes duration apply.',
                        judgingCriteria: 'Originality, presentation, and technical accuracy.',
                        materials: 'Participants must arrange their own requirements.'
                      }
                    });
                    setIsAddEventOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add New Event</span>
                </button>
              </div>

              {/* Events Table / List */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Event Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Venue & Time</th>
                      <th className="py-3 px-4">Participants</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold uppercase">
                    {events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{ev.name}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col space-y-1 items-start">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              ev.category === 'stage' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                            }`}>
                              {ev.category === 'stage' ? 'STAGE' : 'OFF-STAGE'}
                            </span>
                            {ev.programCategory && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-700">
                                {ev.programCategory}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{ev.type}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col text-[10px] lowercase leading-relaxed text-slate-500 font-medium">
                            <span className="flex items-center"><MapPin className="h-3 w-3 mr-0.5" /> {ev.venue}</span>
                            <span className="flex items-center"><Clock className="h-3 w-3 mr-0.5" /> {ev.date} @ {ev.time}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {ev.currentParticipantsCount} / {ev.maxParticipants}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleEventStatus(ev.id)}
                            disabled={ev.status === 'results_published'}
                            className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase transition-all flex items-center space-x-1 mx-auto ${
                              ev.status === 'results_published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-not-allowed'
                                : ev.status === 'open'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer'
                                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 cursor-pointer'
                            }`}
                            title={ev.status === 'results_published' ? 'Results Published - Closed' : 'Click to Toggle Status'}
                          >
                            <RefreshCw className={`h-2.5 w-2.5 mr-0.5 ${ev.status === 'open' ? 'text-indigo-500' : 'text-slate-500'}`} />
                            <span>{ev.status === 'results_published' ? 'RESULTS' : ev.status === 'open' ? 'OPEN' : 'COMPLETED'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end items-center space-x-1">
                            <button
                              onClick={() => handleEditEventClick(ev)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Edit Event"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* MENU: MANAGE STUDENTS (NEW CRUD) */}
          {activeMenu === 'students' && (
            <div className="bg-white p-6 sm:p-8 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 uppercase">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">Manage Students</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Complete Student CRUD Operations, house mapping, and contact data</p>
                </div>
                <button
                  onClick={() => {
                    setStudentForm({
                      name: '',
                      class: 'Grade 10',
                      house: 'Red',
                      contactNumber: '',
                      emergencyContact: '',
                      photo: ''
                    });
                    setIsAddStudentOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add New Student</span>
                </button>
              </div>

              {/* Search filter bar */}
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                <input
                  type="text"
                  placeholder="Search students by Name, Student ID, House, or Class..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold uppercase placeholder-slate-400 border-none outline-none text-slate-700"
                />
                {studentSearch && (
                  <button onClick={() => setStudentSearch('')} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase px-2 py-1">
                    Clear
                  </button>
                )}
              </div>

              {/* Students list */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">House Group</th>
                      <th className="py-3 px-4">Contact Details</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold uppercase">
                    {students
                      .filter(s => {
                        if (!studentSearch) return true;
                        const q = studentSearch.toLowerCase();
                        return (
                          s.name.toLowerCase().includes(q) ||
                          s.studentId.toLowerCase().includes(q) ||
                          s.class.toLowerCase().includes(q) ||
                          s.house.toLowerCase().includes(q)
                        );
                      })
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 font-bold text-indigo-600 font-mono">{s.studentId}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                          <td className="py-3.5 px-4 text-slate-500">{s.class}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              s.house === 'Red' ? 'bg-red-100 text-red-700' :
                              s.house === 'Blue' ? 'bg-blue-100 text-blue-700' :
                              s.house === 'Green' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {s.house.toUpperCase()} HOUSE
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col text-[10px] lowercase leading-relaxed text-slate-500 font-medium">
                              <span>📞 {s.contactNumber || 'N/A'}</span>
                              <span>🚨 Emergency: {s.emergencyContact || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end items-center space-x-1">
                              <button
                                onClick={() => handleEditStudentClick(s)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title="Edit Student"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete Student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MENU: PENDING REGISTRATION APPROVALS */}
          {activeMenu === 'approvals' && (
            <div className="bg-white p-6 sm:p-8 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4 uppercase">
                <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">Pending Registration Approvals</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">Review, authorize, or decline incoming student competition registrations</p>
              </div>

              {/* List of pending approvals */}
              {registrations.filter(r => r.paymentStatus === 'pending').length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <span className="block text-xs font-bold text-slate-500 uppercase">All clear! No pending registration approvals.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Event Requested</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Registration Code</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold uppercase">
                      {registrations
                        .filter(r => r.paymentStatus === 'pending')
                        .map((r) => {
                          const student = students.find(s => s.id === r.studentId);
                          const event = events.find(e => e.id === r.eventId);
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{student?.name || 'Unknown Student'}</span>
                                  <span className="text-[9px] font-mono text-slate-400">{student?.studentId}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{event?.name || 'Unknown Event'}</span>
                                  <span className="text-[9px] font-mono text-slate-400">{event?.category === 'stage' ? 'STAGE COMPETITION' : 'OFF-STAGE COMPETITION'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-700 text-[9px] font-extrabold">
                                  PENDING APPROVAL
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">{r.id}</td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex justify-end items-center space-x-2">
                                  <button
                                    onClick={() => handleApproveRegistration(r.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer transition shadow-sm"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectRegistration(r.id)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-lg text-[10px] flex items-center space-x-1 cursor-pointer transition"
                                  >
                                    <X className="h-3 w-3" />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MENU: DIRECT MANUAL CERTIFICATE ISSUANCE */}
          {activeMenu === 'certificates' && (
            <div className="bg-white p-6 sm:p-8 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4 uppercase">
                <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">Direct Manual Certificate Issuance</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">Generate dynamic certified accolades for exceptional participation or distinct podium finishes</p>
              </div>

              {/* Category Selection Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                {(['Senior', 'Junior', 'Sub-Junior', 'General', 'Group'] as const).map((cat) => {
                  const catEventsCount = events.filter(e => e.programCategory === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCertCategoryTab(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                        certCategoryTab === cat
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                        certCategoryTab === cat ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {catEventsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {certStatus === 'success' && (
                <div className="flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-700 p-4 border border-emerald-100 rounded-xl font-semibold uppercase">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Certificate successfully compiled and issued! Student notification dispatched!</span>
                </div>
              )}
              {certStatus === 'error' && (
                <div className="flex items-center space-x-2 text-xs bg-rose-50 text-rose-700 p-4 border border-rose-100 rounded-xl font-semibold uppercase">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span>Failed to issue certificate. Please check data parameters.</span>
                </div>
              )}

              <form onSubmit={handleIssueCertificateDirectly} className="space-y-6 uppercase">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Select Student */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Select Recipient Student
                    </label>
                    <select
                      value={certStudentId}
                      onChange={(e) => setCertStudentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name.toUpperCase()} (ID: {s.studentId} - {s.house.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Event */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Select Associated Event ({certCategoryTab})
                    </label>
                    <select
                      value={certEventId}
                      onChange={(e) => setCertEventId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {events.filter(e => e.programCategory === certCategoryTab).map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name.toUpperCase()}
                        </option>
                      ))}
                      {events.filter(e => e.programCategory === certCategoryTab).length === 0 && (
                        <option value="">No programs available in this category</option>
                      )}
                    </select>
                  </div>

                  {/* Award Text */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Recognition / Award Title
                    </label>
                    <select
                      value={certAwardText}
                      onChange={(e) => setCertAwardText(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="1st Place">🏆 1st Place Podium</option>
                      <option value="2nd Place">🥈 2nd Place Podium</option>
                      <option value="3rd Place">🥉 3rd Place Podium</option>
                      <option value="Participation">🤝 Active Participation Accolade</option>
                    </select>
                  </div>

                  {/* Points Credited */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Award Point Merits to House Scoreboard
                    </label>
                    <select
                      value={certPoints}
                      onChange={(e) => setCertPoints(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="0">0 Points (No credit)</option>
                      <option value="50">50 Points (Bronze)</option>
                      <option value="75">75 Points (Silver)</option>
                      <option value="100">100 Points (Gold)</option>
                    </select>
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={isIssuingCert}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>{isIssuingCert ? 'Compiling PDF certificate...' : 'Generate and Dispatch Digital Certificate ✓'}</span>
                </button>
              </form>
            </div>
          )}

          {/* MENU 3: PUBLISH RESULTS */}
          {activeMenu === 'results' && (() => {
            const categoryResults = results.filter(r => {
              const eventObj = events.find(e => e.id === r.eventId);
              return eventObj && eventObj.programCategory === adminResultsTab;
            });

            const startEditResult = (resItem: any) => {
              setEditingResultId(resItem.id);
              setSelectedEventId(resItem.eventId);
              setFirstPlaceName(resItem.firstPlace?.name || '');
              setFirstPlaceHouse(resItem.firstPlace?.house || 'Red');
              setSecondPlaceName(resItem.secondPlace?.name || '');
              setSecondPlaceHouse(resItem.secondPlace?.house || 'Red');
              setThirdPlaceName(resItem.thirdPlace?.name || '');
              setThirdPlaceHouse(resItem.thirdPlace?.house || 'Red');
              setJudgeRemarks(resItem.judgeRemarks || '');
            };

            const confirmDeleteResult = async (resultId: string) => {
              if (window.confirm("Are you sure you want to delete this event's published standings? Team scores will be automatically recalculated.")) {
                try {
                  await onDeleteResult(resultId);
                  await fetchDashboardData();
                } catch (err) {
                  console.error(err);
                }
              }
            };

            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header card */}
                <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-4">
                  <div className="border-b border-slate-100 pb-4 uppercase">
                    <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">Publish Competition Standings</h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">Entering results automatically awards house points and dispatches certificates</p>
                  </div>

                  {/* Status banner */}
                  {publishStatus === 'success' && (
                    <div className="flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-700 p-4 border border-emerald-100 rounded-xl font-semibold uppercase">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      <span>Results successfully saved! Points credited and certificates updated!</span>
                    </div>
                  )}
                  {publishStatus === 'error' && (
                    <div className="flex items-center space-x-2 text-xs bg-rose-50 text-rose-700 p-4 border border-rose-100 rounded-xl font-semibold uppercase">
                      <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                      <span>Publish failed. Please check inputs and event parameters.</span>
                    </div>
                  )}

                  {/* Category Selection Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                    {(['Senior', 'Junior', 'Sub-Junior', 'General', 'Group'] as const).map((cat) => {
                      const catEventsCount = events.filter(e => e.programCategory === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setAdminResultsTab(cat);
                            setEditingResultId(null);
                            setFirstPlaceName('');
                            setSecondPlaceName('');
                            setThirdPlaceName('');
                            setJudgeRemarks('');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
                            adminResultsTab === cat
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                            adminResultsTab === cat ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {catEventsCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Form & Registrations */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Publish / Edit Form */}
                    <div className="bg-white p-6 sm:p-8 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)]">
                      <div className="border-b border-slate-100 pb-4 mb-4 uppercase">
                        <h3 className="font-display font-extrabold text-sm text-slate-950 flex items-center space-x-2">
                          <Award className="h-5 w-5 text-indigo-600" />
                          <span>{editingResultId ? `Edit Standings` : 'Publish Standings'}</span>
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Category: {adminResultsTab}</p>
                      </div>

                      <form onSubmit={handlePublishResults} className="space-y-6 uppercase">
                        
                        {/* Event Dropdown */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Select Event to Publish
                          </label>
                          <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            disabled={!!editingResultId} // Cannot change event during edit
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                          >
                            {events.filter(e => e.programCategory === adminResultsTab && e.status !== 'results_published').map(e => (
                              <option key={e.id} value={e.id}>
                                {e.name.toUpperCase()} ({e.category === 'stage' ? 'STAGE' : 'OFF-STAGE'})
                              </option>
                            ))}
                            {events.filter(e => e.programCategory === adminResultsTab && e.status === 'results_published').map(e => (
                              <option key={e.id} value={e.id}>
                                [ALREADY JUDGED] {e.name.toUpperCase()}
                              </option>
                            ))}
                            {events.filter(e => e.programCategory === adminResultsTab).length === 0 && (
                              <option value="">No events configured in this category</option>
                            )}
                          </select>
                        </div>

                        {/* 1st, 2nd, 3rd inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* First Place */}
                          <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl space-y-3">
                            <span className="text-[10px] font-bold text-amber-800 uppercase block">
                              🏆 1st Place (100 pts)
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="Student or Team Name"
                              value={firstPlaceName}
                              onChange={(e) => setFirstPlaceName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800"
                            />
                            <select
                              value={firstPlaceHouse}
                              onChange={(e) => setFirstPlaceHouse(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 cursor-pointer"
                            >
                              <option value="Red">Red House</option>
                              <option value="Blue">Blue House</option>
                              <option value="Green">Green House</option>
                              <option value="Yellow">Yellow House</option>
                            </select>
                          </div>

                          {/* Second Place */}
                          <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-3">
                            <span className="text-[10px] font-bold text-slate-600 uppercase block">
                              🥈 2nd Place (75 pts)
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="Student or Team Name"
                              value={secondPlaceName}
                              onChange={(e) => setSecondPlaceName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800"
                            />
                            <select
                              value={secondPlaceHouse}
                              onChange={(e) => setSecondPlaceHouse(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 cursor-pointer"
                            >
                              <option value="Red">Red House</option>
                              <option value="Blue">Blue House</option>
                              <option value="Green">Green House</option>
                              <option value="Yellow">Yellow House</option>
                            </select>
                          </div>

                          {/* Third Place */}
                          <div className="p-4 bg-orange-50/20 border border-orange-100/50 rounded-2xl space-y-3">
                            <span className="text-[10px] font-bold text-orange-800 uppercase block">
                              🥉 3rd Place (50 pts)
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="Student or Team Name"
                              value={thirdPlaceName}
                              onChange={(e) => setThirdPlaceName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800"
                            />
                            <select
                              value={thirdPlaceHouse}
                              onChange={(e) => setThirdPlaceHouse(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 cursor-pointer"
                            >
                              <option value="Red">Red House</option>
                              <option value="Blue">Blue House</option>
                              <option value="Green">Green House</option>
                              <option value="Yellow">Yellow House</option>
                            </select>
                          </div>

                        </div>

                        {/* Remarks */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Judges Summary Remarks
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Enter outstanding performance notes..."
                            value={judgeRemarks}
                            onChange={(e) => setJudgeRemarks(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          />
                        </div>

                        <div className="flex gap-4">
                          {editingResultId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingResultId(null);
                                setFirstPlaceName('');
                                setSecondPlaceName('');
                                setThirdPlaceName('');
                                setJudgeRemarks('');
                              }}
                              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs uppercase tracking-wider transition-all"
                            >
                              Cancel Edit
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isPublishing}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 cursor-pointer"
                          >
                            {isPublishing 
                              ? 'Processing...' 
                              : editingResultId 
                                ? 'Update Standing Results ✓' 
                                : 'Publish Results & Distribute Points →'
                            }
                          </button>
                        </div>

                      </form>
                    </div>

                    {/* Registered Participants for current selected event */}
                    {selectedEventId && (() => {
                      const selectedEventObj = events.find(e => e.id === selectedEventId);
                      const eventParticipants = registrations.filter(r => r.eventId === selectedEventId && r.status === 'registered');
                      return (
                        <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-4">
                          <div className="pb-3 border-b border-slate-100">
                            <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                              Registered Competitors ({eventParticipants.length})
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                              For Event: {selectedEventObj?.name || 'Unknown'}
                            </p>
                          </div>

                          {eventParticipants.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 font-semibold uppercase text-center">
                              No registered competitors found for this event
                            </p>
                          ) : (
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                              {eventParticipants.map(ep => (
                                <div key={ep.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                                  <div className="space-y-0.5">
                                    <div className="uppercase text-slate-800">{ep.studentName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">REG ID: {ep.id} • CLASS: {ep.studentClass}</div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                    ep.studentHouse === 'Red' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    ep.studentHouse === 'Blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    ep.studentHouse === 'Green' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {ep.studentHouse}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>

                  {/* Right Column: Already Published Results */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Already Published Standings list */}
                    <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-4">
                      <div className="pb-3 border-b border-slate-100">
                        <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                          Published Results ({categoryResults.length})
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Category: {adminResultsTab}</p>
                      </div>

                      {categoryResults.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No results published for this category yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                          {categoryResults.map((resItem) => {
                            const eventObj = events.find(e => e.id === resItem.eventId);
                            return (
                              <div key={resItem.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="text-xs font-bold uppercase text-slate-900">{eventObj?.name || 'Unknown Event'}</h5>
                                    <span className="text-[9px] text-slate-400 font-mono">RESULT ID: {resItem.id}</span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => startEditResult(resItem)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition border border-transparent hover:border-slate-100"
                                      title="Edit Standings"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => confirmDeleteResult(resItem.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition border border-transparent hover:border-slate-100"
                                      title="Delete Standings"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-[11px] font-semibold">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 uppercase text-[9px] font-bold">1st Place:</span>
                                    <span className="text-slate-800 uppercase">{resItem.firstPlace?.name} ({resItem.firstPlace?.house})</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 uppercase text-[9px] font-bold">2nd Place:</span>
                                    <span className="text-slate-800 uppercase">{resItem.secondPlace?.name} ({resItem.secondPlace?.house})</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 uppercase text-[9px] font-bold">3rd Place:</span>
                                    <span className="text-slate-800 uppercase">{resItem.thirdPlace?.name} ({resItem.thirdPlace?.house})</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            );
          })()}

          {/* MENU 4: ANNOUNCEMENTS MODERATION */}
          {activeMenu === 'announcements' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200">
              
              {/* Form to Post Bulletin */}
              <div className="md:col-span-5 bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                <div className="pb-3 border-b border-slate-100 uppercase">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight">Post New Bulletin</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Publish to homepage scrolling news ticker</p>
                </div>

                {annStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-[11px] bg-emerald-50 text-emerald-700 p-3 border border-emerald-100 rounded-xl font-semibold uppercase">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Bulletin successfully broadcasted!</span>
                  </div>
                )}

                <form onSubmit={handlePostAnnouncement} className="space-y-4 uppercase">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase">
                      Bulletin Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Venue changes for Debate"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase">
                      Announcement Content
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter scroll-friendly description details..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase">
                      Target Audience Scope
                    </label>
                    <select
                      value={annAudience}
                      onChange={(e) => setAnnAudience(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500 w-full cursor-pointer"
                    >
                      <option value="all">Everyone (All visitors)</option>
                      <option value="students">Registered Students</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isPostingAnn}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wide transition shadow cursor-pointer"
                  >
                    {isPostingAnn ? 'Posting...' : 'Broadcast Bulletin'}
                  </button>
                </form>
              </div>

              {/* List and delete Announcements */}
              <div className="md:col-span-7 bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                <div className="pb-3 border-b border-slate-100 uppercase">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight">Active Bulletins ({announcements.length})</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Delete old or incorrect bulletins instantly</p>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {announcements.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">No active announcements.</div>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-start space-x-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-tight">{ann.title}</h4>
                          <p className="text-[11px] text-slate-600 leading-normal normal-case">{ann.content}</p>
                          <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 uppercase">
                            <span>Audience: {ann.targetAudience}</span>
                            <span>•</span>
                            <span>{new Date(ann.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                          title="Delete Bulletin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* MENU 5: GALLERY MODERATION (NEW) */}
          {activeMenu === 'gallery' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200">
              
              {/* Add to Gallery photo form */}
              <div className="md:col-span-5 bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                <div className="pb-3 border-b border-slate-100 uppercase">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight">Submit New Photo</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Post an image to the festival gallery stream</p>
                </div>

                {galleryStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-[11px] bg-emerald-50 text-emerald-700 p-3 border border-emerald-100 rounded-xl font-semibold uppercase">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Photo successfully posted to live stream!</span>
                  </div>
                )}

                <form onSubmit={handleUploadPhoto} className="space-y-4 uppercase">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase">
                      Image URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/... or any photo link"
                      value={galleryForm.imageUrl}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase">
                      Category
                    </label>
                    <select
                      value={galleryForm.category}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500 w-full cursor-pointer"
                    >
                      <option value="Opening Ceremony">Opening Ceremony</option>
                      <option value="Competitions">Competitions</option>
                      <option value="Audience">Audience Cheer</option>
                      <option value="Prize Distribution">Prize Distribution</option>
                      <option value="Closing Ceremony">Closing Ceremony</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase">
                      Photographer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A. Karim"
                      value={galleryForm.photographer}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, photographer: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase">
                      Caption Detail
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Describe what is taking place in the photo"
                      value={galleryForm.caption}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, caption: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingPhoto}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wide transition shadow cursor-pointer"
                  >
                    {isUploadingPhoto ? 'Uploading...' : 'Submit Photo Stream'}
                  </button>
                </form>
              </div>

              {/* Gallery Moderate stream */}
              <div className="md:col-span-7 bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                <div className="pb-3 border-b border-slate-100 uppercase">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight">Active Photo Stream ({gallery.length})</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Wipe or filter unsuitable submissions</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1">
                  {gallery.map((item) => (
                    <div key={item.id} className="group relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                      <img 
                        src={item.imageUrl} 
                        alt={item.caption}
                        referrerPolicy="no-referrer"
                        className="h-24 w-full object-cover"
                      />
                      <div className="p-2 space-y-1 text-[9px]">
                        <p className="font-bold text-slate-900 uppercase truncate" title={item.caption}>{item.caption}</p>
                        <p className="text-slate-400 uppercase font-medium">{item.category}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteGallery(item.id)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-md shadow opacity-90 hover:opacity-100 transition cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* MENU: GROUPS */}
          {activeMenu === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in fade-in duration-200 uppercase">
              
              {/* Form to Add Group */}
              <div className="md:col-span-5 bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight">Add New Group</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Create a new student category</p>
                </div>

                <form onSubmit={handleAddGroup} className="space-y-4 text-xs font-semibold text-slate-700">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase">
                      Group Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sub-Junior, Junior, etc."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wide transition shadow cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Category Group</span>
                  </button>
                </form>
              </div>

              {/* Active Groups List */}
              <div className="md:col-span-7 bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight">Active Groups ({groups.length})</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Existing competition divisions</p>
                </div>

                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
                  {groups.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                      No groups found. Create one above.
                    </div>
                  ) : (
                    groups.map((group) => (
                      <div key={group} className="py-3 flex justify-between items-center group">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                          <span className="text-xs font-bold text-slate-700">{group}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveGroup(group)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition cursor-pointer"
                          title="Delete Group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* MENU 6: SETTINGS & DB DIAGNOSTICS */}
          {activeMenu === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] uppercase">
                <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">Advanced Controls & Infrastructure Diagnostics</h2>
                <p className="text-xs text-slate-400 font-medium mt-1 normal-case">Configure database connections, inspect real-time Supabase health, and trigger diagnostic state resets.</p>
              </div>

              {/* Real-time Supabase Connectivity Indicator Card */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <span>Supabase Backend Cloud Status</span>
                        {supabaseHealth?.connected ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1.5" />
                            Connected & Operational
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Disconnected
                          </span>
                        )}
                      </h3>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        {supabaseHealth?.url || 'https://phqyznpnyqxcgsrxbymk.supabase.co'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={checkSupabaseStatus}
                    disabled={isCheckingSupabase}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wide flex items-center space-x-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isCheckingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isCheckingSupabase ? 'Pinging Cloud...' : 'Run Diagnostics'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Latency</span>
                    <span className="text-xl font-mono font-extrabold text-slate-900 block">
                      {supabaseHealth ? `${supabaseHealth.responseTimeMs} ms` : '--'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">PostgreSQL direct query speed</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                    <span className="text-xl font-extrabold text-emerald-600 block uppercase">
                      {supabaseHealth?.status || 'Unknown'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Authentication & REST API OK</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verified Tables</span>
                    <span className="text-xl font-mono font-extrabold text-indigo-600 block">
                      {supabaseHealth?.tablesChecked ? `${supabaseHealth.tablesChecked.length} / 11` : '11 / 11'}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">Schema verified</span>
                  </div>
                </div>

                {supabaseHealth?.tableCounts && (
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Live Supabase Record Counts</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(supabaseHealth.tableCounts).map(([tbl, cnt]) => (
                        <div key={tbl} className="p-2.5 bg-white border border-slate-200/60 rounded-xl flex justify-between items-center">
                          <span className="text-[11px] font-mono uppercase text-slate-500">{tbl}</span>
                          <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{cnt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Developer Reset Zone */}
              <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl space-y-4 uppercase">
                <h3 className="font-display font-extrabold text-sm text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Developer Reset Zone</span>
                </h3>
                
                <p className="text-xs text-slate-600 font-medium leading-relaxed normal-case">
                  Click below to restore all Supabase database tables to initial seed records (students, default events, users, and house scoreboard).
                </p>

                <button
                  id="reset-db-btn"
                  onClick={handleDbResetClick}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wide transition shadow-md hover:shadow-lg cursor-pointer"
                >
                  Reset Supabase DB to Seed Data
                </button>
              </div>

            </div>
          )}

          {/* MENU 11: SCOREBOARD MANAGEMENT */}
          {activeMenu === 'scoreboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              {/* Scoreboard Overview & Action Banner */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block flex items-center space-x-1">
                    <Trophy className="h-3.5 w-3.5 mr-1 animate-bounce" />
                    <span>Live Standings & Championship Administration</span>
                  </span>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight mt-1 uppercase">Scoreboard Management</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Add new teams, adjust live scores, track points log, and manage active statuses.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTeam(null);
                    setTeamForm({
                      teamName: '',
                      teamColor: '#3b82f6',
                      teamLogo: '',
                      totalScore: 0,
                      status: 'active'
                    });
                    setIsAddTeamOpen(true);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wide flex items-center space-x-2 transition shadow-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Team</span>
                </button>
              </div>

              {/* Grid: 2 Columns - Team Lists and Score Operations */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Column 1: Team Standings table */}
                <div className="lg:col-span-8 bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-50 uppercase">
                    <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight flex items-center space-x-2">
                      <Trophy className="h-4.5 w-4.5 text-amber-500" />
                      <span>Teams & Live Points</span>
                    </h3>
                    <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-full font-bold text-slate-500">
                      {scoreboardTeams.length} Teams Registered
                    </span>
                  </div>

                  {scoreboardTeams.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-100 rounded-2xl">
                      <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No teams found in database</p>
                      <p className="text-[11px] text-slate-400 mt-1">Click "Add New Team" above to create one.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            <th className="py-3 px-4">Team Info</th>
                            <th className="py-3 px-4 text-center">Color Badge</th>
                            <th className="py-3 px-4 text-right">Total Score</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {scoreboardTeams.map((team) => (
                            <tr 
                              key={team.id} 
                              onClick={() => setSelectedTeamForDetail(team)}
                              className="hover:bg-slate-50/50 transition duration-150 cursor-pointer"
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                  {team.teamLogo ? (
                                    <img src={team.teamLogo} alt={team.teamName} className="h-9 w-9 rounded-xl object-cover border border-slate-100 bg-slate-50" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="h-9 w-9 rounded-xl flex items-center justify-center font-display font-extrabold text-sm text-white" style={{ backgroundColor: team.teamColor }}>
                                      {team.teamName.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">{team.teamName}</h4>
                                    <span className="text-[9px] text-slate-400 font-mono">ID: {team.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border" style={{ color: team.teamColor, borderColor: team.teamColor + '33', backgroundColor: team.teamColor + '11' }}>
                                  <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: team.teamColor }} />
                                  {team.teamColor}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right font-mono font-bold text-slate-800 text-sm">
                                {team.totalScore} pts
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  team.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                }`}>
                                  {team.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTeamForDetail(team);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition"
                                    title="View Score Breakdown"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTeam(team);
                                      setTeamForm({
                                        teamName: team.teamName,
                                        teamColor: team.teamColor,
                                        teamLogo: team.teamLogo || '',
                                        totalScore: team.totalScore,
                                        status: team.status
                                      });
                                      setIsAddTeamOpen(true);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition"
                                    title="Edit Team"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTeam(team.id);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition"
                                    title="Delete Team"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Column 2: Score Update Panel */}
                <div className="lg:col-span-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                  <div className="border-b border-slate-50 pb-4 uppercase">
                    <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight flex items-center space-x-2">
                      <Award className="h-4.5 w-4.5 text-indigo-600" />
                      <span>Adjust Team Points</span>
                    </h3>
                  </div>

                  <form onSubmit={handleUpdateTeamScore} className="space-y-4">
                    <div className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <label className="block">Select Target Team</label>
                      <select
                        value={scoreUpdateForm.teamId}
                        onChange={(e) => setScoreUpdateForm(prev => ({ ...prev, teamId: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs uppercase tracking-wide text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                        required
                      >
                        <option value="">-- Choose Team --</option>
                        {scoreboardTeams.map(t => (
                          <option key={t.id} value={t.id}>{t.teamName} (Current: {t.totalScore} pts)</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <label className="block">Score Action amount (+/-)</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="e.g. 15 or -10"
                          value={scoreUpdateForm.scoreChange || ''}
                          onChange={(e) => setScoreUpdateForm(prev => ({ ...prev, scoreChange: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                          required
                        />
                        <div className="absolute right-3 top-3.5 flex space-x-1.5 text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => setScoreUpdateForm(prev => ({ ...prev, scoreChange: Math.abs(prev.scoreChange || 10) }))}
                            className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded hover:bg-emerald-100"
                          >
                            ADD (+)
                          </button>
                          <button
                            type="button"
                            onClick={() => setScoreUpdateForm(prev => ({ ...prev, scoreChange: -Math.abs(prev.scoreChange || 10) }))}
                            className="bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded hover:bg-rose-100"
                          >
                            SUB (-)
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <label className="block">Reason / Event Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Winner of Solo Folk Dance"
                        value={scoreUpdateForm.reason}
                        onChange={(e) => setScoreUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingScore}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
                    >
                      {isSubmittingScore ? 'Saving changes...' : 'Save Score Adjustment'}
                    </button>

                    {scoreUpdateStatus === 'success' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[10px] font-bold text-center uppercase tracking-wider">
                        Score successfully updated! Standings synchronized.
                      </div>
                    )}
                    {scoreUpdateStatus === 'error' && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[10px] font-bold text-center uppercase tracking-wider">
                        Error. Verification failure.
                      </div>
                    )}
                  </form>
                </div>

              </div>

              {/* Score adjustment history log */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-50 uppercase">
                  <h3 className="font-display font-extrabold text-sm text-slate-900 tracking-tight flex items-center space-x-2">
                    <History className="h-4.5 w-4.5 text-indigo-600" />
                    <span>Score History Log</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Showing latest changes
                  </span>
                </div>

                {scoreHistory.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No score updates on record</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[9px] uppercase font-bold tracking-wider text-slate-400">
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Team</th>
                          <th className="py-3 px-4 text-center">Score Change</th>
                          <th className="py-3 px-4">Reason / Event Details</th>
                          <th className="py-3 px-4 text-right">Moderated By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                        {[...scoreHistory].reverse().map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/30">
                            <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 uppercase tracking-wide font-bold">
                              {log.teamName}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                                log.scoreChange > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                                {log.scoreChange > 0 ? `+${log.scoreChange}` : log.scoreChange}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium max-w-xs truncate" title={log.reason}>
                              {log.reason || 'Manual Score Adjustment'}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-400 text-[10px]">
                              {log.updatedBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* -------------------- MODAL: EDIT STATISTICS OVERRIDES -------------------- */}
      {isEditStatsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6 transform scale-100 transition-all uppercase">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <span>Edit Statistics Overrides</span>
              </h3>
              <button 
                onClick={() => setIsEditStatsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStats} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Total Students Count
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1247"
                  value={statTotalStudents}
                  onChange={(e) => setStatTotalStudents(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Active Events Count
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 12"
                  value={statActiveEvents}
                  onChange={(e) => setStatActiveEvents(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Pending Approvals Count
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 18"
                  value={statPendingApprovals}
                  onChange={(e) => setStatPendingApprovals(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Certificates Issued Count
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 386"
                  value={statCertificatesIssued}
                  onChange={(e) => setStatCertificatesIssued(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingStats}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
              >
                {isSavingStats ? 'Saving Overrides...' : 'Apply Overrides ✓'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: ADD NEW EVENT -------------------- */}
      {isAddEventOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6 my-8 transform scale-100 transition-all uppercase">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                <span>Add New Event</span>
              </h3>
              <button 
                onClick={() => setIsAddEventOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Duff Muttu"
                    value={eventForm.name}
                    onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="stage">Stage event</option>
                    <option value="off_stage">Off-Stage event</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Type</label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Program Category</label>
                  <select
                    value={eventForm.programCategory}
                    onChange={(e) => setEventForm(prev => ({ ...prev, programCategory: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="Sub-Junior">Sub-Junior</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="General">General</option>
                    <option value="Group">Group</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={eventForm.time}
                    onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auditorium"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm(prev => ({ ...prev, venue: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Max Participants</label>
                  <input
                    type="number"
                    required
                    value={eventForm.maxParticipants}
                    onChange={(e) => setEventForm(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="results_published">Results Published</option>
                  </select>
                </div>
              </div>

              {/* Rules Subfield */}
              <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl space-y-3">
                <span className="block text-[10px] font-extrabold text-indigo-700">Event Rules & Guidelines</span>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase">Eligibility</label>
                    <textarea
                      rows={1}
                      value={eventForm.rules.eligibility}
                      onChange={(e) => setEventForm(prev => ({ ...prev, rules: { ...prev.rules, eligibility: e.target.value } }))}
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase">Time Limit</label>
                    <textarea
                      rows={1}
                      value={eventForm.rules.timeLimit}
                      onChange={(e) => setEventForm(prev => ({ ...prev, rules: { ...prev.rules, timeLimit: e.target.value } }))}
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase">Judging Criteria</label>
                    <textarea
                      rows={1}
                      value={eventForm.rules.judgingCriteria}
                      onChange={(e) => setEventForm(prev => ({ ...prev, rules: { ...prev.rules, judgingCriteria: e.target.value } }))}
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase">Materials</label>
                    <textarea
                      rows={1}
                      value={eventForm.rules.materials}
                      onChange={(e) => setEventForm(prev => ({ ...prev, rules: { ...prev.rules, materials: e.target.value } }))}
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-lg cursor-pointer"
              >
                Create Event ✓
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: EDIT EVENT -------------------- */}
      {editingEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6 my-8 transform scale-100 transition-all uppercase">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Edit className="h-5 w-5 text-indigo-600" />
                <span>Edit Event Details</span>
              </h3>
              <button 
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Duff Muttu"
                    value={eventForm.name}
                    onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="stage">Stage event</option>
                    <option value="off_stage">Off-Stage event</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Type</label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Program Category</label>
                  <select
                    value={eventForm.programCategory}
                    onChange={(e) => setEventForm(prev => ({ ...prev, programCategory: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="Sub-Junior">Sub-Junior</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="General">General</option>
                    <option value="Group">Group</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={eventForm.time}
                    onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auditorium"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm(prev => ({ ...prev, venue: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Max Participants</label>
                  <input
                    type="number"
                    required
                    value={eventForm.maxParticipants}
                    onChange={(e) => setEventForm(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="results_published">Results Published</option>
                  </select>
                </div>
              </div>

              {/* Rules Subfield */}
              <div className="p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl space-y-3">
                <span className="block text-[10px] font-extrabold text-indigo-700">Event Rules & Guidelines</span>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase">Eligibility</label>
                    <textarea
                      rows={1}
                      value={eventForm.rules.eligibility}
                      onChange={(e) => setEventForm(prev => ({ ...prev, rules: { ...prev.rules, eligibility: e.target.value } }))}
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase">Time Limit</label>
                    <textarea
                      rows={1}
                      value={eventForm.rules.timeLimit}
                      onChange={(e) => setEventForm(prev => ({ ...prev, rules: { ...prev.rules, timeLimit: e.target.value } }))}
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase">Judging Criteria</label>
                    <textarea
                      rows={1}
                      value={eventForm.rules.judgingCriteria}
                      onChange={(e) => setEventForm(prev => ({ ...prev, rules: { ...prev.rules, judgingCriteria: e.target.value } }))}
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase">Materials</label>
                    <textarea
                      rows={1}
                      value={eventForm.rules.materials}
                      onChange={(e) => setEventForm(prev => ({ ...prev, rules: { ...prev.rules, materials: e.target.value } }))}
                      className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-lg cursor-pointer"
              >
                Save Changes ✓
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: ADD STUDENT (NEW) -------------------- */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6 my-8 transform scale-100 transition-all uppercase">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <PlusCircle className="h-5 w-5 text-indigo-600" />
                <span>Add New Student Profile</span>
              </h3>
              <button 
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fathima Zahra"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Class/Grade</label>
                  <select
                    value={studentForm.class}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Team Group</label>
                  <select
                    value={studentForm.house}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, house: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    {scoreboardTeams.length > 0 ? (
                      scoreboardTeams.map(t => (
                        <option key={t.id} value={t.teamName}>{t.teamName}</option>
                      ))
                    ) : (
                      <>
                        <option value="Team A">Team A</option>
                        <option value="Team B">Team B</option>
                        <option value="Team C">Team C</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Category</label>
                <select
                  value={studentForm.category}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                >
                  <option value="Sub-Junior">Sub-Junior</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Photo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={studentForm.photo}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, photo: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-lg cursor-pointer"
              >
                Create Student ✓
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: EDIT STUDENT (NEW) -------------------- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6 my-8 transform scale-100 transition-all uppercase">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Edit className="h-5 w-5 text-indigo-600" />
                <span>Modify Student Profile</span>
              </h3>
              <button 
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fathima Zahra"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Class/Grade</label>
                  <select
                    value={studentForm.class}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase">Team Group</label>
                  <select
                    value={studentForm.house}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, house: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                  >
                    {scoreboardTeams.length > 0 ? (
                      scoreboardTeams.map(t => (
                        <option key={t.id} value={t.teamName}>{t.teamName}</option>
                      ))
                    ) : (
                      <>
                        <option value="Team A">Team A</option>
                        <option value="Team B">Team B</option>
                        <option value="Team C">Team C</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Category</label>
                <select
                  value={studentForm.category}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 cursor-pointer"
                >
                  <option value="Sub-Junior">Sub-Junior</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase">Photo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={studentForm.photo}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, photo: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-lg cursor-pointer"
              >
                Save Changes ✓
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: TEAM SCORE DETAILS BREAKDOWN -------------------- */}
      {selectedTeamForDetail && (() => {
        const teamRank = [...scoreboardTeams]
          .sort((a, b) => b.totalScore - a.totalScore)
          .findIndex(t => t.id === selectedTeamForDetail.id) + 1;

        const teamHistory = scoreHistory.filter(sh => sh.teamId === selectedTeamForDetail.id);
        const winsCount = teamHistory.filter(sh => 
          sh.position === '1st Place' || 
          sh.position === '1st' || 
          sh.reason?.toLowerCase().includes('1st place') ||
          sh.reason?.toLowerCase().includes('first place')
        ).length;

        const totalPlacedEvents = teamHistory.filter(sh => sh.eventId).length;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-slate-100 shadow-2xl space-y-6 transform scale-100 transition-all">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedTeamForDetail.teamColor }} />
                  <div>
                    <h3 className="font-display font-extrabold text-base text-slate-900 uppercase">
                      {selectedTeamForDetail.teamName} Points Breakdown
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Team ID: {selectedTeamForDetail.id} • Status: {selectedTeamForDetail.status}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTeamForDetail(null)}
                  className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Stats Overview Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Points</span>
                  <span className="text-xl font-mono font-extrabold text-slate-800 block">
                    {selectedTeamForDetail.totalScore} <span className="text-xs font-semibold text-slate-400">PTS</span>
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Rank</span>
                  <span className="text-xl font-mono font-extrabold text-slate-800 block">
                    #{teamRank}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gold Medal Wins</span>
                  <span className="text-xl font-mono font-extrabold text-amber-500 block">
                    {winsCount} <span className="text-xs font-semibold text-slate-400">WINS</span>
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Placed Events</span>
                  <span className="text-xl font-mono font-extrabold text-indigo-600 block">
                    {totalPlacedEvents} <span className="text-xs font-semibold text-slate-400">EVENTS</span>
                  </span>
                </div>
              </div>

              {/* Score History Section */}
              <div className="space-y-3">
                <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wide">Points History Breakdown</h4>
                
                {teamHistory.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No points adjustments recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          <th className="py-3 px-4">Event Name / Reason</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Student / Group</th>
                          <th className="py-3 px-4 text-center">Position</th>
                          <th className="py-3 px-4 text-right">Points</th>
                          <th className="py-3 px-4 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {teamHistory.map((sh) => (
                          <tr key={sh.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-4 font-bold uppercase text-slate-800">
                              {sh.eventName || sh.reason}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase">
                                {sh.eventCategory || 'Manual Adjustment'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-semibold uppercase">
                              {sh.studentName || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                sh.position?.includes('1st') ? 'bg-amber-100 text-amber-700' :
                                sh.position?.includes('2nd') ? 'bg-slate-100 text-slate-700' :
                                sh.position?.includes('3rd') ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {sh.position || 'Manual'}
                              </span>
                            </td>
                            <td className={`py-3 px-4 text-right font-mono font-bold ${sh.scoreChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {sh.scoreChange >= 0 ? `+${sh.scoreChange}` : sh.scoreChange} pts
                            </td>
                            <td className="py-3 px-4 text-right text-[10px] text-slate-400 font-mono">
                              {new Date(sh.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedTeamForDetail(null)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wide rounded-xl transition"
                >
                  Close Details
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* -------------------- MODAL: ADD / EDIT SCOREBOARD TEAM -------------------- */}
      {isAddTeamOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6 transform scale-100 transition-all uppercase">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-indigo-600" />
                <span>{editingTeam ? 'Edit Team Details' : 'Add New Team'}</span>
              </h3>
              <button 
                onClick={() => setIsAddTeamOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crimson"
                  value={teamForm.teamName}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, teamName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl uppercase tracking-wide font-semibold focus:outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Team Color (Hex Picker)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    required
                    value={teamForm.teamColor}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, teamColor: e.target.value }))}
                    className="h-10 w-12 bg-slate-50 border border-slate-200 p-1 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    placeholder="#3b82f6"
                    value={teamForm.teamColor}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, teamColor: e.target.value }))}
                    className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono uppercase focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Team Logo URL / Base64 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://example.com/logo.png"
                  value={teamForm.teamLogo}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, teamLogo: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              {!editingTeam && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Initial Total Score
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 0"
                    value={teamForm.totalScore}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, totalScore: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Team Status
                </label>
                <select
                  value={teamForm.status}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl uppercase font-semibold focus:outline-none focus:border-indigo-500 text-slate-800"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md"
                >
                  {editingTeam ? 'Save Changes' : 'Create Team'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddTeamOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- OVERLAY: CUSTOM CONFIRM MODAL (NO WINDOW.CONFIRM) -------------------- */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-100 shadow-2xl space-y-6 transform scale-100 transition-all uppercase text-center">
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-display font-extrabold text-sm text-slate-950 tracking-tight">
                Confirm {deleteConfirmTarget.type}
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Are you sure you want to proceed? This destructive action cannot be reverted.
              </p>
              {deleteConfirmTarget.name && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-xs font-bold font-mono break-all leading-normal">
                  {deleteConfirmTarget.name}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  deleteConfirmTarget.action();
                  setDeleteConfirmTarget(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shadow-md hover:shadow-lg cursor-pointer"
              >
                Yes, Proceed
              </button>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
