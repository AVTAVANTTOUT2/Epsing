export interface Ballot {
  voterId: number;
  rankings: Array<{ userId: number; position: number }>;
  mvpUserId?: number | null;
}

export interface WeeklyResult {
  userId: number;
  points: number; // stored ×100, e.g. 785 = 7.85 avg points
  rank: number;
  voteCount: number;
  mvpCount: number;
  isMvp: boolean;
}

export class InvalidBallotError extends Error {
  constructor(
    message: string,
    public readonly voterId: number
  ) {
    super(message);
    this.name = 'InvalidBallotError';
  }
}

/**
 * Validates a ballot and throws InvalidBallotError if invalid.
 * Rules: must rank exactly all activeUserIds, no duplicate positions, no duplicate userIds.
 */
export function validateBallot(ballot: Ballot, activeUserIds: number[]): void {
  const rankableUserIds = activeUserIds.filter(id => id !== ballot.voterId);
  const M = rankableUserIds.length;
  const activeSet = new Set(rankableUserIds);

  if (ballot.rankings.length !== M) {
    throw new InvalidBallotError(
      `Ballot must rank exactly ${M} players, got ${ballot.rankings.length}`,
      ballot.voterId
    );
  }

  if (ballot.mvpUserId && !activeSet.has(ballot.mvpUserId)) {
    throw new InvalidBallotError(
      `MVP userId ${ballot.mvpUserId} is not a valid rankable player`,
      ballot.voterId
    );
  }

  const rankedUsers = new Set<number>();
  const positions = new Set<number>();

  for (const r of ballot.rankings) {
    if (!activeSet.has(r.userId)) {
      throw new InvalidBallotError(
        `UserId ${r.userId} is not in active players list`,
        ballot.voterId
      );
    }
    if (rankedUsers.has(r.userId)) {
      throw new InvalidBallotError(
        `UserId ${r.userId} appears more than once in ballot`,
        ballot.voterId
      );
    }
    if (positions.has(r.position)) {
      throw new InvalidBallotError(
        `Position ${r.position} appears more than once in ballot`,
        ballot.voterId
      );
    }
    if (r.position < 1 || r.position > M) {
      throw new InvalidBallotError(
        `Position ${r.position} out of range [1, ${M}]`,
        ballot.voterId
      );
    }
    rankedUsers.add(r.userId);
    positions.add(r.position);
  }

  for (const userId of rankableUserIds) {
    if (!rankedUsers.has(userId)) {
      throw new InvalidBallotError(
        `UserId ${userId} is missing from ballot`,
        ballot.voterId
      );
    }
  }
}

/**
 * Computes weekly scores from a list of ballots.
 * Invalid ballots are silently skipped (logged in development).
 * Returns results sorted by rank (ascending).
 */
export function computeWeeklyScores(
  ballots: Ballot[],
  activeUserIds: number[]
): WeeklyResult[] {
  const N = activeUserIds.length;

  if (N === 0 || ballots.length === 0) {
    return activeUserIds.map((userId, i) => ({
      userId,
      points: 0,
      rank: i + 1,
      voteCount: 0,
      mvpCount: 0,
      isMvp: false,
    }));
  }

  // Validate and filter ballots
  const validBallots: Ballot[] = [];
  for (const ballot of ballots) {
    try {
      validateBallot(ballot, activeUserIds);
      validBallots.push(ballot);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[scoring] Invalid ballot skipped:`, (e as Error).message);
      }
    }
  }

  const V = validBallots.length;

  if (V === 0) {
    return activeUserIds.map((userId, i) => ({
      userId,
      points: 0,
      rank: i + 1,
      voteCount: 0,
      mvpCount: 0,
      isMvp: false,
    }));
  }

  // Accumulate raw points per user
  const rawPoints = new Map<number, number>(activeUserIds.map((id) => [id, 0]));
  const voteCount = new Map<number, number>(activeUserIds.map((id) => [id, 0]));
  // Track how many times each user was in top 3
  const top3Count = new Map<number, number>(activeUserIds.map((id) => [id, 0]));
  const mvpCountMap = new Map<number, number>(activeUserIds.map((id) => [id, 0]));

  for (const ballot of validBallots) {
    if (ballot.mvpUserId) {
      mvpCountMap.set(ballot.mvpUserId, (mvpCountMap.get(ballot.mvpUserId) ?? 0) + 1);
    }

    for (const { userId, position } of ballot.rankings) {
      // Since voters rank N-1 players, the max position is N-1.
      // We give N - position points. (1st gets N-1 points).
      const pts = N - position;
      rawPoints.set(userId, (rawPoints.get(userId) ?? 0) + pts);
      voteCount.set(userId, (voteCount.get(userId) ?? 0) + 1);
      if (position <= 3) {
        top3Count.set(userId, (top3Count.get(userId) ?? 0) + 1);
      }
    }
  }

  let maxMvp = 0;
  for (const count of mvpCountMap.values()) {
    if (count > maxMvp) maxMvp = count;
  }

  // Build intermediate results with average × 100
  interface Intermediate {
    userId: number;
    avgRaw: number; // exact float average
    points: number; // ×100 rounded to integer
    voteCount: number;
    top3Count: number;
    mvpCount: number;
    isMvp: boolean;
  }

  const intermediates: Intermediate[] = activeUserIds.map((userId) => {
    const total = rawPoints.get(userId) ?? 0;
    const vc = voteCount.get(userId) ?? 0;
    const avg = vc > 0 ? total / V : 0;
    const mvpC = mvpCountMap.get(userId) ?? 0;
    return {
      userId,
      avgRaw: avg,
      points: Math.round(avg * 100),
      voteCount: vc,
      top3Count: top3Count.get(userId) ?? 0,
      mvpCount: mvpC,
      isMvp: mvpC > 0 && mvpC === maxMvp,
    };
  });

  // Sort: descending points → descending top3 → username (need username from outside)
  // Since we don't have usernames here, we'll sort by userId as last resort (caller provides sorted activeUserIds)
  // The caller should pass activeUserIds sorted alphabetically for the last tie-break to be deterministic.
  intermediates.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.top3Count !== a.top3Count) return b.top3Count - a.top3Count;
    // Last resort: by userId (alphabetical username tie-break is handled at DB query level)
    return a.userId - b.userId;
  });

  return intermediates.map((item, index) => ({
    userId: item.userId,
    points: item.points,
    rank: index + 1,
    voteCount: item.voteCount,
    mvpCount: item.mvpCount,
    isMvp: item.isMvp,
  }));
}
