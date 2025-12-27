import React from 'react';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'auction' | 'dashboard' | 'players';
  setActiveTab: (tab: 'auction' | 'dashboard' | 'players') => void;
  onSync: () => void;
  onReset: () => void;
  isSyncing: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onSync, 
  onReset, 
  isSyncing 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f3f4f6]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        {/* Simplified Header - Navigation Only */}
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-12 h-full">
            <div className="flex items-center space-x-4 cursor-pointer group">
              <Logo className="h-16 w-auto transition-transform group-hover:scale-105" />
              <div className="hidden sm:block">
                <h1 className="text-ecbNavy font-black text-xl leading-none uppercase italic tracking-tighter">Seva Premiere</h1>
                <p className="text-ecbCyan font-black text-[10px] uppercase tracking-[0.3em] mt-0.5">League 2026</p>
              </div>
            </div>
            
            <nav className="hidden lg:flex items-center space-x-8 h-full">
              {(['auction', 'dashboard', 'players'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === 'auction' ? 'Auction Room' : tab.charAt(0).toUpperCase() + tab.slice(1);
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`h-full flex items-center text-[18px] font-black tracking-tight transition-all relative px-2 ${
                      isActive ? 'text-ecbDarkText border-b-4 border-ecbNavy' : 'text-ecbDarkText/40 hover:text-ecbDarkText'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 mr-4">
              <button 
                onClick={onSync}
                className="flex items-center space-x-2 text-ecbCyan hover:text-ecbDeepNavy font-bold transition-all"
              >
                <div className="w-9 h-9 rounded-xl border border-ecbCyan/20 flex items-center justify-center bg-ecbCyan/5 group hover:bg-ecbCyan hover:text-white transition-colors">
                  <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="hidden md:block text-xs uppercase tracking-widest">Sync</span>
              </button>

              <button 
                onClick={onReset}
                className="flex items-center space-x-2 text-red-500 hover:text-red-700 font-bold transition-all"
              >
                <div className="w-9 h-9 rounded-xl border border-red-200 flex items-center justify-center bg-red-50 group hover:bg-red-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                  </svg>
                </div>
                <span className="hidden md:block text-xs uppercase tracking-widest">Reset</span>
              </button>
            </div>

            <div className="h-10 w-px bg-gray-100 mx-2"></div>
            
            <div className="flex items-center space-x-4">
               <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-ecbNavy hover:bg-ecbCyan hover:text-white transition-all cursor-pointer">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
               </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <nav className="lg:hidden flex border-t border-gray-100">
           {(['auction', 'dashboard', 'players'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                      isActive ? 'text-ecbCyan border-b-2 border-ecbCyan' : 'text-gray-400'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full py-8 px-4 md:py-12">
        {children}
      </main>

      <footer className="bg-ecbNavy text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-white/10 pb-12 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <Logo className="h-16 w-auto" />
                <div className="border-l border-white/20 pl-4">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Seva Premiere League</h3>
                  <p className="text-ecbCyan text-xs font-black uppercase tracking-[0.3em]">Official Auction Engine</p>
                </div>
              </div>
              <p className="text-white/50 text-sm max-w-lg leading-relaxed">
                Empowering franchises with advanced scouting analytics and real-time auction intelligence. 
                Built to simulate the high-stakes environment of the 2026 Seva Premiere League.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-sm uppercase tracking-widest mb-6 text-ecbCyan">Platform Links</h5>
              <ul className="space-y-4 text-white/60 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-ecbCyan rounded-full mr-2"></span> Auction Rules 2026
                </li>
                <li className="hover:text-white cursor-pointer transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-ecbCyan rounded-full mr-2"></span> Franchise Compliance
                </li>
                <li className="hover:text-white cursor-pointer transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 bg-ecbCyan rounded-full mr-2"></span> Technical Support
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-white/30 text-[10px] uppercase tracking-[0.2em] font-black">
            <p>&copy; 2026 SEVA PREMIERE LEAGUE. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center space-x-8 mt-4 md:mt-0">
               <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
               <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
               <span className="hover:text-white cursor-pointer transition-colors">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};