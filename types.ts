
export enum PlayerSkill {
  BATSMAN = 'Batter',
  BOWLER = 'Bowler',
  ALL_ROUNDER = 'All-Rounder',
  WICKETKEEPER = 'WK-Batter'
}

export interface PlayerStats {
  matches: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
  fifties?: number;
  thirties?: number;
}

export interface Player {
  id: string;
  name: string;
  skill: string; // Changed to string to support more flexible role names from web
  basePrice: number;
  country: string;
  rating: number; // 0-100
  teamId?: string;
  soldPrice?: number;
  isSold: boolean;
  stats?: PlayerStats;
  originalTeam?: string; // Which team they belonged to in 2024/25
}

export interface Franchise {
  id: string;
  name: string;
  budget: number;
  roster: Player[];
  color: string;
}

export interface AuctionState {
  currentPhase: 'PRE_AUCTION' | 'LIVE_AUCTION' | 'POST_AUCTION';
  currentPlayerId: string | null;
  currentBid: number;
  lastBidderId: string | null;
  bidHistory: { teamId: string; amount: number }[];
}
