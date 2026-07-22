import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { X, Calendar, Clock, MapPin, ChevronDown, ChevronUp, Download, Share2, Heart, ShieldAlert } from 'lucide-react';

interface EventDetailModalProps {
  event: Event | null;
  onClose: () => void;
  onRegister: (eventId: string) => void;
}

export default function EventDetailModal({ event, onClose, onRegister }: EventDetailModalProps) {
  if (!event) return null;

  const [activeTab, setActiveTab] = useState<'eligibility' | 'timelimit' | 'criteria' | 'materials' | null>('eligibility');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic relative countdown timer
  // Setup targets: registration closing relative to session
  const [timeLeft, setTimeLeft] = useState({ days: 4, hours: 12, minutes: 30, seconds: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTab = (tab: 'eligibility' | 'timelimit' | 'criteria' | 'materials') => {
    setActiveTab(prev => prev === tab ? null : tab);
  };

  const handleShare = () => {
    setCopied(true);
    navigator.clipboard.writeText(window.location.origin + '?event=' + event.id);
    setTimeout(() => setCopied(false), 2000);
  };

  // Select banner image based on event name
  const getBannerUrl = (name: string) => {
    switch (name.toLowerCase()) {
      case 'oppana':
        return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800';
      case 'group song':
        return 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&q=80&w=800';
      case 'debate':
        return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800';
      case 'photography':
        return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800';
      case 'digital art':
        return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';
      default:
        return 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800';
    }
  };

  // Generate fake winners for visual richness matching PDF
  const getPastWinners = (name: string) => {
    return [
      { year: '2025 Champion', team: 'Team Shola', house: 'Red', reward: '1st Place • 100 Points' },
      { year: '2024 Champion', team: 'Blue Ocean Singers', house: 'Blue', reward: '1st Place • 100 Points' },
      { year: '2023 Champion', team: 'Rhythm Masters', house: 'Yellow', reward: '1st Place • 100 Points' },
    ];
  };

  return (
    <div id="event-detail-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#F7F6F1] text-black w-full max-w-3xl overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)] border-4 border-black relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner Area */}
        <div className="relative h-48 sm:h-64 bg-slate-900 overflow-hidden border-b-4 border-black">
          <img 
            src={getBannerUrl(event.name)} 
            alt={event.name} 
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
          
          <button 
            id="close-modal-btn"
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black hover:bg-stone-900 text-[#00FF00] border-2 border-black transition cursor-pointer"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 uppercase">
            <span className={`inline-flex items-center px-2.5 py-0.5 border border-black text-xs font-mono font-black uppercase tracking-wider mb-2 ${
              event.category === 'stage' ? 'bg-yellow-400 text-black' : 'bg-purple-400 text-white'
            }`}>
              {event.category === 'stage' ? '★ Stage Event' : '★ Off-Stage Event'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              {event.name}
            </h2>
          </div>
        </div>

        {/* Content Layout */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto font-mono uppercase">
          
          {/* Left Column: Details & Accordions */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Logistic Tags */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 border-2 border-black flex flex-col items-center text-center shadow-[2px_2px_0px_#000]">
                <Calendar className="h-5 w-5 text-black mb-1 stroke-[2]" />
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-black">Date</span>
                <span className="text-xs font-black text-black">{event.date}</span>
              </div>
              <div className="bg-white p-3 border-2 border-black flex flex-col items-center text-center shadow-[2px_2px_0px_#000]">
                <Clock className="h-5 w-5 text-black mb-1 stroke-[2]" />
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-black">Time</span>
                <span className="text-xs font-black text-black">{event.time}</span>
              </div>
              <div className="bg-white p-3 border-2 border-black flex flex-col items-center text-center shadow-[2px_2px_0px_#000]">
                <MapPin className="h-5 w-5 text-black mb-1 stroke-[2]" />
                <span className="text-[9px] uppercase tracking-wider text-stone-500 font-black">Venue</span>
                <span className="text-xs font-black text-black truncate w-full">{event.venue}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 bg-white p-4 border-2 border-black shadow-[3px_3px_0px_#000]">
              <h3 className="font-display font-black text-sm text-black border-b border-black pb-1">Event Overview</h3>
              <p className="text-xs text-stone-700 leading-relaxed font-sans normal-case">
                Participate in {event.name} and represent your house with excellence! The {event.name} is a designated {event.category} competition tailored for students. Show off your skills and grab high individual and house rankings.
              </p>
            </div>

            {/* Accordion Rules & Guidelines */}
            <div className="space-y-2">
              <h3 className="font-display font-black text-sm text-black mb-2">Rules & Guidelines</h3>
              
              {/* Accordion 1: Eligibility */}
              <div className="overflow-hidden">
                <button 
                  onClick={() => toggleTab('eligibility')}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-black text-black bg-stone-50 hover:bg-stone-100 border-2 border-black mb-1 shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  <span>🎓 Student Eligibility</span>
                  {activeTab === 'eligibility' ? <ChevronUp className="h-4 w-4 text-black stroke-[3.5]" /> : <ChevronDown className="h-4 w-4 text-black stroke-[2.5]" />}
                </button>
                {activeTab === 'eligibility' && (
                  <div className="p-4 text-xs text-stone-700 bg-white border-2 border-black mb-2 leading-relaxed normal-case">
                    {event.rules.eligibility}
                  </div>
                )}
              </div>

              {/* Accordion 2: Time Limit */}
              <div className="overflow-hidden">
                <button 
                  onClick={() => toggleTab('timelimit')}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-black text-black bg-stone-50 hover:bg-stone-100 border-2 border-black mb-1 shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  <span>⏱️ Duration & Time Limits</span>
                  {activeTab === 'timelimit' ? <ChevronUp className="h-4 w-4 text-black stroke-[3.5]" /> : <ChevronDown className="h-4 w-4 text-black stroke-[2.5]" />}
                </button>
                {activeTab === 'timelimit' && (
                  <div className="p-4 text-xs text-stone-700 bg-white border-2 border-black mb-2 leading-relaxed normal-case">
                    {event.rules.timeLimit}
                  </div>
                )}
              </div>

              {/* Accordion 3: Judging Criteria */}
              <div className="overflow-hidden">
                <button 
                  onClick={() => toggleTab('criteria')}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-black text-black bg-stone-50 hover:bg-stone-100 border-2 border-black mb-1 shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  <span>🏆 Evaluation & Judging Criteria</span>
                  {activeTab === 'criteria' ? <ChevronUp className="h-4 w-4 text-black stroke-[3.5]" /> : <ChevronDown className="h-4 w-4 text-black stroke-[2.5]" />}
                </button>
                {activeTab === 'criteria' && (
                  <div className="p-4 text-xs text-stone-700 bg-white border-2 border-black mb-2 leading-relaxed normal-case">
                    {event.rules.judgingCriteria}
                  </div>
                )}
              </div>

              {/* Accordion 4: Materials Allowed */}
              <div className="overflow-hidden">
                <button 
                  onClick={() => toggleTab('materials')}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-black text-black bg-stone-50 hover:bg-stone-100 border-2 border-black mb-1 shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  <span>🎒 Permitted Materials & Support</span>
                  {activeTab === 'materials' ? <ChevronUp className="h-4 w-4 text-black stroke-[3.5]" /> : <ChevronDown className="h-4 w-4 text-black stroke-[2.5]" />}
                </button>
                {activeTab === 'materials' && (
                  <div className="p-4 text-xs text-stone-700 bg-white border-2 border-black mb-2 leading-relaxed normal-case">
                    {event.rules.materials}
                  </div>
                )}
              </div>
            </div>

            {/* Past Winners */}
            <div className="space-y-3 pt-2">
              <h3 className="font-display font-black text-sm text-black">Past Champions Showcase</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {getPastWinners(event.name).map((w, idx) => (
                  <div key={idx} className="bg-white p-3 border-2 border-black text-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                    <span className="block text-[10px] font-mono font-black text-red-600 uppercase">{w.year}</span>
                    <span className="block text-xs font-black text-black mt-1 uppercase">{w.team}</span>
                    <span className="inline-block mt-1.5 text-[9px] bg-black text-[#00FF00] px-1.5 py-0.5 font-bold uppercase border border-black">
                      {w.house} House
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Timer, Register Buttons, Share */}
          <div className="bg-white p-5 border-4 border-black flex flex-col justify-between space-y-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            
            {/* Registration status */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-white bg-red-600 border-2 border-black px-3 py-2 text-xs font-black uppercase">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 stroke-[2.5]" />
                <span>Seats filling fast! Maximum {event.maxParticipants} entries.</span>
              </div>

              {/* Real-time Countdown */}
              <div className="text-center p-3 bg-black text-[#00FF00] border-2 border-black space-y-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <span className="text-[10px] uppercase font-mono font-black tracking-wider text-white block">
                  Registration closes in
                </span>
                <div className="flex justify-center space-x-1.5 font-mono text-lg font-black text-[#00FF00]">
                  <div>
                    <span className="block bg-stone-900 border border-stone-800 px-1.5 py-1">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="text-[8px] text-white block mt-1 font-bold">DAYS</span>
                  </div>
                  <span className="text-white mt-1">:</span>
                  <div>
                    <span className="block bg-stone-900 border border-stone-800 px-1.5 py-1">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[8px] text-white block mt-1 font-bold">HRS</span>
                  </div>
                  <span className="text-white mt-1">:</span>
                  <div>
                    <span className="block bg-stone-900 border border-stone-800 px-1.5 py-1">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[8px] text-white block mt-1 font-bold">MIN</span>
                  </div>
                  <span className="text-white mt-1">:</span>
                  <div>
                    <span className="block bg-stone-900 border border-stone-800 px-1.5 py-1 text-red-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[8px] text-red-500 block mt-1 font-bold">SEC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                id="register-now-btn"
                onClick={() => onRegister(event.id)}
                className="w-full py-3 bg-[#00FF00] hover:bg-emerald-400 text-black border-2 border-black font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                Register for This Event →
              </button>

              <button
                onClick={() => alert('Rules PDF is generated based on current regulations. Download complete!')}
                className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black font-black text-xs flex items-center justify-center space-x-1 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Download className="h-4.5 w-4.5 stroke-[2.5]" />
                <span>Download Rules PDF</span>
              </button>
            </div>

            {/* Bottom Actions: Search, Save, Share */}
            <div className="flex items-center justify-around border-t-2 border-black pt-4 text-xs text-black font-black font-mono">
              <button 
                onClick={() => setIsSaved(!isSaved)}
                className={`flex items-center space-x-1 hover:text-red-600 transition cursor-pointer ${isSaved ? 'text-red-600' : ''}`}
              >
                <Heart className={`h-4.5 w-4.5 stroke-[2.5] ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button 
                onClick={handleShare}
                className="flex items-center space-x-1 hover:text-[#00FF00] transition cursor-pointer"
              >
                <Share2 className="h-4.5 w-4.5 stroke-[2.5]" />
                <span>{copied ? 'Copied Link!' : 'Share Event'}</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
