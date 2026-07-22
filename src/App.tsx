import React, { useState, useEffect } from 'react';
import { Event, Result, GalleryItem, Announcement, HouseScore, Notification, Certificate, Registration, User, Student } from './types';

// Core components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EventDetailModal from './components/EventDetailModal';

// Views
import HomeView from './views/HomeView';
import EventsView from './views/EventsView';
import ScoreboardView from './views/ScoreboardView';
import ResultsView from './views/ResultsView';
import GalleryView from './views/GalleryView';
import StudentDashboard from './views/StudentDashboard';
import AdminDashboard from './views/AdminDashboard';
import RegistrationWizard from './components/RegistrationWizard';

export default function App() {
  const [activeView, setActiveView] = useState<string>('home');
  const [loading, setLoading] = useState(true);

  // Auth/User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);

  // Dynamic lists from DB
  const [events, setEvents] = useState<Event[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [scoreboard, setScoreboard] = useState<HouseScore[]>([]);
  const [individualRankings, setIndividualRankings] = useState<any[]>([]);
  const [recentWinners, setRecentWinners] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  
  // Modal selection state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // On Mount: Load session and pull base database assets
  useEffect(() => {
    initializeAppData();
  }, []);

  const initializeAppData = async () => {
    setLoading(true);
    try {
      // 1. Load active user session from localStorage if present
      const storedUser = localStorage.getItem('user_session');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setCurrentUser(parsedUser);
        
        // Load their specific profile and user-bound logs
        if (parsedUser.role === 'student') {
          await fetchStudentProfile(parsedUser.id);
        }
      }

      // 2. Fetch baseline global parameters in parallel
      await Promise.all([
        fetchEvents(),
        fetchResults(),
        fetchGallery(),
        fetchAnnouncements(),
        fetchScoreboard()
      ]);

    } catch (err) {
      console.error("App initialization failed: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper fetches
  const fetchEvents = async () => {
    const res = await fetch('/api/events');
    const data = await res.json();
    setEvents(data);
  };

  const fetchResults = async () => {
    const res = await fetch('/api/results');
    const data = await res.json();
    setResults(data.results || []);
  };

  const fetchGallery = async () => {
    const res = await fetch('/api/gallery');
    const data = await res.json();
    setGallery(data);
  };

  const fetchAnnouncements = async () => {
    const res = await fetch('/api/announcements');
    const data = await res.json();
    setAnnouncements(data);
  };

  const fetchScoreboard = async () => {
    const res = await fetch('/api/scoreboard');
    const data = await res.json();
    setScoreboard(data.scoreboard);
    setIndividualRankings(data.individualRankings);
    setRecentWinners(data.recentWinners);
  };

  const fetchStudentProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/students/profile?userId=${userId}`);
      if (res.ok) {
        const profile = await res.json();
        setStudentProfile(profile);
        
        // Fetch user-bound assets
        await Promise.all([
          fetchNotifications(profile.id),
          fetchCertificates(profile.id),
          fetchRegistrations()
        ]);
      } else {
        setStudentProfile(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async (studentId: string) => {
    const res = await fetch(`/api/notifications?studentId=${studentId}`);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
  };

  const fetchCertificates = async (studentId: string) => {
    const res = await fetch(`/api/certificates?studentId=${studentId}`);
    if (res.ok) {
      const data = await res.json();
      setCertificates(data);
    }
  };

  const fetchRegistrations = async () => {
    const res = await fetch('/api/registrations');
    if (res.ok) {
      const data = await res.json();
      setRegistrations(data);
    }
  };

  // Auth: Handlers
  const handleLogin = async (credentials: any) => {
    const loginUrl = credentials.studentId ? '/api/auth/quick-login' : '/api/auth/login';
    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.error || 'Login failed');
    }

    const session = await res.json();
    setCurrentUser(session.user);
    localStorage.setItem('user_session', JSON.stringify(session.user));

    if (session.user.role === 'admin') {
      setActiveView('admin-dashboard');
    } else {
      await fetchStudentProfile(session.user.id);
      setActiveView('student-dashboard');
    }
    return session.user;
  };

  const handleRegisterUser = async (details: any) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }

    return await res.json();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStudentProfile(null);
    localStorage.removeItem('user_session');
    setActiveView('home');
  };

  const handleSaveProfile = async (profileDetails: any) => {
    const res = await fetch('/api/students/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileDetails)
    });

    if (!res.ok) throw new Error('Failed to save student profile details');
    const student = await res.json();
    setStudentProfile(student);
    return student;
  };

  const handleSelectHouse = async (studentId: string, houseName: string) => {
    const res = await fetch('/api/students/house', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, house: houseName })
    });

    if (!res.ok) throw new Error('Failed to lock in house choice');
    const student = await res.json();
    setStudentProfile(student);
    return student;
  };

  const handleSubmitRegistrations = async (studentId: string, eventIds: string[]) => {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, eventIds })
    });

    if (!res.ok) throw new Error('Failed to save selected event parameters');
    const data = await res.json();
    await fetchRegistrations();
    return data;
  };

  const handleCompletePayment = async (studentId: string, confirmationNumber: string) => {
    const res = await fetch('/api/registrations/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, confirmationNumber })
    });

    if (!res.ok) throw new Error('Payment confirmation failed');
    await Promise.all([
      fetchRegistrations(),
      studentProfile ? fetchCertificates(studentProfile.id) : Promise.resolve(),
      studentProfile ? fetchNotifications(studentProfile.id) : Promise.resolve()
    ]);
  };

  const handlePublishResult = async (resultDetails: any) => {
    const res = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultDetails)
    });

    if (!res.ok) throw new Error('Failed to publish results standing');
    const result = await res.json();
    
    // Refresh parameters
    await Promise.all([
      fetchResults(),
      fetchScoreboard(),
      fetchEvents()
    ]);
    return result;
  };

  const handleEditResult = async (resultDetails: any) => {
    const res = await fetch('/api/admin/results/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultDetails)
    });

    if (!res.ok) throw new Error('Failed to edit results standing');
    const result = await res.json();

    await Promise.all([
      fetchResults(),
      fetchScoreboard(),
      fetchEvents()
    ]);
    return result;
  };

  const handleDeleteResult = async (resultId: string) => {
    const res = await fetch('/api/admin/results/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resultId })
    });

    if (!res.ok) throw new Error('Failed to delete results standing');
    const result = await res.json();

    await Promise.all([
      fetchResults(),
      fetchScoreboard(),
      fetchEvents()
    ]);
    return result;
  };

  const handlePostAnnouncement = async (annDetails: any) => {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annDetails)
    });

    if (!res.ok) throw new Error('Failed to broadcast announcement');
    const ann = await res.json();
    await fetchAnnouncements();
    return ann;
  };

  const handleUploadPhoto = async (photoDetails: any) => {
    const res = await fetch('/api/gallery/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photoDetails)
    });

    if (!res.ok) throw new Error('Failed to submit photo file');
    const item = await res.json();
    await fetchGallery();
    return item;
  };

  const handleMarkNotificationRead = async (id: string) => {
    await fetch(`/api/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (studentProfile) {
      await fetchNotifications(studentProfile.id);
    }
  };

  const handleResetDb = async () => {
    const res = await fetch('/api/admin/reset', { method: 'POST' });
    if (res.ok) {
      // Refresh everything to baseline seeds
      await initializeAppData();
    }
  };

  const handleSearchCertificates = async (query: string) => {
    const res = await fetch(`/api/certificates/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  };

  // Hall of Fame Leads (dynamically derived)
  const getHallOfFameLeads = () => {
    if (scoreboard.length === 0) return { house: 'Red', totalPoints: 2450 };
    const sorted = [...scoreboard].sort((a,b) => b.totalPoints - a.totalPoints);
    return {
      house: sorted[0].house,
      totalPoints: sorted[0].totalPoints
    };
  };

  // Loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Loading Festival Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between antialiased">
      
      {/* Dynamic Announcement Ticker Banner */}
      {announcements.length > 0 && (
        <div className="bg-slate-900 text-slate-100 py-2.5 px-4 text-xs overflow-hidden relative border-b border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center space-x-4">
            <span className="font-bold uppercase tracking-wider text-[9px] bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shrink-0 flex items-center space-x-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-0.5" />
              <span>LIVE BULLETIN</span>
            </span>
            <div className="animate-marquee whitespace-nowrap overflow-hidden text-ellipsis font-semibold uppercase tracking-wide text-slate-300">
              {announcements[0].title}: {announcements[0].content} — Keep checking ticker details!
            </div>
          </div>
        </div>
      )}

      {/* Primary Navigation bar */}
      <Navbar
        currentUser={currentUser}
        studentProfile={studentProfile}
        currentView={activeView}
        onNavigate={setActiveView}
        onLogout={handleLogout}
        notifications={notifications}
        onOpenNotifications={() => setActiveView('student-dashboard')}
      />

      {/* Main Core Router View Wrapper */}
      <main className="flex-grow">
        {activeView === 'home' && (
          <HomeView 
            announcements={announcements} 
            events={events} 
            scoreboard={scoreboard}
            gallery={gallery}
            onNavigate={setActiveView} 
            onSelectEvent={setSelectedEvent}
          />
        )}

        {activeView === 'events' && (
          <EventsView 
            events={events} 
            onSelectEvent={setSelectedEvent}
            onRegister={(eventId) => setActiveView('register-now')}
          />
        )}

        {activeView === 'scoreboard' && (
          <ScoreboardView 
            scoreboard={scoreboard} 
            individualRankings={individualRankings}
            recentWinners={recentWinners}
            events={events}
          />
        )}

        {activeView === 'results' && (
          <ResultsView 
            results={results} 
            hallOfFame={getHallOfFameLeads()}
            onSearchCertificates={handleSearchCertificates}
          />
        )}

        {activeView === 'gallery' && (
          <GalleryView 
            gallery={gallery} 
            currentUser={currentUser}
            onUploadPhoto={handleUploadPhoto}
          />
        )}

        {activeView === 'register-now' && (
          <RegistrationWizard
            events={events}
            currentUser={currentUser}
            studentProfile={studentProfile}
            onNavigate={setActiveView}
            onLogin={handleLogin}
            onRegisterUser={handleRegisterUser}
            onSaveProfile={handleSaveProfile}
            onSelectHouse={handleSelectHouse}
            onSubmitRegistrations={handleSubmitRegistrations}
            onCompletePayment={handleCompletePayment}
          />
        )}

        {activeView === 'student-dashboard' && currentUser && studentProfile && (
          <StudentDashboard
            student={studentProfile}
            user={currentUser}
            registrations={registrations}
            events={events}
            notifications={notifications}
            certificates={certificates}
            announcements={announcements}
            onNavigate={setActiveView}
            onMarkNotificationRead={handleMarkNotificationRead}
          />
        )}

        {activeView === 'admin-dashboard' && currentUser?.role === 'admin' && (
          <AdminDashboard
            events={events}
            results={results}
            onPublishResult={handlePublishResult}
            onEditResult={handleEditResult}
            onDeleteResult={handleDeleteResult}
            onPostAnnouncement={handlePostAnnouncement}
            onResetDb={handleResetDb}
            onRefreshEvents={fetchEvents}
            onRefreshAnnouncements={fetchAnnouncements}
            onRefreshGallery={fetchGallery}
          />
        )}
      </main>

      {/* Event Details Overlay Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegister={(eventId) => {
            setSelectedEvent(null);
            setActiveView('register-now');
          }}
        />
      )}

      {/* Footer copyright */}
      <Footer onNavigate={setActiveView} />

    </div>
  );
}
