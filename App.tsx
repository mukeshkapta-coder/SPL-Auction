import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { AuctionRoom } from './components/AuctionRoom';
import { Player, Franchise } from './types';
import { INITIAL_PLAYERS, FRANCHISES } from './constants';
import { fetchPlayersFromWeb } from './services/geminiService';

// Versioned keys for persistence
const STORAGE_KEY_PLAYERS = 'spl_auction_players_v14';
const STORAGE_KEY_FRANCHISES = 'spl_auction_franchises_v14';

/**
 * HELPER: Deep Clone
 */
const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * RESET CONFIRMATION MODAL COMPONENT
 */
const ResetConfirmModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void 
}> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ecbNavy/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-gray-100 rounded-[2rem] p-10 max-w-md w-full shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-100">
           <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
           </svg>
        </div>
        
        <h2 className="text-3xl font-black text-ecbNavy mb-4 tracking-tighter uppercase italic">Reset System?</h2>
        <p className="text-gray-500 font-medium leading-relaxed mb-10">
          This operation will erase all <span className="text-red-500 font-bold">Auction acquisitions</span> and rosters. The athlete database will remain intact.
        </p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-red-500/20 active:scale-95"
          >
            Confirm Wipe
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-black uppercase tracking-widest py-5 rounded-2xl transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

type SortKey = 'name' | 'originalTeam' | 'skill' | 'soldPrice';
type SortOrder = 'asc' | 'desc';

