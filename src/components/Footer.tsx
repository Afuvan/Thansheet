import React from 'react';
import { Award, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer id="main-footer" className="bg-slate-900 text-slate-100 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg text-white">
                <Award className="h-5 w-5 stroke-[2]" />
              </div>
              <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">DARUSSALMA</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              Darussalma Academy Nandi Arts Fest is a grand celebration where artistic expressions meet high educational standards, nurturing individual creativity and collective harmony.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-slate-200 uppercase mb-4 border-b border-slate-800 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <button onClick={() => onNavigate('home')} className="text-slate-400 hover:text-indigo-400 transition-colors block text-left py-0.5">
                  Festival Hub Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('events')} className="text-slate-400 hover:text-indigo-400 transition-colors block text-left py-0.5">
                  Stage & Off-stage Events
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('scoreboard')} className="text-slate-400 hover:text-indigo-400 transition-colors block text-left py-0.5">
                  Live House Scoreboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('results')} className="text-slate-400 hover:text-indigo-400 transition-colors block text-left py-0.5">
                  Winner Board & Certificates
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('gallery')} className="text-slate-400 hover:text-indigo-400 transition-colors block text-left py-0.5">
                  Festival Photo Gallery
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-slate-200 uppercase mb-4 border-b border-slate-800 pb-2">
              Contact Us
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-400">
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>info@darussalma.edu</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>+91 9447 123 456</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-xs">Nandi, Kozhikode, Kerala</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Social */}
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-slate-200 uppercase mb-4 border-b border-slate-800 pb-2">
              Social Channels
            </h4>
            <div className="flex space-x-2 mb-4">
              <a href="#" className="w-9 h-9 border border-slate-800 rounded-lg bg-slate-900 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white flex items-center justify-center transition-all font-sans text-xs font-semibold text-slate-400" aria-label="Instagram">
                IG
              </a>
              <a href="#" className="w-9 h-9 border border-slate-800 rounded-lg bg-slate-900 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white flex items-center justify-center transition-all font-sans text-xs font-semibold text-slate-400" aria-label="Facebook">
                FB
              </a>
              <a href="#" className="w-9 h-9 border border-slate-800 rounded-lg bg-slate-900 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white flex items-center justify-center transition-all font-sans text-xs font-semibold text-slate-400" aria-label="YouTube">
                YT
              </a>
              <a href="#" className="w-9 h-9 border border-slate-800 rounded-lg bg-slate-900 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white flex items-center justify-center transition-all font-sans text-xs font-semibold text-slate-400" aria-label="Twitter X">
                X
              </a>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Use hashtag <span className="font-semibold text-indigo-400">#DANFest26</span> to share your festival highlights.
            </p>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
          <p>© 2026 Darussalma Academy. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

