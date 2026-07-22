import React, { useState } from 'react';
import { Student, User, Event, Registration, Notification, Certificate, Announcement } from '../types';
import { Calendar, Award, Bell, Shield, Users, Mail, Phone, BookOpen, Clock, Heart, Download } from 'lucide-react';

interface StudentDashboardProps {
  student: Student;
  user: User;
  registrations: Registration[];
  events: Event[];
  notifications: Notification[];
  certificates: Certificate[];
  announcements: Announcement[];
  onNavigate: (view: string) => void;
  onMarkNotificationRead: (id: string) => void;
}

export default function StudentDashboard({
  student,
  user,
  registrations,
  events,
  notifications,
  certificates,
  announcements,
  onNavigate,
  onMarkNotificationRead
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'notifications' | 'certificates'>('profile');

  // Filter student registries
  const studentRegs = registrations.filter(r => r.studentId === student.id && r.paymentStatus === 'completed');
  const registeredEvents = studentRegs.map(r => events.find(e => e.id === r.eventId)).filter(Boolean) as Event[];

  // Statistics
  const registeredCount = registeredEvents.length;
  const completedCount = registeredEvents.filter(e => e.status === 'results_published').length;
  const certificateCount = certificates.filter(c => c.studentId === student.id).length;
  const currentRank = student.house === 'Blue' ? '#12' : '#8'; // seed dummy rank matching screenshot

  const getHouseBadgeClass = (house: string) => {
    switch (house.toLowerCase()) {
      case 'red':
      case 'team a': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'blue':
      case 'team b': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'green':
      case 'team c': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'yellow': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getHouseIndicatorColor = (house: string) => {
    switch (house.toLowerCase()) {
      case 'red':
      case 'team a': return 'bg-rose-500';
      case 'blue':
      case 'team b': return 'bg-indigo-500';
      case 'green':
      case 'team c': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen bg-[#F8FAFC]">
      
      {/* 1. Student Welcome Banner */}
      <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(79,70,229,0.15)] border border-slate-800">
        <div className="absolute right-0 top-0 bg-indigo-600 px-4 py-1.5 rounded-bl-2xl font-semibold text-[10px] uppercase tracking-wider text-white">
          LIVE STUDENT ACCOUNT
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
            Student Command Center
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {student.name}
          </h1>
          
          <div className="flex flex-wrap gap-3 pt-1 text-xs font-bold uppercase">
            <span className={`px-3 py-1 border rounded-full flex items-center space-x-2 ${getHouseBadgeClass(student.house)}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${getHouseIndicatorColor(student.house)}`} />
              <span>{student.house}</span>
            </span>
            <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full font-sans">Class: {student.class}</span>
            <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full font-sans">ID: {student.studentId}</span>
            {student.category && (
              <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full flex items-center space-x-1.5 font-sans">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Category: {student.category}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] text-center">
          <span className="block text-4xl font-extrabold text-slate-900">{registeredCount}</span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2">Events Registered</span>
        </div>
        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] text-center">
          <span className="block text-4xl font-extrabold text-slate-900">{completedCount}</span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2">Completed</span>
        </div>
        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] text-center">
          <span className="block text-4xl font-extrabold text-slate-900">{certificateCount}</span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2">Certificates</span>
        </div>
        <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] text-center">
          <span className="block text-4xl font-extrabold text-indigo-600">{currentRank}</span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-2">Current Rank</span>
        </div>
      </div>

      {/* 3. Main Dashboard split navigation layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-3 bg-white p-5 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] flex flex-col space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 pb-3 block border-b border-slate-100 mb-2">
            Navigation Center
          </span>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>My Profile Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeTab === 'events' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Registered Events ({registeredCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex justify-between items-center transition-all cursor-pointer ${
              activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Live Notifications</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                activeTab === 'notifications' ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'
              }`}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wide flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeTab === 'certificates' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Claim Certificates ({certificateCount})</span>
          </button>

          <div className="pt-4 border-t border-slate-100 mt-2 space-y-2">
            <button
              onClick={() => onNavigate('events')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl text-center uppercase tracking-wide block transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Browse Events →
            </button>
            <button
              onClick={() => onNavigate('scoreboard')}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl text-center uppercase tracking-wide block transition-all border border-slate-200 cursor-pointer"
            >
              Live Scoreboard
            </button>
          </div>
        </div>

        {/* Right Active Panel Content */}
        <div className="lg:col-span-9 bg-white p-6 sm:p-8 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)]">
          
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="font-display font-extrabold text-lg text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-tight">
                Student Profile Parameters
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3.5 text-xs uppercase font-semibold text-slate-700">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Primary Email</span>
                      <span className="text-slate-800 font-sans">{user.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5 text-xs uppercase font-semibold text-slate-700">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Represented Team</span>
                      <span className="text-slate-800 font-sans font-bold">{student.house}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3.5 text-xs uppercase font-semibold text-slate-700">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-indigo-500 bg-indigo-50/50">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Competition Category</span>
                      <span className="text-indigo-600 font-sans font-bold text-sm">{student.category || 'Sub-Junior'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/60 space-y-3 uppercase">
                  <h3 className="font-display font-extrabold text-xs text-slate-900">Official Entry Pass Issued</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed normal-case">
                    Your direct entry pass for the fest has been generated. Ensure to have your student ID card or Entry pass code handy for campus check-in.
                  </p>
                  <div className="border-t border-slate-200/50 pt-3 text-[10px] font-bold text-slate-400">
                    CONFIRMATION CODE: {registrations.find(r => r.studentId === student.id)?.confirmationNumber || 'NAF-2026-0847'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Registered Events list */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="font-display font-extrabold text-lg text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-tight">
                Your Registered Competitions
              </h2>

              {registeredEvents.length === 0 ? (
                <div className="text-center py-12 space-y-4 uppercase">
                  <span className="text-4xl block">🗓️</span>
                  <h4 className="text-xs font-bold text-slate-400">No active registrations detected</h4>
                  <button 
                    onClick={() => onNavigate('events')}
                    className="py-2.5 px-5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-indigo-500 transition-all shadow-md cursor-pointer"
                  >
                    Register Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registeredEvents.map(e => (
                    <div key={e.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-4 uppercase">
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          e.category === 'stage' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {e.category === 'stage' ? 'Stage' : 'Off-Stage'}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-2.5 leading-snug uppercase">{e.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">{e.date} • {e.time}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-200/50 pt-3 text-slate-400 uppercase">
                        <span>Venue: <b className="text-slate-700 font-extrabold">{e.venue}</b></span>
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold uppercase">✓ Confirmed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Notifications Manager */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="font-display font-extrabold text-lg text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-tight">
                Live Notification Records
              </h2>

              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold uppercase italic normal-case">No notification records.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(n => (
                    <div key={n.id} className={`py-4 flex justify-between items-start gap-4 uppercase ${!n.read ? 'bg-amber-50/40 px-3 py-3 border border-amber-100 rounded-xl mb-2' : ''}`}>
                      <div className="space-y-1">
                        <p className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>{n.message.toUpperCase()}</p>
                        <span className="text-[9px] text-slate-400 font-bold block">{new Date(n.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => onMarkNotificationRead(n.id)}
                          className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-2.5 py-1 transition whitespace-nowrap uppercase cursor-pointer"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Certificates list */}
          {activeTab === 'certificates' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h2 className="font-display font-extrabold text-lg text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-tight">
                Issued Certificates
              </h2>

              {certificates.filter(c => c.studentId === student.id).length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-bold uppercase italic normal-case">
                  No certificates issued yet. Participate in events and win high positions to claim medals!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.filter(c => c.studentId === student.id).map(cert => (
                    <div key={cert.id} className="bg-slate-50 p-5 border border-slate-100 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm uppercase">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                          ★ {cert.awardText} • {cert.points} PTS ★
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-2.5 leading-snug uppercase">{cert.eventName}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">Verification: {cert.verificationCode}</span>
                      </div>
                      <button
                        onClick={() => {
                          // redirect student to print cert
                          onNavigate('results');
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>VIEW AND PRINT</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
