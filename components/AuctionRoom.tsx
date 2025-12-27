import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Player, Franchise } from '../types';
import { MIN_BID_INCREMENT } from '../constants';
import { getScoutingReport } from '../services/geminiService';
import { PlayerCard } from './PlayerCard';
// Added missing Logo import
import { Logo } from './Logo';

interface AuctionRoomProps {
  franchises: Franchise[];
  players: Player[];
  onBid: (teamId: string, amount: number) => void;
  onSold: (playerId: string, teamId: string, amount: number) => void;
  onSkip: (playerId: string) => void;
}

export const AuctionRoom = forwardRef<{ startRandom: () => void }, AuctionRoomProps>(({ 
  franchises, 
  players, 
  onBid, 
  onSold, 
  onSkip 
}, ref) => {
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [lastBidder, setLastBidder] = useState<string | null>(null);
  const [scoutingReport, setScoutingReport] = useState<string>("");
  const [isLoadingScout, setIsLoadingScout] = useState(false);
  const [animateBid, setAnimateBid] = useState(false);
  const [finalPriceInput, setFinalPriceInput] = useState<string>("");

  const availablePlayers = players.filter(p => !p.isSold);

  useImperativeHandle(ref, () => ({
    startRandom: () => {
      if (availablePlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePlayers.length);
        handleStartAuction(availablePlayers[randomIndex]);
      } else {
        alert("No players left in the pool!");
      }
    }
  }));

  useEffect(() => {
    if (currentBid > 0) {
      setFinalPriceInput(currentBid.toString());
    }
  }, [currentBid]);

  const handleStartAuction = async (player: Player) => {
    if (player.isSold) return;
    setActivePlayer(player);
    setCurrentBid(50);
    setLastBidder(null);
    setScoutingReport("");
    setFinalPriceInput("50");
    
    setIsLoadingScout(true);
    try {
      const report = await getScoutingReport(player, franchises);
      setScoutingReport(report);
    } finally {
      setIsLoadingScout(false);
    }
  };

  const placeBid = (teamId: string) => {
    if (!activePlayer) return;
    if (lastBidder === teamId) return;

    const team = franchises.find(f => f.id === teamId);
    if (!team) return;

    const nextBid = lastBidder ? currentBid + MIN_BID_INCREMENT : currentBid;

    if (team.budget >= nextBid) {
      setCurrentBid(nextBid);
      setLastBidder(teamId);
      onBid(teamId, nextBid);
      setAnimateBid(true);
      setTimeout(() => setAnimateBid(false), 300);
    } else {
      alert(`${team.name} doesn't have the funds (₹${team.budget}) for a ₹${nextBid} bid!`);
    }
  };

  const finalizeSale = () => {
    const saleAmount = parseInt(finalPriceInput);
    if (isNaN(saleAmount) || saleAmount < 0) {
      alert("Please enter a valid sale amount.");
      return;
    }

    if (activePlayer && lastBidder) {
      const team = franchises.find(f => f.id === lastBidder);
      if (team && team.budget < saleAmount) {
        alert(`${team.name} cannot afford ₹${saleAmount}. (Budget: ₹${team.budget})`);
        return;
      }

      onSold(activePlayer.id, lastBidder, saleAmount);
      setActivePlayer(null);
      setCurrentBid(0);
      setLastBidder(null);
      setFinalPriceInput("");
    }
  };

  return (
    <div className="flex flex-col space-y-12">
      <section>
        {activePlayer ? (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10 relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 right-0 w-96 h-96 bg-ecbCyan/5 blur-[100px] -mr-48 -mt-48"></div>
            
            <div className="relative flex flex-col lg:flex-row items-stretch gap-12">
              {/* Player Media Profile */}
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-6">
                  <span className="bg-ecbNavy text-white px-4 py-1 rounded text-[10px] font-black uppercase tracking-widest">Live Auction</span>
                  <div className="h-px flex-1 bg-gray-100"></div>
                </div>
                
                <h2 className="text-6xl font-black text-ecbNavy mb-2 tracking-tighter leading-none italic uppercase">
                  {activePlayer.name}
                </h2>
                <div className="flex items-center space-x-3 text-lg font-bold text-gray-400 mb-8">
                  <span>{activePlayer.country}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-ecbCyan"></div>
                  <span>{activePlayer.skill}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-ecbCyan"></div>
                  <span className="text-ecbNavy">{activePlayer.originalTeam}</span>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-sm font-black text-ecbNavy uppercase tracking-widest mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-ecbCyan" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10a1 1 0 01-1.12.38 1 1 0 01-.63-.92V13H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    ECB Insights & Scouting
                  </h4>
                  {isLoadingScout ? (
                    <div className="flex items-center space-x-2 py-4">
                      <div className="w-2 h-2 bg-ecbCyan rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-ecbCyan rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-ecbCyan rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  ) : (
                    <p className="text-gray-600 leading-relaxed font-medium italic">"{scoutingReport || "Scouting data is being compiled..."}"</p>
                  )}
                </div>
              </div>

              {/* Bidding Terminal */}
              <div className="lg:w-[400px] flex flex-col">
                <div className="bg-ecbNavy rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden flex-1 min-h-[300px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-ecbCyan"></div>
                  <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em] mb-4">Leading Valuation</p>
                  <div className={`text-8xl font-black text-white tracking-tighter mb-6 transition-all duration-300 ${animateBid ? 'scale-110 text-ecbCyan' : ''}`}>
                    ₹{currentBid}
                  </div>
                  
                  <div className="w-full pt-8 border-t border-white/10">
                    {lastBidder ? (
                      <div>
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-3 block">Current Frontrunner</span>
                        <div className="bg-white/5 border border-white/10 rounded-2xl py-3 px-6 inline-block">
                          <span className="text-xl font-black text-ecbCyan italic">{franchises.find(f => f.id === lastBidder)?.name}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white/20 font-black uppercase tracking-widest italic text-sm animate-pulse">Awaiting Opening Bid...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bid Controls */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {franchises.map(team => {
                const isWinner = lastBidder === team.id;
                const nextRequired = lastBidder ? currentBid + MIN_BID_INCREMENT : currentBid;
                const canAfford = team.budget >= nextRequired && !isWinner;
                return (
                  <button
                    key={team.id}
                    onClick={() => placeBid(team.id)}
                    disabled={!canAfford}
                    className={`group relative p-4 rounded-xl border transition-all flex flex-col items-center justify-center ${
                      isWinner 
                        ? 'bg-ecbCyan/10 border-ecbCyan ring-2 ring-ecbCyan/20 opacity-100' 
                        : 'bg-white border-gray-100 hover:border-ecbCyan/40 hover:bg-gray-50'
                    } disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed`}
                  >
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: team.color }}></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase mb-1 truncate w-full text-center">{team.name}</span>
                    <div className="text-sm font-black text-ecbNavy">₹{team.budget}</div>
                    {isWinner && <div className="mt-1 text-[8px] font-black text-ecbCyan uppercase animate-pulse">Leading</div>}
                  </button>
                );
              })}
            </div>

            <div className="mt-12 pt-10 border-t border-gray-100 flex flex-col md:flex-row gap-6 items-end">
              {lastBidder && (
                <div className="flex-1 w-full">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Confirm Final Sale Price</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-ecbNavy font-black text-2xl">₹</span>
                    <input 
                      type="number"
                      value={finalPriceInput}
                      onChange={(e) => setFinalPriceInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-ecbCyan rounded-2xl py-6 pl-12 pr-6 text-3xl font-black text-ecbNavy outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              )}
              <div className="flex-[2] flex gap-4 w-full h-[84px]">
                <button 
                  onClick={finalizeSale} 
                  disabled={!lastBidder} 
                  className="flex-1 bg-ecbCyan hover:bg-ecbDeepNavy disabled:bg-gray-100 disabled:text-gray-300 rounded-2xl font-black text-2xl text-white uppercase tracking-widest transition-all shadow-xl shadow-ecbCyan/20"
                >
                  Sold
                </button>
                <button 
                  onClick={() => { onSkip(activePlayer.id); setActivePlayer(null); }} 
                  className="flex-1 bg-white hover:bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-400 text-lg uppercase tracking-widest transition-all"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl py-24 px-10 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-ecbGrey rounded-full flex items-center justify-center mb-8 border border-gray-100">
               <Logo className="h-12 w-auto opacity-20 grayscale" />
            </div>
            <h3 className="text-4xl font-black text-ecbNavy mb-4 tracking-tight uppercase italic">Awaiting Next Talent</h3>
            <p className="text-gray-400 max-w-md font-medium text-lg leading-relaxed mb-10">
              The auction floor is clear. Select an athlete from the scouting pool or allow the system to auto-generate the next lot.
            </p>
            <button
              onClick={() => { if (availablePlayers.length > 0) { const randomIndex = Math.floor(Math.random() * availablePlayers.length); handleStartAuction(availablePlayers[randomIndex]); } }}
              className="px-12 py-5 bg-ecbNavy hover:bg-ecbCyan text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all active:scale-95"
            >
              Draw Next Player
            </button>
          </div>
        )}
      </section>

      {/* Analytics Dashboard Segment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-ecbCyan border-b border-gray-100 pb-4">Live Purse Tracking</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {franchises.map(team => (
              <div key={team.id} className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black text-ecbNavy uppercase truncate pr-4">{team.name}</span>
                  <span className="text-[11px] font-black text-ecbCyan">₹{team.budget}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-ecbNavy transition-all duration-1000" style={{ width: `${(team.budget/5000)*100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-8 text-ecbCyan border-b border-gray-100 pb-4">Squad Maturity</h4>
          <div className="grid grid-cols-4 gap-4">
            {franchises.map(team => {
              const hasWK = team.roster.some(p => p.skill.toLowerCase().includes('wk'));
              const isQualified = hasWK && team.roster.length >= 11;
              const isDisqualified = !isQualified && team.budget <= 0;
              const isNotQualified = !isQualified && team.budget > 0;

              return (
                <div key={team.id} className={`p-4 rounded-2xl text-center border transition-all ${
                  isQualified ? 'border-ecbGreen/20 bg-ecbGreen/5' : 
                  isDisqualified ? 'border-red-500/20 bg-red-50' :
                  'border-gray-100 bg-gray-50/30'
                }`}>
                  <div className="text-[10px] font-black text-gray-400 uppercase truncate mb-1">{team.name}</div>
                  <div className={`text-2xl font-black ${isDisqualified ? 'text-red-500' : 'text-ecbNavy'}`}>{team.roster.length}</div>
                  <div className="flex justify-center space-x-1.5 mt-2">
                    <div className={`w-2 h-2 rounded-full ${hasWK ? 'bg-ecbGreen shadow-sm' : 'bg-gray-200'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${team.roster.length >= 11 ? 'bg-ecbCyan shadow-sm' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className={`text-[8px] font-black uppercase mt-2 tracking-tighter ${
                    isQualified ? 'text-ecbGreen' : 
                    isDisqualified ? 'text-red-500' : 
                    'text-amber-500'
                  }`}>
                    {isQualified ? 'QUALIFIED' : isDisqualified ? 'DISQUALIFIED' : 'PENDING'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scouting Pool */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b-2 border-gray-100 pb-6">
          <h2 className="text-3xl font-black text-ecbNavy tracking-tighter uppercase italic flex items-center">
            <div className="w-2 h-8 bg-ecbCyan mr-4 rounded-sm"></div>
            Scouting Database
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-gray-400">{availablePlayers.length} ATHLETES AVAILABLE</span>
          </div>
        </div>
        
        {availablePlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {availablePlayers.map(p => (
              <PlayerCard 
                key={p.id} 
                player={p} 
                onSelect={() => !activePlayer && handleStartAuction(p)} 
                selected={activePlayer?.id === p.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-32 bg-white rounded-3xl shadow-inner border border-gray-100 italic font-medium">
            No remaining athletes found in the database.
          </div>
        )}
      </section>
    </div>
  );
});
