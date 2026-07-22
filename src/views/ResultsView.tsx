import React, { useState, useEffect } from 'react';
import { Result, Certificate } from '../types';
import { Trophy, Award, Search, Download, Share2, Eye, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';

interface ResultsViewProps {
  results: any[];
  hallOfFame: any;
  onSearchCertificates: (query: string) => Promise<Certificate[]>;
}

export default function ResultsView({ results, hallOfFame, onSearchCertificates }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<'Senior' | 'Junior' | 'Sub-Junior' | 'General' | 'Group'>('Senior');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Certificate Downloader Widget State
  const [certQuery, setCertQuery] = useState('');
  const [certResults, setCertResults] = useState<Certificate[]>([]);
  const [isSearchingCerts, setIsSearchingCerts] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Filtered results
  const resultsArray = Array.isArray(results) ? results : [];
  const filteredResults = resultsArray.filter(res => {
    const matchesCategory = res.programCategory === activeTab;
    const matchesSearch = res.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.firstPlace.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSearchCerts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certQuery.trim()) return;
    setIsSearchingCerts(true);
    try {
      const data = await onSearchCertificates(certQuery);
      setCertResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingCerts(false);
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

  const getHouseColorHex = (house: string) => {
    switch (house.toLowerCase()) {
      case 'red':
      case 'team a': return '#EF4444';
      case 'blue':
      case 'team b': return '#3B82F6';
      case 'green':
      case 'team c': return '#10B981';
      case 'yellow': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 min-h-screen bg-[#F8FAFC]">
      
      {/* 1. Hall of Fame Banner */}
      <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(79,70,229,0.15)] border border-slate-800">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <Trophy className="h-64 w-64 text-white" />
        </div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="space-y-4 relative z-10 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
            <Trophy className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
            <span>HALL OF FAME • OVERALL CHAMPION 2026</span>
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {hallOfFame?.house || 'Red'} House Leads the Festival!
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Securing an outstanding total of <span className="bg-indigo-600/50 text-indigo-200 px-2.5 py-1 rounded-md font-semibold border border-indigo-500/20">{hallOfFame?.totalPoints || '2,450'} points</span>, they currently claim the crown. Record breakers in Group Song & Photography.
          </p>
        </div>
      </div>

      {/* 2. Festival Results Filters */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">Festival Competition Results</h2>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Official verified standings with judges remarks</p>
          </div>

          {/* Tab selectors and search */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            {/* Category Tab Selectors */}
            <div className="flex bg-slate-100 p-1 border border-slate-200/50 rounded-xl flex-wrap">
              {(['Senior', 'Junior', 'Sub-Junior', 'General', 'Group'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                    activeTab === cat 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search result, winner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* 3. Result Detailed Cards Grid */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] text-slate-400 font-medium text-xs uppercase tracking-wider">
            No results have been published for this subcategory yet.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResults.map((res) => (
              <div 
                key={res.id} 
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] hover:shadow-[0_8px_25px_-4px_rgba(79,70,229,0.06)] transition-all duration-300"
              >
                {/* Event header line */}
                <div className="bg-slate-900 text-white p-5 px-6 flex justify-between items-center flex-wrap gap-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-display font-bold text-base tracking-tight text-indigo-400 uppercase">{res.eventName}</h3>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1 block">
                      {res.date} • {res.venue} • Verified Standings
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-semibold uppercase px-2.5 py-1 rounded-md">
                    Official Announcement
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 1st Place */}
                  <div className="bg-amber-50/40 p-5 border border-amber-100 rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden">
                    <span className="absolute right-4 top-2 text-2xl font-bold text-amber-700/5 pointer-events-none">1ST</span>
                    <div>
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        🏆 Winner • 100 PTS
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-2.5 truncate uppercase">
                        {res.firstPlace.name}
                      </h4>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getHouseBgClass(res.firstPlace.house)}`}>
                        {res.firstPlace.house} House
                      </span>
                      <button 
                        onClick={() => {
                          setSelectedCert({
                            id: 'temp-cert-1',
                            studentId: res.firstPlace.studentId || 'guest',
                            studentName: res.firstPlace.name,
                            house: res.firstPlace.house,
                            eventId: res.eventId,
                            eventName: res.eventName,
                            category: res.category,
                            awardText: '1st Place',
                            points: 100,
                            issuedAt: res.publishedAt,
                            verificationCode: `VRF-${res.eventName.substring(0,3).toUpperCase()}-1001`
                          });
                        }}
                        className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 hover:underline flex items-center space-x-1 uppercase cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>View Cert</span>
                      </button>
                    </div>
                  </div>

                  {/* 2nd Place */}
                  <div className="bg-slate-50/50 p-5 border border-slate-200/50 rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden">
                    <span className="absolute right-4 top-2 text-2xl font-bold text-slate-400/10 pointer-events-none">2ND</span>
                    <div>
                      <span className="text-[9px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        🥈 2nd Place • 75 PTS
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-2.5 truncate uppercase">
                        {res.secondPlace.name}
                      </h4>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getHouseBgClass(res.secondPlace.house)}`}>
                        {res.secondPlace.house} House
                      </span>
                      <button 
                        onClick={() => {
                          setSelectedCert({
                            id: 'temp-cert-2',
                            studentId: res.secondPlace.studentId || 'guest',
                            studentName: res.secondPlace.name,
                            house: res.secondPlace.house,
                            eventId: res.eventId,
                            eventName: res.eventName,
                            category: res.category,
                            awardText: '2nd Place',
                            points: 75,
                            issuedAt: res.publishedAt,
                            verificationCode: `VRF-${res.eventName.substring(0,3).toUpperCase()}-2002`
                          });
                        }}
                        className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 hover:underline flex items-center space-x-1 uppercase cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>View Cert</span>
                      </button>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="bg-amber-50/20 p-5 border border-amber-100/50 rounded-xl flex flex-col justify-between space-y-3 relative overflow-hidden">
                    <span className="absolute right-4 top-2 text-2xl font-bold text-amber-600/5 pointer-events-none">3RD</span>
                    <div>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        🥉 3rd Place • 50 PTS
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-2.5 truncate uppercase">
                        {res.thirdPlace.name}
                      </h4>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getHouseBgClass(res.thirdPlace.house)}`}>
                        {res.thirdPlace.house} House
                      </span>
                      <button 
                        onClick={() => {
                          setSelectedCert({
                            id: 'temp-cert-3',
                            studentId: res.thirdPlace.studentId || 'guest',
                            studentName: res.thirdPlace.name,
                            house: res.thirdPlace.house,
                            eventId: res.eventId,
                            eventName: res.eventName,
                            category: res.category,
                            awardText: '3rd Place',
                            points: 50,
                            issuedAt: res.publishedAt,
                            verificationCode: `VRF-${res.eventName.substring(0,3).toUpperCase()}-3003`
                          });
                        }}
                        className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 hover:underline flex items-center space-x-1 uppercase cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>View Cert</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Judge comments snippet */}
                <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex items-start space-x-3 text-xs text-slate-600 leading-relaxed font-sans">
                  <span className="font-semibold text-indigo-600 shrink-0 bg-indigo-50 px-2.5 py-0.5 rounded">Judges Remarks:</span>
                  <p className="italic">"{res.judgeRemarks}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Certificate Downloader Widget */}
      <section id="cert-downloader-section" className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl shadow-[0_10px_30px_rgba(79,70,229,0.15)] space-y-8 border border-slate-800">
        <div className="text-center space-y-3">
          <Award className="h-10 w-10 text-indigo-400 mx-auto animate-pulse" />
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">Download Your Certificates</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md mx-auto uppercase tracking-wide">
            Enter your Student ID (e.g. DAN2026-0487) or registered name to find and print all your certificates.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchCerts} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="STUDENT ID (DAN2026-XXXX) OR NAME"
            value={certQuery}
            onChange={(e) => setCertQuery(e.target.value)}
            className="flex-1 px-4.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold uppercase tracking-wider placeholder-slate-500 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <button
            id="find-certs-btn"
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold uppercase rounded-xl text-xs tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            {isSearchingCerts ? 'Searching...' : 'Find Certificates'}
          </button>
        </form>

        {/* Search Results */}
        {certResults.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 text-center">
              YOUR CERTIFICATES ({certResults.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certResults.map((cert) => (
                <div 
                  key={cert.id} 
                  className="bg-slate-800/50 p-5 border border-slate-700/80 rounded-2xl hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {cert.category.toUpperCase()} • {cert.awardText.toUpperCase()}
                    </span>
                    <h4 className="text-sm font-extrabold text-white mt-1.5 leading-tight uppercase">{cert.eventName}</h4>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">Ref: {cert.verificationCode}</span>
                  </div>
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs font-sans uppercase flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View & Print</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : certQuery && !isSearchingCerts ? (
          <p className="text-center text-xs text-rose-400 font-semibold uppercase italic">
            No certificates found. Ensure your Student ID is correct and results are published.
          </p>
        ) : null}
      </section>

      {/* 5. Gorgeous Printable Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-slate-200 w-full max-w-2xl overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative p-8 sm:p-10 space-y-6">
            
            <button
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-sans text-xs font-bold uppercase transition-all print:hidden cursor-pointer"
            >
              ✕ Close
            </button>

            {/* Certificate Frame Boundary */}
            <div className="border-4 border-double border-slate-900 p-8 sm:p-10 text-center space-y-6 relative bg-white rounded-xl">
              
              {/* Corner Ornaments */}
              <div className="absolute top-2.5 left-2.5 text-slate-800 font-serif text-lg opacity-40">❖</div>
              <div className="absolute top-2.5 right-2.5 text-slate-800 font-serif text-lg opacity-40">❖</div>
              <div className="absolute bottom-2.5 left-2.5 text-slate-800 font-serif text-lg opacity-40">❖</div>
              <div className="absolute bottom-2.5 right-2.5 text-slate-800 font-serif text-lg opacity-40">❖</div>

              {/* Header */}
              <div className="space-y-1">
                <span className="font-display font-extrabold text-slate-950 text-2xl tracking-tight uppercase block">
                  DARUSSALMA ACADEMY
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit mx-auto">
                  Nandi Arts Fest 2026
                </span>
              </div>

              {/* Title */}
              <div className="py-2">
                <span className="font-sans text-lg text-slate-900 font-bold uppercase tracking-wider block">
                  ★ CERTIFICATE OF MERIT ★
                </span>
                <div className="h-0.5 bg-slate-800 w-32 mx-auto mt-2" />
              </div>

              {/* Certificate content */}
              <div className="space-y-4 font-sans text-xs text-slate-700 leading-relaxed max-w-md mx-auto uppercase font-medium">
                <p>This is proudly presented to</p>
                <h3 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight border-b-2 border-slate-200 pb-2 w-fit mx-auto px-4 bg-slate-50 rounded-lg">
                  {selectedCert.studentName.toUpperCase()}
                </h3>
                <p className="flex items-center justify-center space-x-1">
                  <span>of</span>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase bg-slate-100 border-slate-200 text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getHouseColorHex(selectedCert.house) }} />
                    <span>{selectedCert.house} House</span>
                  </span>
                  <span>in recognition of achieving</span>
                </p>
                <div className="py-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white bg-slate-900 px-4 py-1.5 rounded-full">
                    {selectedCert.awardText.toUpperCase()}
                  </span>
                </div>
                <p className="leading-relaxed">
                  in the competition <span className="text-slate-900 font-bold underline">{selectedCert.eventName.toUpperCase()}</span> ({selectedCert.category === 'stage' ? 'Stage' : 'Off-Stage'} Event) held at Darussalma Academy campus.
                </p>
              </div>

              {/* Signatures & Verification */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div className="text-center">
                  <span className="font-bold text-slate-900 text-sm block">T. SHAJI</span>
                  <span className="block text-[10px] text-slate-400 font-medium uppercase border-t border-slate-100 pt-1.5 mx-4 mt-1">
                    Festival Convener
                  </span>
                </div>
                <div className="text-center">
                  <span className="font-bold text-slate-900 text-sm block">A. KARIM</span>
                  <span className="block text-[10px] text-slate-400 font-medium uppercase border-t border-slate-100 pt-1.5 mx-4 mt-1">
                    Patron of Academy
                  </span>
                </div>
              </div>

              {/* Verification Stamp */}
              <div className="pt-4 flex justify-center items-center space-x-1.5 text-[9px] font-sans text-slate-400 font-semibold uppercase">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Verified Code: <span className="bg-slate-50 px-2 py-0.5 border border-slate-200 rounded font-mono text-[10px] text-slate-700">{selectedCert.verificationCode}</span> • Secured Authentication</span>
              </div>

            </div>

            {/* Action buttons (hidden in print mode) */}
            <div className="flex justify-end space-x-3 print:hidden pt-2">
              <button
                onClick={handlePrintCertificate}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs uppercase flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs uppercase transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
