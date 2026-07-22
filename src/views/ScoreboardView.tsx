import React, { useState, useEffect } from 'react';
import { HouseScore, IndividualRanking, RecentWinnerFeedItem, Event, ScoreboardTeam, ScoreHistory } from '../types';
import { Trophy, ArrowUp, ArrowDown, Minus, Clock, RefreshCw, Sparkles, Flame, User, Calendar, MapPin } from 'lucide-react';

interface ScoreboardViewProps {
  scoreboard: HouseScore[];
  individualRankings: IndividualRanking[];
  recentWinners: RecentWinnerFeedItem[];
  events: Event[];
  onAddLog?: (log: any) => void;
}

export default function ScoreboardView({
  scoreboard,
  individualRankings,
  recentWinners,
  events
}: ScoreboardViewProps) {
  // Setup tabs for event-wise breakdown
  const [activeTab, setActiveTab] = useState<'stage' | 'off_stage'>('stage');
  const [lastAutoUpdate, setLastAutoUpdate] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  // Live Database states
  const [liveTeams, setLiveTeams] = useState<ScoreboardTeam[]>([]);
  const [liveHistory, setLiveHistory] = useState<ScoreHistory[]>([]);

  // Function to load actual live database entries
  const fetchLiveScoreboardData = async () => {
    try {
      setIsUpdating(true);
      const res = await fetch('/api/scoreboard/live');
      if (res.ok) {
        const data = await res.json();
        setLiveTeams(data || []);
      }
      
      const histRes = await fetch('/api/scoreboard/history');
      if (histRes.ok) {
        const histData = await histRes.json();
        setLiveHistory(histData || []);
      }
      
      setLastAutoUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch live scoreboard standings:', err);
    } finally {
      setTimeout(() => setIsUpdating(false), 800);
    }
  };

  // Snappy background ticker matching prompt requirements: "updates and refreshes automatically"
  useEffect(() => {
    fetchLiveScoreboardData();
    const interval = setInterval(() => {
      fetchLiveScoreboardData();
    }, 5000); // 5-second polling for dynamic live response
    return () => clearInterval(interval);
  }, []);

  // Filter events for breakdown status
  const ongoingEvents = events.filter(e => e.status === 'open' && e.category === activeTab).slice(0, 2);
  const completedEvents = events.filter(e => e.status === 'results_published' && e.category === activeTab).slice(0, 2);
  const upcomingEvents = events.filter(e => e.status !== 'results_published' && e.status !== 'completed' && e.category === activeTab).slice(2, 4);

  const getHouseColorHex = (house: string) => {
    switch (house.toLowerCase()) {
      case 'red':
      case 'team a': return '#EF4444'; // rose-500
      case 'blue':
      case 'team b': return '#3B82F6'; // blue-500
      case 'green':
      case 'team c': return '#10B981'; // emerald-500
      case 'yellow': return '#F59E0B'; // amber-500
      default: return '#64748B'; // slate-500
    }
  };

  const getHouseBgClass = (house: string) => {
    switch (house.toLowerCase()) {
      case 'red':
      case 'team a': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'blue':
      case 'team b': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'green':
      case 'team c': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'yellow': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const renderTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />;
      case 'down': return <ArrowDown className="h-3.5 w-3.5 text-rose-500 stroke-[3]" />;
      case 'same': return <Minus className="h-3.5 w-3.5 text-slate-400 stroke-[3]" />;
    }
  };

  // Map to unified display structures
  const sortedScoreboard = [...scoreboard].sort((a, b) => b.totalPoints - a.totalPoints);

  const displayedStandings = liveTeams.length > 0
    ? liveTeams.map(t => ({
        id: t.id,
        name: t.teamName,
        color: t.teamColor,
        logo: t.teamLogo,
        score: t.totalScore
      }))
    : sortedScoreboard.map(item => ({
        id: item.house,
        name: `${item.house} House`,
        color: getHouseColorHex(item.house),
        logo: null,
        score: item.totalPoints
      }));

  const displayedFeed = liveHistory.length > 0
    ? [...liveHistory].reverse().slice(0, 10).map((log, index) => {
        // Calculate a nice friendly relative time string
        const diffMs = Date.now() - new Date(log.createdAt).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const timeAgoStr = (() => {
          if (diffMins < 1) return 'Just now';
          if (diffMins === 1) return '1m ago';
          if (diffMins < 60) return `${diffMins}m ago`;
          const diffHrs = Math.floor(diffMins / 60);
          if (diffHrs === 1) return '1h ago';
          if (diffHrs < 24) return `${diffHrs}h ago`;
          return new Date(log.createdAt).toLocaleDateString();
        })();

        // Match matching team color if found
        const matchingTeam = liveTeams.find(t => t.id === log.teamId || t.teamName.toLowerCase() === log.teamName.toLowerCase());
        const color = matchingTeam ? matchingTeam.teamColor : '#4F46E5';

        return {
          id: log.id || String(index),
          eventName: log.reason || 'Manual Adjustment',
          timeAgo: timeAgoStr,
          teamOrStudentName: log.teamName,
          pointsAdded: log.scoreChange,
          color: color
        };
      })
    : recentWinners.map(feed => ({
        id: feed.id,
        eventName: feed.eventName,
        timeAgo: feed.timeAgo,
        teamOrStudentName: feed.teamOrStudentName,
        pointsAdded: feed.pointsAdded,
        color: getHouseColorHex(feed.house)
      }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen bg-[#F8FAFC]">
      
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-[0_4px_25px_-5px_rgba(79,70,229,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 blur-2xl rounded-full pointer-events-none" />
        <div>
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center space-x-1.5">
            <Flame className="h-4 w-4 animate-pulse" />
            <span>Championship Live Standings</span>
          </span>
          <h1 className="font-display text-3xl font-extrabold text-slate-950 mt-1.5 tracking-tight">
            House Championship Scoreboard
          </h1>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-full">
          <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>Updates live • Last synced: {lastAutoUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Standings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedStandings.map((item, index) => {
          const rank = index + 1;
          const isWinner = rank === 1;
          const bgCardClasses = () => {
            if (isWinner) return 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.3)] border-transparent';
            return 'bg-white text-slate-900 border-slate-200/80 shadow-[0_4px_15px_-2px_rgba(79,70,229,0.03)]';
          };

          const rankBadgeClasses = () => {
            if (isWinner) return 'bg-white/20 text-white border-transparent';
            if (rank === 2) return 'bg-amber-50 text-amber-700 border-amber-100';
            if (rank === 3) return 'bg-slate-100 text-slate-600 border-slate-200';
            return 'bg-slate-50 text-slate-500 border-slate-100';
          };

          return (
            <div 
              key={item.id}
              className={`p-6 border rounded-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-48 ${bgCardClasses()}`}
            >
              <div className="flex justify-between items-start">
                <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold tracking-wider uppercase ${rankBadgeClasses()}`}>
                  RANK #{rank}
                </span>
                {isWinner && (
                  <Sparkles className="h-5 w-5 text-amber-300 animate-bounce" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2.5 mt-3">
                  {item.logo ? (
                    <img src={item.logo} alt={item.name} className="h-8 w-8 rounded-xl object-cover border border-slate-100 bg-slate-50" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  )}
                  <h3 className="font-display font-bold text-lg tracking-tight uppercase">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-4xl font-extrabold tracking-tight font-sans">
                    {item.score.toLocaleString()}
                  </span>
                  <span className={`text-[10px] uppercase font-semibold tracking-wider ${isWinner ? 'text-indigo-100/80' : 'text-slate-400'}`}>
                    points
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Table and Winners Sidebar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8-cols: Live Individual Rankings */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
              Live Individual Rankings
            </h2>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full uppercase">
              Top Performers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 font-sans text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">Rank</th>
                  <th className="py-3">Student Name</th>
                  <th className="py-3">House</th>
                  <th className="py-3 text-center">Events</th>
                  <th className="py-3 text-right">Points</th>
                  <th className="py-3 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-700">
                {individualRankings.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/70 transition-all">
                    <td className="py-4 px-2 font-bold text-slate-900">
                      #{student.rank}
                    </td>
                    <td className="py-4 font-bold text-slate-800 uppercase">
                      {student.name}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase ${getHouseBgClass(student.house)}`}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getHouseColorHex(student.house) }} />
                        <span>{student.house}</span>
                      </span>
                    </td>
                    <td className="py-4 text-center font-semibold text-slate-600">
                      {student.eventsCount}
                    </td>
                    <td className="py-4 text-right font-bold text-slate-950">
                      {student.points}
                    </td>
                    <td className="py-4 text-center flex justify-center pt-5">
                      {renderTrendIcon(student.trend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4-cols: Recent Winners Live Sidebar */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="font-display font-bold text-slate-900 flex items-center space-x-2 tracking-tight">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>Recent Updates • LIVE</span>
              </h2>
            </div>

            {/* Vertical scrolling feed list */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {displayedFeed.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic text-xs">
                  No points adjusted yet.
                </div>
              ) : (
                displayedFeed.map((feed) => (
                  <div 
                    key={feed.id} 
                    className="bg-slate-50/50 hover:bg-slate-50 p-4 border border-slate-100 rounded-xl flex flex-col justify-between space-y-2.5 relative transition-all duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider bg-indigo-50 px-2 py-0.5 rounded truncate max-w-[150px]" title={feed.eventName}>
                        {feed.eventName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {feed.timeAgo}
                      </span>
                    </div>
                    
                    <span className="text-xs font-bold text-slate-800 leading-tight block uppercase">
                      {feed.teamOrStudentName}
                    </span>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 text-[10px] font-bold uppercase">
                      <span className="inline-flex items-center px-2 py-0.5 border border-slate-200/60 rounded-full text-slate-600 bg-white">
                        <span className="h-1.5 w-1.5 rounded-full mr-1" style={{ backgroundColor: feed.color }} />
                        STANDINGS FEED
                      </span>
                      <span className={feed.pointsAdded > 0 ? 'text-emerald-600 font-extrabold' : 'text-rose-500 font-extrabold'}>
                        {feed.pointsAdded > 0 ? `+${feed.pointsAdded}` : feed.pointsAdded} PTS
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-semibold uppercase text-center pt-3 border-t border-slate-100 flex items-center justify-center space-x-1.5">
            <Clock className="h-3 w-3 animate-spin" />
            <span>Auto-updating live feed active</span>
          </div>
        </div>

      </div>

      {/* Event-wise Status Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
            Event-wise Live Breakdown
          </h2>
          
          {/* Subcategory toggler */}
          <div className="flex bg-slate-50 p-1 border border-slate-200/50 rounded-lg">
            <button
              onClick={() => setActiveTab('stage')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'stage' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Stage Events
            </button>
            <button
              onClick={() => setActiveTab('off_stage')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'off_stage' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Off Stage
            </button>
          </div>
        </div>

        {/* Breakdown grids: Completed, Ongoing, Upcoming */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Completed block */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 block w-fit">
              Completed
            </span>
            {completedEvents.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium italic">No completed events yet in this category.</p>
            ) : (
              completedEvents.map(e => (
                <div key={e.id} className="bg-slate-50/50 p-4 border border-slate-100/80 rounded-xl space-y-2 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                  <span className="text-xs font-bold text-slate-800 block truncate uppercase">{e.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium block">JUDGED AT: {e.venue.toUpperCase()}</span>
                  <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-100 pt-2 text-emerald-600">
                    <span>RESULTS PUBLISHED</span>
                    <span>✓ COMPLETE</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ongoing block */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100 block w-fit">
              Ongoing
            </span>
            {ongoingEvents.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium italic">No active events currently running.</p>
            ) : (
              ongoingEvents.map(e => (
                <div key={e.id} className="bg-slate-50/50 p-4 border border-slate-100/80 rounded-xl space-y-2 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                  <span className="text-xs font-bold text-slate-800 block truncate uppercase">{e.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium block">ACTIVE AT: {e.venue.toUpperCase()}</span>
                  <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-100 pt-2 text-blue-600">
                    <span className="flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-ping" />
                      <span>JUDGING IN PROGRESS...</span>
                    </span>
                    <span>TBA</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Upcoming block */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-100 block w-fit">
              Upcoming
            </span>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium italic">No upcoming events listed.</p>
            ) : (
              upcomingEvents.map(e => (
                <div key={e.id} className="bg-slate-50/50 p-4 border border-slate-100/80 rounded-xl space-y-2 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
                  <span className="text-xs font-bold text-slate-800 block truncate uppercase">{e.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium block">{e.date} • {e.time}</span>
                  <div className="flex justify-between items-center text-[10px] font-bold border-t border-slate-100 pt-2 text-amber-600">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>SCHEDULED</span>
                    </span>
                    <span>{e.venue.toUpperCase()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
