import React, { useState } from 'react';
import { Event } from '../types';
import { Search, Calendar, MapPin, SlidersHorizontal, Eye, Heart, Clock, Award } from 'lucide-react';

interface EventsViewProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  onRegister: (eventId: string) => void;
}

export default function EventsView({ events, onSelectEvent, onRegister }: EventsViewProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'stage' | 'off_stage'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [selectedProgramCategory, setSelectedProgramCategory] = useState<'all' | 'Sub-Junior' | 'Junior' | 'Senior' | 'General' | 'Group'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Unique venues list for filter
  const venues = ['all', ...Array.from(new Set(events.map(e => e.venue)))];

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesCategory = activeCategory === 'all' || event.category === activeCategory;
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVenue = selectedVenue === 'all' || event.venue === selectedVenue;
    const matchesProgramCategory = selectedProgramCategory === 'all' || event.programCategory === selectedProgramCategory;
    return matchesCategory && matchesSearch && matchesVenue && matchesProgramCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen bg-[#F8FAFC]">
      
      {/* Header Banner */}
      <div className="text-center space-y-3 bg-white border border-slate-200/85 p-8 sm:p-10 rounded-3xl shadow-[0_4px_25px_-5px_rgba(79,70,229,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 blur-2xl rounded-full pointer-events-none" />
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
          Festival <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Events Directory</span>
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto font-normal">
          Explore our wide selection of 46+ stage and off-stage competitions scheduled for Darussalma Nandi Arts Fest 2026.
        </p>
      </div>

      {/* Category Selection Tabs */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto font-sans">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-5 py-2.5 rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer ${
            activeCategory === 'all' 
              ? 'bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)]' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>
        <button
          onClick={() => setActiveCategory('stage')}
          className={`px-5 py-2.5 rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer ${
            activeCategory === 'stage' 
              ? 'bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)]' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Stage Events
        </button>
        <button
          onClick={() => setActiveCategory('off_stage')}
          className={`px-5 py-2.5 rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer ${
            activeCategory === 'off_stage' 
              ? 'bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)]' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Off-Stage Events
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search Field */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search events, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-sans font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-4 justify-end">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Venue:</span>
            </div>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {venues.map(v => (
                <option key={v} value={v}>
                  {v === 'all' ? 'All Venues' : v.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Program:</span>
            </div>
            <select
              value={selectedProgramCategory}
              onChange={(e) => setSelectedProgramCategory(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Programs</option>
              <option value="Sub-Junior">Sub-Junior</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="General">General</option>
              <option value="Group">Group</option>
            </select>
          </div>
        </div>

      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] space-y-3">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-xl">🔍</div>
          <h3 className="font-display font-bold text-slate-900 uppercase text-base">No events matched your search</h3>
          <p className="text-xs text-slate-400 font-medium">Try checking your spelling or changing the filters above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvents.map(event => {
            const isFav = favorites.includes(event.id);
            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_15px_-2px_rgba(79,70,229,0.03)] hover:shadow-[0_12px_25px_-5px_rgba(79,70,229,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between group"
              >
                
                {/* Visual Top Bar */}
                <div className="p-5 pb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        event.category === 'stage' ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'
                      }`}>
                        {event.category === 'stage' ? 'Stage' : 'Off-Stage'}
                      </span>
                      {event.programCategory && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-100">
                          {event.programCategory}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(event.id, e)}
                      className={`p-2 rounded-full border transition shrink-0 cursor-pointer ${
                        isFav 
                          ? 'bg-rose-50 border-rose-200 text-rose-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="font-display font-bold text-slate-900 mt-4 leading-snug group-hover:text-indigo-600 transition-colors">
                    {event.name}
                  </h3>
                </div>

                {/* Details Section */}
                <div className="px-5 py-4 bg-slate-50/50 border-t border-b border-slate-100 space-y-2.5 text-xs font-medium text-slate-500">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{event.date} • {event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate uppercase">{event.venue}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 px-5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Slots: <b className="text-slate-800 font-bold">{event.maxParticipants}</b>
                  </span>
                  <div className="flex items-center space-x-1 text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-lg font-semibold transition-colors">
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Rules</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

