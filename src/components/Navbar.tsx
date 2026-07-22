import React from 'react';
import { User, Student } from '../types';
import { Award, Camera, Trophy, Calendar, Home, LogIn, LogOut, User as UserIcon, Bell } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User | null;
  studentProfile: Student | null;
  notifications: any[];
  onLogout: () => void;
  onOpenNotifications: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  currentUser,
  studentProfile,
  notifications,
  onLogout,
  onOpenNotifications
}: NavbarProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const houseColorClass = (house: string) => {
    switch (house) {
      case 'Red': return 'bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 text-[10px] font-semibold';
      case 'Blue': return 'bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 text-[10px] font-semibold';
      case 'Green': return 'bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5 text-[10px] font-semibold';
      case 'Yellow': return 'bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 text-[10px] font-semibold';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5 text-[10px] font-semibold';
    }
  };

  return (
    <nav id="sticky-nav" className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] group-hover:scale-105 transition-all duration-200">
              <Award className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight block leading-none bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                DARUSSALMA
              </span>
              <span className="text-[10px] text-slate-500 font-sans font-semibold tracking-wider uppercase block mt-1">
                Nandi Arts Fest 2026
              </span>
            </div>
            <span className="hidden lg:inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-indigo-100 bg-indigo-50/50 text-indigo-600">
              v2.4.0_LIVE
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-1">
            <button
              id="nav-home"
              onClick={() => onNavigate('home')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                currentView === 'home' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Home className="h-4 w-4 mr-1.5 stroke-[2]" />
              Home
            </button>

            <button
              id="nav-events"
              onClick={() => onNavigate('events')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                currentView === 'events' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="h-4 w-4 mr-1.5 stroke-[2]" />
              Events
            </button>

            <button
              id="nav-scoreboard"
              onClick={() => onNavigate('scoreboard')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                currentView === 'scoreboard' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Trophy className="h-4 w-4 mr-1.5 stroke-[2]" />
              Scoreboard
            </button>

            <button
              id="nav-results"
              onClick={() => onNavigate('results')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                currentView === 'results' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Award className="h-4 w-4 mr-1.5 stroke-[2]" />
              Results
            </button>

            <button
              id="nav-gallery"
              onClick={() => onNavigate('gallery')}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 ${
                currentView === 'gallery' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Camera className="h-4 w-4 mr-1.5 stroke-[2]" />
              Gallery
            </button>
          </div>

          {/* User Section & Authentication */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <>
                {/* Notifications Bell */}
                <button
                  id="nav-notifications"
                  onClick={onOpenNotifications}
                  className="relative p-2.5 rounded-full border border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/80 hover:text-indigo-600 transition-all duration-200 cursor-pointer"
                >
                  <Bell className="h-5 w-5 stroke-[2]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center bg-rose-500 border-2 border-white text-[9px] font-bold text-white rounded-full shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dashboard Access Button */}
                <button
                  id="nav-dashboard"
                  onClick={() => {
                    if (currentUser.role === 'admin') {
                      onNavigate('admin-dashboard');
                    } else {
                      onNavigate('student-dashboard');
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    currentView.includes('dashboard') 
                      ? 'bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)]' 
                      : 'border border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <UserIcon className="h-4 w-4 stroke-[2]" />
                  <span className="tracking-tight">
                    {currentUser.role === 'admin' ? 'Admin Panel' : (studentProfile?.name?.split(' ')[0] || 'My Profile')}
                  </span>
                  {studentProfile?.house && (
                    <span className={houseColorClass(studentProfile.house)}>
                      {studentProfile.house}
                    </span>
                  )}
                </button>

                {/* Log out */}
                <button
                  id="nav-logout"
                  onClick={onLogout}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all duration-200 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4.5 w-4.5 stroke-[2]" />
                </button>
              </>
            ) : (
              <button
                id="nav-login"
                onClick={() => onNavigate('register-now')}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm rounded-full shadow-[0_4px_14px_0_rgba(79,70,229,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(79,70,229,0.4)] transition-all duration-200 cursor-pointer"
              >
                <LogIn className="h-4 w-4 stroke-[2]" />
                <span>Student Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden flex justify-around py-3 bg-white border-t border-slate-100 text-[10px] font-semibold text-slate-600">
        <button onClick={() => onNavigate('home')} className={`flex flex-col items-center space-y-0.5 ${currentView === 'home' ? 'text-indigo-600 font-bold' : ''}`}>
          <Home className="h-5 w-5 stroke-[2]" />
          <span>Home</span>
        </button>
        <button onClick={() => onNavigate('events')} className={`flex flex-col items-center space-y-0.5 ${currentView === 'events' ? 'text-indigo-600 font-bold' : ''}`}>
          <Calendar className="h-5 w-5 stroke-[2]" />
          <span>Events</span>
        </button>
        <button onClick={() => onNavigate('scoreboard')} className={`flex flex-col items-center space-y-0.5 ${currentView === 'scoreboard' ? 'text-indigo-600 font-bold' : ''}`}>
          <Trophy className="h-5 w-5 stroke-[2]" />
          <span>Scores</span>
        </button>
        <button onClick={() => onNavigate('results')} className={`flex flex-col items-center space-y-0.5 ${currentView === 'results' ? 'text-indigo-600 font-bold' : ''}`}>
          <Award className="h-5 w-5 stroke-[2]" />
          <span>Results</span>
        </button>
        <button onClick={() => onNavigate('gallery')} className={`flex flex-col items-center space-y-0.5 ${currentView === 'gallery' ? 'text-indigo-600 font-bold' : ''}`}>
          <Camera className="h-5 w-5 stroke-[2]" />
          <span>Gallery</span>
        </button>
      </div>
    </nav>
  );
}

