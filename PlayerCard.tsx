import React from 'react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
  selected?: boolean;
}

const getRoleBadge = (role: string) => {
  const r = role.toLowerCase();
  if (r.includes('wk')) return 'bg-orange-500';
  if (r.includes('batter')) return 'bg-ecbCyan';
  if (r.includes('bowler')) return 'bg-ecbNavy';
  if (r.includes('all-rounder')) return 'bg-ecbGreen';
  return 'bg-gray-500';
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onSelect, selected }) => {
  return (
    <div 
      onClick={() => onSelect?.(player)}
      className={`group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all border-2 cursor-pointer overflow-hidden flex flex-col h-full ${
        selected ? 'border-ecbCyan ring-4 ring-ecbCyan/10' : 'border-transparent'
      }`}
    >
      <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        <div className="absolute top-4 left-4 z-10">
           <span className={`text-[10px] font-black text-white px-3 py-1 rounded-full uppercase tracking-tighter ${getRoleBadge(player.skill)}`}>
             {player.skill}
           </span>
        </div>
        <div className="text-ecbNavy/5 font-black text-9xl select-none">{player.name.charAt(0)}</div>
        
        {player.isSold && (
          <div className="absolute inset-0 bg-ecbNavy/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in zoom-in duration-300">
             <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-ecbCyan">Acquired By</div>
             <div className="text-2xl font-black mb-2 italic">₹{player.soldPrice}</div>
             <div className="w-8 h-1 bg-ecbCyan rounded-full"></div>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-black text-ecbNavy leading-tight group-hover:text-ecbCyan transition-colors">
            {player.name}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {player.country} {player.originalTeam && `• ${player.originalTeam}`}
          </p>
        </div>

        {player.stats && (
          <div className="grid grid-cols-4 gap-2 py-4 border-y border-gray-100 mb-4 bg-gray-50/50 -mx-5 px-5">
            <div className="text-center">
              <div className="text-[9px] font-black text-gray-400 uppercase">Mat</div>
              <div className="text-sm font-black text-ecbNavy">{player.stats.matches}</div>
            </div>
            {player.stats.runs !== undefined && (
              <div className="text-center">
                <div className="text-[9px] font-black text-gray-400 uppercase">Runs</div>
                <div className="text-sm font-black text-ecbNavy">{player.stats.runs}</div>
              </div>
            )}
            {player.stats.wickets !== undefined && (
              <div className="text-center">
                <div className="text-[9px] font-black text-gray-400 uppercase">Wkts</div>
                <div className="text-sm font-black text-ecbNavy">{player.stats.wickets}</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-[9px] font-black text-gray-400 uppercase">{player.stats.strikeRate ? 'S/R' : 'Eco'}</div>
              <div className="text-sm font-black text-ecbCyan">{player.stats.strikeRate || player.stats.economy}</div>
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-gray-400 uppercase">Power</span>
            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-ecbCyan" style={{ width: `${player.rating}%` }}></div>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-gray-400 uppercase leading-none">Base</div>
             <div className="text-lg font-black text-ecbNavy">₹{player.basePrice}</div>
          </div>
        </div>
      </div>
    </div>
  );
};