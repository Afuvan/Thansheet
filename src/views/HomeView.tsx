import React, { useState, useEffect } from 'react';
import { Event, Announcement, HouseScore, GalleryItem } from '../types';
import { Calendar, ChevronDown, ChevronUp, Clock, Info, Shield, Users, ArrowRight, Trophy, Camera, Award, Star, Quote } from 'lucide-react';

interface HomeViewProps {
  events: Event[];
  announcements: Announcement[];
  scoreboard: HouseScore[];
  gallery: GalleryItem[];
  onNavigate: (view: string) => void;
  onSelectEvent: (event: Event) => void;
}

export default function HomeView({
  events,
  announcements,
  scoreboard,
  gallery,
  onNavigate,
  onSelectEvent
}: HomeViewProps) {
  // Countdown Timer state: Target March 12, 2026
  const [countdown, setCountdown] = useState({ days: 41, hours: 23, minutes: 59, seconds: 59 });
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        clearInterval(interval);
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Split events for preview
  const stagePreview = events.filter(e => e.category === 'stage').slice(0, 3);
  const offstagePreview = events.filter(e => e.category === 'off_stage').slice(0, 3);
  const featuredEvents = events.slice(0, 5);

  const testimonials = [
    {
      text: "Best fest of my life! The competition is fierce, but the camaraderie between houses is incredible.",
      author: "Aisha M.",
      grade: "Grade 11, Red House",
    },
    {
      text: "Discovered my true passion for Digital Art here. The judge feedback was highly constructive.",
      author: "Rahul K.",
      grade: "Grade 12, Blue House",
    },
    {
      text: "Unforgettable memories under the auditorium lights! Group Song 2025 champion!",
      author: "Fatima R.",
      grade: "Grade 10, Green House",
    }
  ];

  const faqs = [
    {
      q: "How do I register for events?",
      a: "Click on 'Register Now' or log in to your account. Complete your student profile, select your house, and then multi-select up to 5 events from the stage and off-stage catalogs."
    },
    {
      q: "Can I switch my house after selection?",
      a: "No. House selection is a one-time process and cannot be changed after confirmation to keep the scoreboard points fair."
    },
    {
      q: "How many events can I participate in?",
      a: "Each student is permitted to register for a maximum of 5 events (both stage and off-stage combined) to prevent scheduling conflicts."
    },
    {
      q: "Where do I download certificates?",
      a: "Go to the Results page, scroll down to the 'Certificate Downloader' widget, enter your Student ID or Name, and download or print your customized certificates on-the-fly."
    },
    {
      q: "Are non-students allowed to attend?",
      a: "Yes! While registrations are restricted to Darussalma students, parents, alumni, and visitors are welcome to watch the live stages and browse the public scoreboards."
    }
  ];

  const getHouseColorCard = (houseName: string) => {
    switch (houseName.toLowerCase()) {
      case 'red':
      case 'team a': 
        return 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 text-rose-950 shadow-[0_4px_20px_-2px_rgba(239,68,68,0.08)]';
      case 'blue':
      case 'team b': 
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-indigo-950 shadow-[0_4px_20px_-2px_rgba(59,130,246,0.08)]';
      case 'green':
      case 'team c': 
        return 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-950 shadow-[0_4px_20px_-2px_rgba(16,185,129,0.08)]';
      case 'yellow': 
        return 'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 text-amber-950 shadow-[0_4px_20px_-2px_rgba(245,158,11,0.08)]';
      default: 
        return 'bg-slate-50 border border-slate-200 text-slate-800 shadow-[0_4px_20px_-2px_rgba(100,116,139,0.08)]';
    }
  };

  const getHouseTextBadge = (houseName: string) => {
    switch (houseName.toLowerCase()) {
      case 'red':
      case 'team a': return 'bg-red-500 text-white';
      case 'blue':
      case 'team b': return 'bg-blue-500 text-white';
      case 'green':
      case 'team c': return 'bg-emerald-500 text-white';
      case 'yellow': return 'bg-amber-500 text-slate-900';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-20 pb-24 bg-[#F8FAFC] relative overflow-hidden font-sans">
      
      {/* Background Blobs for Atmospheric Depth */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-200/20 to-violet-200/20 blur-3xl rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-violet-200/10 to-indigo-200/10 blur-3xl rounded-full pointer-events-none z-0" />

      {/* 1. Hero Section */}
      <section id="hero-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_30px_-5px_rgba(79,70,229,0.08)] p-8 sm:p-14 relative overflow-hidden">
          {/* Subtle Decorative Background Ring */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full border-4 border-indigo-50/50 pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>OFFICIAL FESTIVAL PORTAL</span>
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-950">
                Darussalma Academy <br/>
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Nandi Arts Fest 2026
                </span>
              </h1>
              
              <p className="text-base text-slate-600 max-w-xl font-normal leading-relaxed">
                Where art meets ambition. Welcome to the official digital hub of our annual celebration. Follow live scoreboard standings, browse events, register, view real-time results, and download secure certificates.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  id="hero-register-btn"
                  onClick={() => onNavigate('register-now')}
                  className="px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl text-sm shadow-[0_4px_14px_0_rgba(79,70,229,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgba(79,70,229,0.4)] transition-all duration-200 cursor-pointer"
                >
                  Register Now
                </button>
                <button
                  id="hero-explore-btn"
                  onClick={() => onNavigate('events')}
                  className="px-7 py-3.5 bg-white text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-all duration-200 cursor-pointer"
                >
                  Explore Events
                </button>
              </div>

              {/* Live Countdown widget */}
              <div className="pt-4">
                <div className="inline-block bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-[0_4px_12px_rgba(79,70,229,0.03)]">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-3 text-left">
                    ⏱️ FESTIVAL COUNTDOWN
                  </span>
                  <div className="flex items-center space-x-3 text-center">
                    <div>
                      <span className="block bg-white text-slate-900 border border-slate-200 rounded-xl px-3.5 py-1.5 text-lg font-bold min-w-[50px] shadow-sm">{String(countdown.days).padStart(2, '0')}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 block">Days</span>
                    </div>
                    <span className="text-slate-400 font-semibold mb-5">:</span>
                    <div>
                      <span className="block bg-white text-slate-900 border border-slate-200 rounded-xl px-3.5 py-1.5 text-lg font-bold min-w-[50px] shadow-sm">{String(countdown.hours).padStart(2, '0')}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 block">Hours</span>
                    </div>
                    <span className="text-slate-400 font-semibold mb-5">:</span>
                    <div>
                      <span className="block bg-white text-slate-900 border border-slate-200 rounded-xl px-3.5 py-1.5 text-lg font-bold min-w-[50px] shadow-sm">{String(countdown.minutes).padStart(2, '0')}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 block">Mins</span>
                    </div>
                    <span className="text-slate-400 font-semibold mb-5">:</span>
                    <div>
                      <span className="block bg-rose-50 text-rose-600 border border-rose-200 rounded-xl px-3.5 py-1.5 text-lg font-bold min-w-[50px] shadow-sm">{String(countdown.seconds).padStart(2, '0')}</span>
                      <span className="text-[9px] text-rose-400 font-bold uppercase mt-1.5 block">Secs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Image with Isometric Depth and 3D Transform */}
            <div className="lg:col-span-5 perspective-[2000px] py-6 hidden lg:block">
              <div className="w-full h-80 sm:h-96 rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(79,70,229,0.15)] relative overflow-hidden bg-white rotate-x-[4deg] rotate-y-[-10deg] hover:rotate-x-[1deg] hover:rotate-y-[-3deg] transition-all duration-500 group">
                <img 
                  src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800" 
                  alt="Darussalma Arts Fest"
                  className="w-full h-full object-cover transition-all duration-500 scale-102 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                  <span className="text-[10px] font-semibold tracking-wider text-indigo-400 block uppercase">LIVE CAMPUS SPECTACLE</span>
                  <span className="text-base font-bold uppercase tracking-wide block mt-1.5 leading-snug">4 Houses. 46 Events.<br/>1 Championship Trophy.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Statistics Section */}
      <section id="statistics-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.05)] text-center hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="block text-3xl font-extrabold text-slate-950 font-display tracking-tight">46</span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">Total Events</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.05)] text-center hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
              <Users className="h-5 w-5" />
            </div>
            <span className="block text-3xl font-extrabold text-slate-950 font-display tracking-tight">1,200+</span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">Participants</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.05)] text-center hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="block text-3xl font-extrabold text-slate-950 font-display tracking-tight">4</span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">Houses</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.05)] text-center hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Award className="h-5 w-5" />
            </div>
            <span className="block text-3xl font-extrabold text-slate-950 font-display tracking-tight">5,000+</span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">Visitors</span>
          </div>
        </div>
      </section>

      {/* 3. Latest Announcements Ticker */}
      {announcements.length > 0 && (
        <section id="announcements-ticker" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-slate-900 rounded-2xl text-slate-100 py-3.5 px-6 border border-slate-800 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.1)] flex items-center space-x-4 overflow-hidden">
            <span className="text-[10px] font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
              Announcements
            </span>
            <div className="w-full overflow-hidden whitespace-nowrap relative">
              <div className="inline-block animate-marquee text-xs font-medium tracking-wide">
                {announcements.map((ann, i) => (
                  <span key={ann.id} className="mr-12 text-slate-300 hover:text-indigo-400 transition-colors">
                    📢 <span className="font-bold text-white">{ann.title}</span>: {ann.content}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Featured Events (Horizontal Scroll) */}
      <section id="featured-events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-950">Featured Events</h2>
            <p className="text-sm text-slate-500 mt-1">Swipe or scroll horizontally to browse top items</p>
          </div>
          <button 
            onClick={() => onNavigate('events')} 
            className="text-xs font-semibold px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all duration-200 flex items-center space-x-1 cursor-pointer"
          >
            <span>All Events</span>
            <ArrowRight className="h-4 w-4 stroke-[2]" />
          </button>
        </div>

        {/* Horizontal scroll grid */}
        <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-200">
          {featuredEvents.map(event => (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.04)] min-w-[260px] sm:min-w-[300px] cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_25px_-5px_rgba(79,70,229,0.1)] transition-all duration-300 shrink-0"
            >
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide mb-4 ${
                event.category === 'stage' ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'
              }`}>
                {event.category === 'stage' ? 'Stage' : 'Off-Stage'}
              </span>
              <h3 className="font-display font-bold text-base text-slate-900 truncate tracking-tight">{event.name}</h3>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{event.date} • {event.time}</span>
              </p>
              <div className="mt-4 flex justify-between items-center text-xs border-t border-slate-100 pt-4">
                <span className="text-slate-500">Venue: <b className="text-slate-800 font-semibold">{event.venue}</b></span>
                <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">Details →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Stage Events Preview & Off-stage Events Preview */}
      <section id="event-previews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
        
        {/* Stage Events */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">✨</span>
              <span>Stage Events Preview</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {stagePreview.map(event => (
              <div 
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_15px_-2px_rgba(79,70,229,0.03)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex justify-between items-center"
              >
                <div>
                  <span className="text-xs text-slate-400">{event.date} • {event.venue}</span>
                  <h4 className="font-display font-semibold text-slate-900 mt-1">{event.name}</h4>
                </div>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg px-3 py-1.5">
                  {event.time}
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate('events')} 
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 text-xs font-semibold rounded-xl transition duration-200 uppercase tracking-wider shadow-sm cursor-pointer"
          >
            View All Stage Events →
          </button>
        </div>

        {/* Off Stage Events */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center space-x-2">
              <span className="p-1.5 bg-violet-50 rounded-lg text-violet-600">🎨</span>
              <span>Off-Stage Events Preview</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {offstagePreview.map(event => (
              <div 
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_15px_-2px_rgba(79,70,229,0.03)] hover:shadow-[0_8px_25px_rgba(79,70,229,0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex justify-between items-center"
              >
                <div>
                  <span className="text-xs text-slate-400">{event.date} • {event.venue}</span>
                  <h4 className="font-display font-semibold text-slate-900 mt-1">{event.name}</h4>
                </div>
                <span className="text-xs font-semibold bg-violet-50 text-violet-600 rounded-lg px-3 py-1.5">
                  {event.time.split(' ')[0]} Sub
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate('events')} 
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-violet-600 text-xs font-semibold rounded-xl transition duration-200 uppercase tracking-wider shadow-sm cursor-pointer"
          >
            View All Off Stage Events →
          </button>
        </div>
      </section>

      {/* 6. Live Scoreboard Highlights */}
      <section id="scoreboard-preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-[0_4px_30px_-5px_rgba(79,70,229,0.05)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>LIVE HOUSE STANDINGS</span>
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-950 mt-2">Championship Scoreboard</h2>
            </div>
            <button 
              onClick={() => onNavigate('scoreboard')} 
              className="py-3 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-[0_4px_14px_0_rgba(79,70,229,0.25)] hover:shadow-[0_6px_20px_0_rgba(79,70,229,0.3)] hover:-translate-y-0.5 cursor-pointer"
            >
              <Trophy className="h-4 w-4 stroke-[2]" />
              <span>View Full Scoreboard</span>
            </button>
          </div>

          {/* 4 Houses Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {scoreboard.map((item, index) => {
              // Sort by points for position
              const sorted = [...scoreboard].sort((a, b) => b.totalPoints - a.totalPoints);
              const rank = sorted.findIndex(s => s.house === item.house) + 1;
              return (
                <div 
                  key={item.house}
                  className={`rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${getHouseColorCard(item.house)}`}
                >
                  {/* Ranking Watermark */}
                  <span className="absolute right-4 top-2 text-7xl font-display font-extrabold opacity-10 select-none">
                    #{rank}
                  </span>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`w-3.5 h-3.5 rounded-full ${getHouseTextBadge(item.house)}`}></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {item.house} House
                    </span>
                  </div>

                  <span className="text-4xl font-extrabold font-display block tracking-tight text-slate-950">
                    {item.totalPoints.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-3">
                    Points • Updated: {new Date(item.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Gallery Preview */}
      <section id="gallery-preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-950">Festival Photo Highlights</h2>
            <p className="text-sm text-slate-500 mt-1">Memories captured from Darussalma Academy Nandi campus</p>
          </div>
          <button 
            onClick={() => onNavigate('gallery')} 
            className="text-xs font-semibold px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all duration-200 flex items-center space-x-1 cursor-pointer"
          >
            <Camera className="h-4 w-4 stroke-[2]" />
            <span>Explore Gallery</span>
          </button>
        </div>

        {/* Beautiful Masonry-like grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {gallery.slice(0, 4).map((img, i) => (
            <div 
              key={img.id} 
              className="h-56 rounded-2xl border border-slate-100 shadow-[0_4px_15px_-2px_rgba(79,70,229,0.03)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.1)] hover:-translate-y-1 transition-all duration-300 overflow-hidden relative group cursor-pointer bg-white" 
              onClick={() => onNavigate('gallery')}
            >
              <img 
                src={img.imageUrl} 
                alt={img.caption} 
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 p-3.5 flex items-center justify-between">
                <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">
                  {img.category}
                </span>
                <p className="text-slate-800 text-xs font-semibold truncate ml-2 max-w-[120px]">{img.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Sponsors logos Grid */}
      <section id="sponsors-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-b border-slate-200/80 text-center space-y-5 bg-white rounded-3xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] relative z-10">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">Our Proud Partners</span>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center font-sans font-bold text-xs uppercase tracking-wider text-slate-400">
          <div className="hover:text-indigo-600 transition-colors cursor-default">[ Intellect ]</div>
          <div className="hover:text-indigo-600 transition-colors cursor-default">[ Campus ]</div>
          <div className="hover:text-indigo-600 transition-colors cursor-default">[ Allied ]</div>
          <div className="hover:text-indigo-600 transition-colors cursor-default">[ Pinnacle ]</div>
          <div className="hover:text-indigo-600 transition-colors cursor-default">[ Crescent ]</div>
          <div className="hover:text-indigo-600 transition-colors cursor-default">[ Atlas ]</div>
        </div>
      </section>

      {/* 9. Testimonials Slider */}
      <section id="testimonials" className="max-w-3xl mx-auto px-4 text-center space-y-8 relative z-10">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-950">Student Testimonials</h2>
          <p className="text-sm text-slate-500 mt-1">What our stars say about Darussalma Arts Fest</p>
        </div>
        
        <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-[0_4px_25px_-5px_rgba(79,70,229,0.05)] relative min-h-[180px] flex flex-col justify-center overflow-hidden">
          {/* Quotes Icon Background Overlay */}
          <Quote className="absolute top-4 left-6 h-12 w-12 text-indigo-50/70 pointer-events-none select-none" />
          
          <p className="text-sm text-slate-700 leading-relaxed font-normal relative z-10">
            "{testimonials[testimonialIndex].text}"
          </p>
          <div className="mt-5 relative z-10">
            <span className="block text-sm font-bold text-slate-950">{testimonials[testimonialIndex].author}</span>
            <span className="block text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">{testimonials[testimonialIndex].grade}</span>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center space-x-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setTestimonialIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all cursor-pointer ${
                testimonialIndex === i ? 'bg-indigo-600 w-6' : 'bg-slate-200'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 10. FAQs */}
      <section id="faqs" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        <div className="text-center">
          <h2 className="font-display text-2xl font-extrabold text-slate-950">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider">Quick help regarding registration, houses, and certificates</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-100 bg-white rounded-2xl overflow-hidden shadow-[0_4px_15px_-2px_rgba(79,70,229,0.02)]">
              <button
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full flex justify-between items-center p-5 text-left font-semibold text-sm text-slate-800 hover:text-indigo-600 hover:bg-slate-50/50 transition duration-200 cursor-pointer"
              >
                <span>{faq.q}</span>
                {faqOpen === idx ? <ChevronUp className="h-4 w-4 stroke-[2] text-indigo-500" /> : <ChevronDown className="h-4 w-4 stroke-[2] text-slate-400" />}
              </button>
              {faqOpen === idx && (
                <div className="p-5 pt-1 text-sm text-slate-600 border-t border-slate-50 bg-slate-50/30 font-sans leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

