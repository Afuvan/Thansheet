import React, { useState, useEffect } from 'react';
import { Event, Student, User } from '../types';
import { Award, Lock, User as UserIcon, Calendar, Check, CheckCircle2, AlertTriangle, ShieldCheck, CreditCard, Smartphone, Search, Sparkles, Layers, UserCheck, ChevronRight, Fingerprint, Users } from 'lucide-react';

interface RegistrationWizardProps {
  events: Event[];
  currentUser: User | null;
  studentProfile: Student | null;
  onNavigate: (view: string) => void;
  onLogin: (credentials: any) => Promise<any>;
  onRegisterUser: (details: any) => Promise<any>;
  onSaveProfile: (profile: any) => Promise<Student>;
  onSelectHouse: (studentId: string, house: string) => Promise<Student>;
  onSubmitRegistrations: (studentId: string, eventIds: string[]) => Promise<any>;
  onCompletePayment: (studentId: string, confirmCode: string) => Promise<any>;
}

export default function RegistrationWizard({
  events,
  currentUser,
  studentProfile,
  onNavigate,
  onLogin,
  onRegisterUser,
  onSaveProfile,
  onSelectHouse,
  onSubmitRegistrations,
  onCompletePayment
}: RegistrationWizardProps) {
  
  // Track wizard steps (1 to 7)
  const [step, setStep] = useState(1);

  // Student profile lists for quick login options
  const [studentProfiles, setStudentProfiles] = useState<Student[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [groupingMode, setGroupingMode] = useState<'class' | 'house' | 'group'>('house');
  const [searchQuery, setSearchQuery] = useState('');
  const [loginTab, setLoginTab] = useState<'quick' | 'credentials'>('quick');

  const [groups, setGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [scoreboardTeams, setScoreboardTeams] = useState<any[]>([]);

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/groups');
        if (res.ok) {
          const data = await res.json();
          setGroups(data || []);
        }
      } catch (err) {
        console.error('Failed to load groups in wizard:', err);
      }
    };
    fetchGroups();
  }, []);

  // Fetch scoreboard teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/scoreboard/teams');
        if (res.ok) {
          const data = await res.json();
          setScoreboardTeams(data || []);
        }
      } catch (err) {
        console.error('Failed to load scoreboard teams:', err);
      }
    };
    fetchTeams();
  }, []);

  // Load profiles from DB on mount
  useEffect(() => {
    const fetchProfiles = async () => {
      setProfilesLoading(true);
      try {
        const res = await fetch('/api/admin/students');
        if (res.ok) {
          const data = await res.json();
          setStudentProfiles(data || []);
        }
      } catch (err) {
        console.error('Failed to load student profiles:', err);
      } finally {
        setProfilesLoading(false);
      }
    };
    fetchProfiles();
  }, [currentUser]);

  // Auth form states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Profile form states
  const [name, setName] = useState('');
  const [className, setClassName] = useState('1'); // Dropdown: 1 to 10
  const [category, setCategory] = useState<'Sub-Junior' | 'Junior' | 'Senior'>('Sub-Junior');
  const [team, setTeam] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState('');

  // Events multi-select
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [conflictError, setConflictError] = useState('');

  // Registration summaries
  const [confirmationCode, setConfirmationCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Prefill states when currentUser or studentProfile updates
  useEffect(() => {
    if (currentUser) {
      if (studentProfile) {
        // If they already have a completed profile, skip step 2
        setName(studentProfile.name);
        setClassName(studentProfile.class || '1');
        setCategory(studentProfile.category || 'Sub-Junior');
        setTeam(studentProfile.house || (scoreboardTeams[0]?.teamName || 'Team A'));
        setPhotoBase64(studentProfile.photo || '');
        setStep(3); // Go straight to Events selection (now Step 3)
      } else {
        setStep(2); // Complete profile
      }
    } else {
      setStep(1); // Auth
    }
  }, [currentUser, studentProfile, scoreboardTeams]);

  useEffect(() => {
    if (scoreboardTeams.length > 0 && !team) {
      setTeam(scoreboardTeams[0].teamName);
    }
  }, [scoreboardTeams, team]);

  // Auth submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      if (isLogin) {
        await onLogin({ email, password });
      } else {
        await onRegisterUser({ email, password, role: 'student' });
        setIsLogin(true);
        setAuthSuccess('Account created successfully! Please log in with your credentials.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please try again.');
    }
  };

  // Profile submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !className || !category || !team) return;

    try {
      await onSaveProfile({
        userId: currentUser!.id,
        name,
        class: className,
        category,
        house: team,
        photo: photoBase64
      });
      // Automatically shifts to Events selection (Step 3)
      setStep(3);
    } catch (err) {
      console.error(err);
    }
  };



  // Handle Event selection toggle
  const handleToggleEvent = (eventId: string) => {
    setConflictError('');
    setSelectedEventIds(prev => {
      const isSelected = prev.includes(eventId);
      if (isSelected) {
        return prev.filter(id => id !== eventId);
      } else {
        if (prev.length >= 5) {
          setConflictError('Maximum 5 events can be registered per student!');
          return prev;
        }

        // Optional conflict verification: checking same date / time
        const eventToAdd = events.find(e => e.id === eventId);
        const hasConflict = prev.some(id => {
          const existing = events.find(e => e.id === id);
          return existing && eventToAdd && existing.date === eventToAdd.date && existing.time === eventToAdd.time;
        });

        if (hasConflict) {
          setConflictError('Time conflict detected! Multiple events scheduled at the same time.');
          return prev;
        }

        return [...prev, eventId];
      }
    });
  };

  // Submit events selection
  const handleEventsSubmit = async () => {
    if (selectedEventIds.length === 0) {
      setConflictError('Please select at least 1 event to register!');
      return;
    }

    try {
      const data = await onSubmitRegistrations(studentProfile!.id, selectedEventIds);
      setConfirmationCode(data.confirmationNumber);
      setStep(4); // Move to Review & Confirm (Step 4 of 5)
    } catch (err) {
      console.error(err);
    }
  };



  // Convert uploaded files to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter student profiles based on searchQuery
  const filteredProfiles = studentProfiles.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      (p.studentId && p.studentId.toLowerCase().includes(query)) ||
      (p.class && p.class.toLowerCase().includes(query)) ||
      (p.house && p.house.toLowerCase().includes(query))
    );
  });

  // Group filtered studentProfiles based on groupingMode
  const getGroupedProfiles = () => {
    const groupsList: { [key: string]: Student[] } = {};
    filteredProfiles.forEach(p => {
      let groupKey = '';
      if (groupingMode === 'class') {
        groupKey = p.class || 'Unassigned Class';
      } else if (groupingMode === 'group') {
        groupKey = p.group ? `${p.group} Group` : 'Unassigned Age Group';
      } else {
        groupKey = `${p.house || 'Unassigned'} House`;
      }
      if (!groupsList[groupKey]) {
        groupsList[groupKey] = [];
      }
      groupsList[groupKey].push(p);
    });
    return groupsList;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 min-h-screen relative">
      {/* Background atmospheric blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-300/10 to-violet-300/10 blur-3xl rounded-full pointer-events-none -z-10" />
      
      {/* Step Indicators row (Corporate Trust style) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.06)] overflow-x-auto gap-3 flex justify-between items-center">
        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
          <div key={num} className="flex items-center space-x-2 shrink-0">
            <span className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step === num 
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-[0_4px_10px_rgba(79,70,229,0.3)] scale-110' 
                : step > num 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                  : 'bg-slate-50 text-slate-400 border border-slate-100'
            }`}>
              {step > num ? '✓' : num}
            </span>
            <span className={`text-[10px] font-sans uppercase tracking-wider font-bold hidden md:inline ${
              step === num ? 'text-indigo-600' : step > num ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              {num === 1 ? 'Login' : num === 2 ? 'Profile' : num === 3 ? 'House' : num === 4 ? 'Events' : num === 5 ? 'Confirm' : num === 6 ? 'Pay' : 'Success'}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: AUTHENTICATION */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-[0_4px_10px_rgba(79,70,229,0.1)] mb-1">
              <Fingerprint className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
              Student Portal Access
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Log in to manage your events, track results, and view your customized certificates.
            </p>
          </div>

          {/* Segment Toggle: Quick Profile Login vs Standard Credentials */}
          <div className="max-w-2xl mx-auto bg-slate-100/80 p-1.5 rounded-2xl flex border border-slate-200/50">
            <button
              onClick={() => {
                setLoginTab('quick');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
                loginTab === 'quick'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>One-Click Profile Switcher</span>
            </button>
            <button
              onClick={() => {
                setLoginTab('credentials');
                setAuthError('');
                setAuthSuccess('');
              }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
                loginTab === 'credentials'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Credentials Login</span>
            </button>
          </div>

          {authError && (
            <div className="max-w-2xl mx-auto text-xs text-rose-600 bg-rose-50 px-4 py-3 border border-rose-100 rounded-xl font-sans font-semibold flex items-center space-x-2 animate-pulse">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="max-w-2xl mx-auto text-xs text-emerald-700 bg-emerald-50 px-4 py-3 border border-emerald-100 rounded-xl font-sans font-semibold flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* TAB 1: QUICK PROFILE SWITCHER */}
          {loginTab === 'quick' && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(79,70,229,0.06)] space-y-6">
              
              {/* Profile search and grouping controls */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pb-4 border-b border-slate-100">
                <div className="relative w-full sm:max-w-xs">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search your profile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setGroupingMode('house')}
                    className={`px-3.5 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      groupingMode === 'house'
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Group by House
                  </button>
                  <button
                    onClick={() => setGroupingMode('class')}
                    className={`px-3.5 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      groupingMode === 'class'
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Group by Class
                  </button>
                  <button
                    onClick={() => setGroupingMode('group')}
                    className={`px-3.5 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      groupingMode === 'group'
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Group by Age Group
                  </button>
                </div>
              </div>

              {profilesLoading ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-slate-400">Fetching Student Directory...</p>
                </div>
              ) : studentProfiles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
                  <p>No student profiles found.</p>
                  <button 
                    onClick={() => setStep(2)} 
                    className="text-indigo-600 hover:underline font-bold"
                  >
                    Create a new profile instead
                  </button>
                </div>
              ) : (
                <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2">
                  {Object.keys(getGroupedProfiles()).sort().map(groupName => {
                    const profilesInGroup = getGroupedProfiles()[groupName];
                    if (profilesInGroup.length === 0) return null;
                    
                    return (
                      <div key={groupName} className="space-y-3">
                        {/* Group Header Name */}
                        <div className="flex items-center space-x-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${
                            groupName.toLowerCase().includes('red') ? 'bg-rose-500' :
                            groupName.toLowerCase().includes('blue') ? 'bg-blue-500' :
                            groupName.toLowerCase().includes('green') ? 'bg-emerald-500' :
                            groupName.toLowerCase().includes('yellow') ? 'bg-amber-400' : 'bg-indigo-500'
                          }`} />
                          <h4 className="font-display font-extrabold text-xs text-slate-800 tracking-wide uppercase">
                            {groupName}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            ({profilesInGroup.length})
                          </span>
                        </div>

                        {/* Profiles button list options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {profilesInGroup.map((p) => {
                            // Determine house color accents
                            const houseColor = 
                              p.house === 'Red' ? 'border-red-100 hover:border-red-400 hover:bg-red-50/20 text-rose-600 bg-red-500' :
                              p.house === 'Blue' ? 'border-blue-100 hover:border-blue-400 hover:bg-blue-50/20 text-indigo-600 bg-blue-500' :
                              p.house === 'Green' ? 'border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/20 text-emerald-600 bg-emerald-500' :
                              'border-amber-100 hover:border-amber-400 hover:bg-amber-50/20 text-amber-600 bg-amber-400';

                            return (
                              <button
                                key={p.id}
                                onClick={async () => {
                                  setAuthError('');
                                  try {
                                    setProfilesLoading(true);
                                    await onLogin({ studentId: p.id });
                                  } catch (err: any) {
                                    setAuthError(err?.message || 'Login failed.');
                                    setProfilesLoading(false);
                                  }
                                }}
                                className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-slate-50/40 hover:bg-white transition-all duration-300 flex items-center justify-between group shadow-xs hover:shadow-[0_4px_15px_rgba(79,70,229,0.08)] hover:-translate-y-0.5 cursor-pointer"
                              >
                                <div className="flex items-center space-x-3">
                                  {/* Profile Monogram */}
                                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${houseColor.split(' ').pop()}`}>
                                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  
                                  <div className="space-y-0.5">
                                    <span className="block text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                      {p.name}
                                    </span>
                                    <span className="block text-[10px] text-slate-400 font-mono font-semibold">
                                      {p.studentId} • {p.class}
                                    </span>
                                  </div>
                                </div>

                                <div className="p-1 bg-slate-100/80 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-slate-400">
                                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Instructions footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                <span>⚡ SELECT A PROFILE BUTTON TO LOG IN INSTANTLY</span>
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-indigo-600 hover:text-indigo-700 font-bold transition cursor-pointer"
                >
                  Create new student account Instead
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: CREDENTIALS LOGIN FORM */}
          {loginTab === 'credentials' && (
            <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(79,70,229,0.06)] space-y-6">
              
              <div className="text-center pb-2 border-b border-slate-100">
                <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                  {isLogin ? 'Sign In with Credentials' : 'Create New Account'}
                </h3>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="student@fest.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="student123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 cursor-pointer mt-2"
                >
                  {isLogin ? 'Log In ✓' : 'Sign Up ✓'}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold transition cursor-pointer"
                >
                  {isLogin ? "Need a new account? Create one here" : "Already registered? Log in with credentials"}
                </button>
              </div>

              {/* Quick helper badge */}
              {isLogin && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[10px] text-amber-800 font-sans font-medium leading-relaxed">
                  <span className="font-bold block uppercase text-[9px] text-amber-900 tracking-wide mb-1">💡 Sandbox credentials:</span>
                  <p>Email: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-100 text-amber-950 font-bold">student@fest.com</code> • Password: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-100 text-amber-950 font-bold">student123</code></p>
                  <p className="mt-1">Email: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-100 text-amber-950 font-bold">admin@fest.com</code> • Password: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-100 text-amber-950 font-bold">admin123</code></p>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* STEP 2: PROFILE CREATION */}
      {step === 2 && (
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-6 uppercase">
          <div className="border-b-4 border-black pb-3 flex items-center space-x-2">
            <UserIcon className="h-6 w-6 text-black stroke-[2.5]" />
            <h2 className="font-display font-black text-lg text-black">
              Complete Profile (Step 1 of 4)
            </h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-black text-black mb-1">Full Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Menon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border-2 border-black text-xs font-mono font-black uppercase focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-black text-black mb-1">Class / Grade</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border-2 border-black text-xs font-mono font-black uppercase focus:bg-white focus:outline-none"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-black text-black mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border-2 border-black text-xs font-mono font-black uppercase focus:bg-white focus:outline-none"
                >
                  <option value="Sub-Junior">Sub-Junior</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-black text-black mb-1">Team</label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border-2 border-black text-xs font-mono font-black uppercase focus:bg-white focus:outline-none"
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

            <div>
              <label className="block text-xs font-mono font-black text-black mb-1">Profile Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:text-xs file:font-mono file:font-black file:bg-[#00FF00] file:text-black hover:file:bg-emerald-400 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-black hover:bg-stone-900 text-[#00FF00] border-2 border-black font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Save & Choose Events →
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: EVENT MULTI-SELECT */}
      {step === 3 && (
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-6 uppercase">
          <div className="border-b-4 border-black pb-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="font-display font-black text-lg text-black">
                Choose Your Events (Step 2 of 4)
              </h2>
              <p className="text-xs text-stone-500 font-mono font-bold mt-1">
                Showing matching events for category: <span className="bg-yellow-300 px-1 text-black border border-black">{category.toUpperCase()}</span>
              </p>
            </div>
            <span className="text-xs font-mono bg-black text-[#00FF00] px-3 py-1 border-2 border-black font-black">
              Selected: {selectedEventIds.length} / 5
            </span>
          </div>

          {conflictError && (
            <div className="text-xs text-white bg-red-600 p-3 border-2 border-black font-mono font-black uppercase flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 shrink-0 stroke-[2.5]" />
              <span>{conflictError}</span>
            </div>
          )}

          {/* Events check List with dynamic filtering */}
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {events.filter(e => {
              const activeCategory = category || studentProfile?.category || 'Sub-Junior';
              const pCat = e.programCategory;
              if (!pCat) return true;
              return pCat === activeCategory || pCat === 'General' || pCat === 'Group';
            }).map((e) => {
              const isChecked = selectedEventIds.includes(e.id);
              return (
                <div
                  key={e.id}
                  onClick={() => handleToggleEvent(e.id)}
                  className={`p-4 border-2 border-black transition cursor-pointer flex justify-between items-center shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                    isChecked 
                      ? 'bg-[#00FF00] text-black' 
                      : 'bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 border border-black text-[8px] font-black uppercase ${
                        e.category === 'stage' ? 'bg-yellow-400 text-black' : 'bg-purple-400 text-white'
                      }`}>
                        {e.category === 'stage' ? 'Stage' : 'Off-Stage'}
                      </span>
                      <h4 className="text-sm font-black text-black leading-snug uppercase">{e.name}</h4>
                    </div>
                    <span className="text-[10px] text-stone-700 font-mono font-bold block">
                      🗓️ {e.date} • {e.time} • Venue: {e.venue.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] font-mono font-black text-black">Seats: {e.maxParticipants}</span>
                    <div className={`h-6 w-6 border-2 border-black flex items-center justify-center transition-all ${
                      isChecked ? 'bg-black text-[#00FF00]' : 'bg-white text-black'
                    }`}>
                      {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleEventsSubmit}
            disabled={selectedEventIds.length === 0}
            className="w-full py-3 bg-black hover:bg-stone-900 text-[#00FF00] border-2 border-black font-mono font-black text-xs uppercase tracking-wider transition-all disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-200 disabled:shadow-none cursor-pointer"
          >
            Review & Confirm Selection →
          </button>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && (
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-6 uppercase">
          <div className="border-b-4 border-black pb-3">
            <h2 className="font-display font-black text-lg text-black">
              Review & Confirm (Step 3 of 4)
            </h2>
          </div>

          {/* Summary Card */}
          <div className="bg-stone-50 p-6 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4">
            <h3 className="text-xs font-mono uppercase font-black text-[#FF0000] tracking-widest border-b-2 border-black pb-2">
              Registration Summary Ticket
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-black">
              <div>
                <span className="text-[9px] uppercase font-black text-stone-500 block">Student Name</span>
                <b className="text-black text-sm">{studentProfile?.name.toUpperCase() || name.toUpperCase()}</b>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-stone-500 block">Represented Team</span>
                <b className="text-black text-sm">{studentProfile?.house.toUpperCase() || team.toUpperCase()}</b>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-stone-500 block">Class & Grade</span>
                <b className="text-black">CLASS {studentProfile?.class.toUpperCase() || className.toUpperCase()}</b>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-stone-500 block">Category</span>
                <b className="text-black">{studentProfile?.category.toUpperCase() || category.toUpperCase()}</b>
              </div>
            </div>

            <div className="border-t-2 border-black pt-3.5 space-y-2">
              <span className="text-[9px] uppercase font-black text-stone-500 block">Selected Competitions</span>
              <ul className="space-y-1.5 font-mono text-xs text-black">
                {selectedEventIds.map((id) => {
                  const ev = events.find(e => e.id === id);
                  return (
                    <li key={id} className="text-xs flex justify-between items-center">
                      <span className="font-black">• {ev?.name.toUpperCase()}</span>
                      <span className="text-[10px] text-stone-500 font-bold">{ev?.date} • {ev?.time}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t-2 border-black pt-3.5 flex justify-between items-center font-mono font-black">
              <span className="text-xs text-black">Total Entry Fees:</span>
              <span className="text-sm text-black bg-[#00FF00] px-2 py-1 border border-black">FREE (DIRECT ENTRY)</span>
            </div>
          </div>

          {/* Accept rules checkbox */}
          <div className="flex items-start space-x-2.5 text-xs text-black font-mono font-bold">
            <input
              type="checkbox"
              id="accept-terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 shrink-0 h-5 w-5 border-2 border-black checked:bg-black checked:text-[#00FF00]"
            />
            <label htmlFor="accept-terms" className="cursor-pointer select-none">
              I agree to the official rules and guidelines for Darussalma Nandi Arts Fest 2026. I understand that event registrations are direct, final, and cannot be modified.
            </label>
          </div>

          <button
            onClick={async () => {
              if (studentProfile) {
                await onCompletePayment(studentProfile.id, confirmationCode);
              }
              setStep(5);
            }}
            disabled={!acceptTerms}
            className="w-full py-3 bg-black hover:bg-stone-900 text-[#00FF00] border-2 border-black font-mono font-black text-xs uppercase tracking-wider transition-all disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-200 cursor-pointer"
          >
            Confirm & Submit Registration →
          </button>
        </div>
      )}

      {/* STEP 5: REGISTRATION SUCCESS */}
      {step === 5 && (
        <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] max-w-md mx-auto space-y-6 text-center uppercase">
          <CheckCircle2 className="h-14 w-14 text-[#00FF00] mx-auto animate-bounce stroke-[3]" />
          
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-black text-black">
              REGISTRATION SUCCESSFUL!
            </h2>
            <p className="text-xs text-stone-500 font-mono font-bold">
              Your free entry pass and ticket code has been compiled and saved successfully.
            </p>
          </div>

          {/* Beautiful Ticket layout */}
          <div className="border-4 border-dashed border-black p-5 bg-stone-50 space-y-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF0000] block font-black">
              OFFICIAL ENTRY PASS
            </span>
            
            <div className="text-xs text-left divide-y-2 divide-black font-mono text-black font-black uppercase">
              <div className="py-2 flex justify-between">
                <span>Student:</span>
                <b className="text-black">{studentProfile?.name.toUpperCase() || name.toUpperCase()}</b>
              </div>
              <div className="py-2 flex justify-between">
                <span>Confirmation #:</span>
                <b className="text-black">{confirmationCode || 'NAF-2026-0847'}</b>
              </div>
              <div className="py-2 flex justify-between">
                <span>Team Represented:</span>
                <b className="bg-black text-[#00FF00] px-1">{studentProfile?.house.toUpperCase() || team.toUpperCase()}</b>
              </div>
              <div className="py-2 flex justify-between">
                <span>Category:</span>
                <b className="text-black">{studentProfile?.category.toUpperCase() || category.toUpperCase()}</b>
              </div>
            </div>

            {/* QR Code mock */}
            <div className="h-32 w-32 mx-auto bg-white p-2 border-2 border-black flex items-center justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${confirmationCode || 'NAF-2026-0847'}`} 
                alt="Verification QR" 
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[8px] font-mono font-black text-stone-500">Scan at campus gate check-in</span>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                const idCardData = {
                  organization: "Darussalma Arts Fest 2026",
                  studentId: studentProfile?.studentId || 'DAN2026-0000',
                  name: studentProfile?.name || name,
                  class: studentProfile?.class || className,
                  category: studentProfile?.category || category,
                  team: studentProfile?.house || team,
                  confirmationNumber: confirmationCode || 'NAF-2026-0000',
                  status: "REGISTERED",
                  generatedAt: new Date().toISOString(),
                  template: "default_id_card_v1",
                  barcode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${confirmationCode || 'NAF-2026-0000'}`
                };

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(idCardData, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `ID_Card_${idCardData.studentId}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-black font-mono font-black text-xs uppercase tracking-wider cursor-pointer flex justify-center items-center gap-2"
            >
              📥 Download ID Card
            </button>
            
            <button
              onClick={() => onNavigate('student-dashboard')}
              className="w-full py-3 bg-black hover:bg-stone-900 text-[#00FF00] border-2 border-black font-mono font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              Go to My Dashboard →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