const App: React.FC = () => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetToast, setShowResetToast] = useState(false);

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
    } catch (e) {
      return INITIAL_PLAYERS;
    }
  });

  const [franchises, setFranchises] = useState<Franchise[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FRANCHISES);
      return saved ? JSON.parse(saved) : deepClone(FRANCHISES);
    } catch (e) {
      return deepClone(FRANCHISES);
    }
  });

  const [activeTab, setActiveTab] = useState<'auction' | 'dashboard' | 'players'>('auction');
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'name', order: 'asc' });
  const auctionRoomRef = useRef<{ startRandom: () => void } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(franchises));
  }, [franchises]);

  const handleAtomicReset = () => {
    const resetPlayers = players.map(p => ({
      ...p,
      isSold: false,
      teamId: undefined,
      soldPrice: undefined
    }));
    const resetFranchises = deepClone(FRANCHISES);
    setPlayers(resetPlayers);
    setFranchises(resetFranchises);
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(resetPlayers));
    localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(resetFranchises));
    setShowResetToast(true);
    setTimeout(() => setShowResetToast(false), 3000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSyncPlayers = async () => {
    if (!confirm("Access official Season 2026 athlete records?")) return;
    setIsSyncing(true);
    try {
      const webPlayers = await fetchPlayersFromWeb();
      if (webPlayers && webPlayers.length > 0) {
        const soldPlayers = players.filter(p => p.isSold);
        const soldNames = new Set(soldPlayers.map(p => p.name));
        const newAvailablePlayers = webPlayers.filter(p => !soldNames.has(p.name));
        setPlayers([...soldPlayers, ...newAvailablePlayers]);
      }
    } catch (error) {
      console.error(error);
      alert("Sync failed. Check connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSold = useCallback((playerId: string, teamId: string, amount: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, isSold: true, teamId, soldPrice: amount } : p
    ));

    setFranchises(prev => prev.map(f => {
      if (f.id === teamId) {
        const soldPlayer = players.find(p => p.id === playerId);
        if (!soldPlayer) return f;
        return {
          ...f,
          budget: f.budget - amount,
          roster: [...f.roster, { ...soldPlayer, isSold: true, teamId, soldPrice: amount }]
        };
      }
      return f;
    }));
  }, [players]);

  const handleUpdatePrice = (playerId: string, newPrice: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player || !player.teamId) return;
    const priceDiff = newPrice - (player.soldPrice || 0);
    const team = franchises.find(f => f.id === player.teamId);
    if (team && team.budget < priceDiff) {
      alert(`PURSE LIMIT REACHED! ${team.name} has insufficient funds.`);
      setEditingPlayerId(null);
      return;
    }
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, soldPrice: newPrice } : p));
    setFranchises(prev => prev.map(f => {
      if (f.id === player.teamId) {
        return {
          ...f,
          budget: f.budget - priceDiff,
          roster: f.roster.map(p => p.id === playerId ? { ...p, soldPrice: newPrice } : p)
        };
      }
      return f;
    }));
    setEditingPlayerId(null);
  };

  const handleMovePlayer = (playerId: string, targetTeamId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player || player.teamId === targetTeamId) return;
    const sourceTeamId = player.teamId;
    const targetTeam = franchises.find(f => f.id === targetTeamId);
    const price = player.soldPrice || 0;
    if (targetTeam && targetTeam.budget < price) {
      alert(`${targetTeam.name} cannot afford ₹${price}.`);
      return;
    }
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, teamId: targetTeamId } : p));
    setFranchises(prev => prev.map(f => {
      if (f.id === sourceTeamId) {
        return {
          ...f,
          budget: f.budget + price,
          roster: f.roster.filter(p => p.id !== playerId)
        };
      }
      if (f.id === targetTeamId) {
        return {
          ...f,
          budget: f.budget - price,
          roster: [...f.roster, { ...player, teamId: targetTeamId, isSold: true, soldPrice: price }]
        };
      }
      return f;
    }));
  };

  const onDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData("playerId", playerId);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const onDrop = (e: React.DragEvent, teamId: string) => {
    const playerId = e.dataTransfer.getData("playerId");
    handleMovePlayer(playerId, teamId);
  };

  const sortedPlayersList = useMemo(() => {
    const sortablePlayers = [...players];
    sortablePlayers.sort((a, b) => {
      let aVal: any = a[sortConfig.key];
      let bVal: any = b[sortConfig.key];
      if (sortConfig.key === 'soldPrice') {
        aVal = a.isSold ? a.soldPrice : a.basePrice;
        bVal = b.isSold ? b.soldPrice : b.basePrice;
      }
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
    return sortablePlayers;
  }, [players, sortConfig]);

  const toggleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <span className="ml-1 opacity-20">⇅</span>;
    return <span className="ml-1 text-ecbCyan font-black">{sortConfig.order === 'asc' ? '↑' : '↓'}</span>;
  };

  const downloadPlayersList = () => {
    const headers = ['Name', 'Role', 'Purse Value', 'Status'];
    const rows = sortedPlayersList.map(p => [p.name, p.skill, p.isSold ? p.soldPrice : p.basePrice, p.isSold ? 'Acquired' : 'Free Agent']);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ECB_SPCL_Database.csv";
    link.click();
  };

  const downloadAuctionReport = () => {
    const headers = ['Player', 'Role', 'Purchaser', 'Value'];
    const rows = players.filter(p => p.isSold).map(p => {
      const team = franchises.find(f => f.id === p.teamId);
      return [p.name, p.skill, team ? team.name : 'N/A', p.soldPrice?.toString() || '0'];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ECB_SPCL_Report.csv";
    link.click();
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onSync={handleSyncPlayers} 
      onReset={() => setShowResetModal(true)}
      isSyncing={isSyncing}
    >
      {showResetToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] bg-ecbCyan text-white px-10 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-12 duration-500">
          Database Successfully Reset
        </div>
      )}

      <ResetConfirmModal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        onConfirm={handleAtomicReset} 
      />

      {activeTab === 'auction' && (
        <AuctionRoom 
          ref={auctionRoomRef}
          players={players} 
          franchises={franchises} 
          onBid={() => {}} 
          onSold={handleSold} 
          onSkip={() => {}}
        />
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-12 animate-in fade-in duration-500">
          <div className="flex justify-between items-center border-b border-gray-200 pb-8">
             <h2 className="text-4xl font-black text-ecbNavy uppercase tracking-tighter italic">Franchise Portfolios</h2>
             <button onClick={downloadAuctionReport} className="bg-ecbNavy hover:bg-ecbCyan text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-ecbNavy/20">
               Generate Report
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {franchises.map(team => {
              const hasWK = team.roster.some(p => p.skill.toLowerCase().includes('wk'));
              const isQualified = hasWK && team.roster.length >= 11;
              const isDisqualified = !isQualified && team.budget <= 0;
              const isNotQualified = !isQualified && team.budget > 0;

              return (
                <div key={team.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, team.id)} className={`bg-white rounded-3xl border-2 p-8 flex flex-col h-full overflow-hidden relative group transition-all shadow-lg min-h-[500px] ${
                  isQualified ? 'border-ecbGreen/20 shadow-ecbGreen/5' : 
                  isDisqualified ? 'border-red-500/30 bg-red-50/10' :
                  'border-gray-100 hover:border-ecbCyan/40'
                }`}>
                  <div className="absolute top-0 left-0 w-full h-2 transition-all group-hover:h-3" style={{ backgroundColor: team.color }}></div>
                  
                  {/* Qualification Badge */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-ecbNavy uppercase italic truncate pr-4 leading-none">{team.name}</h3>
                      <div className={`text-[9px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 rounded-sm inline-block w-max ${
                        isQualified ? 'bg-ecbGreen text-white' : 
                        isDisqualified ? 'bg-red-500 text-white' :
                        'bg-amber-400 text-ecbNavy'
                      }`}>
                        {isQualified ? 'Qualified' : isDisqualified ? 'Disqualified' : 'Not Qualified'}
                      </div>
                    </div>
                    <div className="text-lg font-black text-ecbCyan">₹{team.budget}</div>
                  </div>

                  <div className="flex gap-2 mb-8">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${hasWK ? 'bg-ecbGreen/10 text-ecbGreen' : 'bg-red-50 text-red-500'}`}>{hasWK ? 'WK ✅' : 'Need WK'}</div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${team.roster.length >= 11 ? 'bg-ecbCyan/10 text-ecbCyan' : 'bg-gray-100 text-gray-400'}`}>{team.roster.length}/11</div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {team.roster.map(p => (
                      <div key={p.id} draggable onDragStart={(e) => onDragStart(e, p.id)} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 cursor-grab active:cursor-grabbing hover:bg-white transition-all shadow-sm hover:shadow-md">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-ecbNavy truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.skill}</div>
                        </div>
                        {editingPlayerId === p.id ? (
                          <input 
                            autoFocus
                            type="number"
                            className="w-20 bg-white border-2 border-ecbCyan rounded-lg px-2 py-1 text-sm font-black text-ecbNavy outline-none"
                            defaultValue={p.soldPrice}
                            onBlur={(e) => handleUpdatePrice(p.id, parseInt(e.target.value) || 0)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdatePrice(p.id, parseInt((e.target as HTMLInputElement).value) || 0)}
                          />
                        ) : (
                          <div onClick={() => setEditingPlayerId(p.id)} className="text-sm font-black text-ecbCyan hover:underline cursor-pointer">₹{p.soldPrice}</div>
                        )}
                      </div>
                    ))}
                    {team.roster.length === 0 && (
                      <div className="text-center text-gray-300 py-16 italic text-sm border-2 border-dashed border-gray-100 rounded-2xl">Drop Athlete Here</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'players' && (
        <div className="space-y-12 animate-in fade-in duration-500">
           <div className="flex justify-between items-center border-b border-gray-200 pb-8">
             <h2 className="text-4xl font-black text-ecbNavy uppercase tracking-tighter italic">Athlete Registry</h2>
             <button onClick={downloadPlayersList} className="bg-ecbNavy hover:bg-ecbCyan text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-ecbNavy/20">
               Download CSV
             </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-400 uppercase text-[11px] font-black tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-10 py-6 cursor-pointer hover:text-ecbNavy transition-colors" onClick={() => toggleSort('name')}>Player <SortIndicator column="name" /></th>
                    <th className="px-10 py-6 cursor-pointer hover:text-ecbNavy transition-colors" onClick={() => toggleSort('originalTeam')}>Franchise <SortIndicator column="originalTeam" /></th>
                    <th className="px-10 py-6 cursor-pointer hover:text-ecbNavy transition-colors" onClick={() => toggleSort('skill')}>Role <SortIndicator column="skill" /></th>
                    <th className="px-10 py-6 text-right cursor-pointer hover:text-ecbNavy transition-colors" onClick={() => toggleSort('soldPrice')}>Valuation <SortIndicator column="soldPrice" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedPlayersList.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-ecbGrey flex items-center justify-center text-lg font-black text-ecbNavy mr-4 border border-gray-100 group-hover:border-ecbCyan transition-all">{p.name.charAt(0)}</div>
                          <div>
                            <div className="font-black text-ecbNavy text-base group-hover:text-ecbCyan transition-colors">{p.name}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-bold text-gray-500 uppercase text-xs">{p.originalTeam || 'UNASSIGNED'}</td>
                      <td className="px-10 py-6">
                        <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-ecbGrey text-ecbNavy uppercase tracking-widest border border-gray-100">
                          {p.skill}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="font-black text-ecbNavy text-lg">₹{p.isSold ? p.soldPrice : p.basePrice}</div>
                        <div className={`text-[9px] font-black uppercase tracking-widest ${p.isSold ? 'text-ecbGreen' : 'text-gray-300'}`}>
                          {p.isSold ? '● ACQUIRED' : '○ AVAILABLE'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }`}</style>
    </Layout>
  );
};

export default App;