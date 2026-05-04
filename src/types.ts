export interface ApiResponse<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code: string;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface User {
  id: number;
  username: string;
  createdAt: string;
  isActive: boolean;
}

export interface Week {
  id: number;
  year: number;
  isoWeek: number;
  votingOpensAt: string;
  votingClosesAt: string;
  status: 'upcoming' | 'open' | 'closed' | 'tallied';
  talliedAt: string | null;
}

export interface Vote {
  id: number;
  userId: number;
  weekId: number;
  submittedAt: string;
}

export interface VoteRanking {
  id: number;
  voteId: number;
  rankedUserId: number;
  position: number;
}

export interface WeeklyScore {
  id: number;
  weekId: number;
  userId: number;
  points: number;
  rank: number;
  voteCount: number;
}

export interface RankedPlayer {
  userId: number;
  username: string;
  points: number;
  rank: number;
  voteCount: number;
  prevRank?: number | null;
}

export interface StatsEntry {
  year: number;
  isoWeek: number;
  points: number;
  rank: number;
  voteCount: number;
}
