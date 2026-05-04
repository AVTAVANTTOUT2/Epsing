import { describe, it, expect } from 'vitest';
import {
  computeWeeklyScores,
  validateBallot,
  InvalidBallotError,
  type Ballot,
} from '../src/lib/scoring';

describe('computeWeeklyScores', () => {
  it('5 players, 3 identical ballots → 1st has max average', () => {
    const players = [1, 2, 3, 4, 5];
    const ballot = (voterId: number): Ballot => ({
      voterId,
      rankings: [
        { userId: 1, position: 1 },
        { userId: 2, position: 2 },
        { userId: 3, position: 3 },
        { userId: 4, position: 4 },
        { userId: 5, position: 5 },
      ],
    });
    const results = computeWeeklyScores([ballot(10), ballot(11), ballot(12)], players);
    const first = results[0];
    const fifth = results[4];
    expect(first).toBeDefined();
    expect(fifth).toBeDefined();
    expect(first!.userId).toBe(1);
    expect(first!.rank).toBe(1);
    // Player 1 at pos 1 → 5 pts per ballot, avg = 5.00 → points = 500
    expect(first!.points).toBe(500);
    // Player 5 at pos 5 → 1 pt per ballot, avg = 1.00 → points = 100
    expect(fifth!.userId).toBe(5);
    expect(fifth!.points).toBe(100);
  });

  it('5 players, 3 voters with opposite rankings → middle players get middle scores', () => {
    const players = [1, 2, 3, 4, 5];
    const ballots: Ballot[] = [
      {
        voterId: 10,
        rankings: [
          { userId: 1, position: 1 },
          { userId: 2, position: 2 },
          { userId: 3, position: 3 },
          { userId: 4, position: 4 },
          { userId: 5, position: 5 },
        ],
      },
      {
        voterId: 11,
        rankings: [
          { userId: 5, position: 1 },
          { userId: 4, position: 2 },
          { userId: 3, position: 3 },
          { userId: 2, position: 4 },
          { userId: 1, position: 5 },
        ],
      },
      {
        voterId: 12,
        rankings: [
          { userId: 3, position: 1 },
          { userId: 1, position: 2 },
          { userId: 2, position: 3 },
          { userId: 4, position: 4 },
          { userId: 5, position: 5 },
        ],
      },
    ];
    const results = computeWeeklyScores(ballots, players);
    // user3 gets: 3 + 3 + 5 = 11 pts over 3 voters → avg = 11/3 ≈ 3.67 → 367
    const user3 = results.find((r) => r.userId === 3);
    const user1 = results.find((r) => r.userId === 1);
    expect(user3).toBeDefined();
    expect(user1).toBeDefined();
    expect(user3!.points).toBe(367);
    // user1: 5 + 1 + 4 = 10 pts → 10/3 ≈ 3.33 → 333
    expect(user1!.points).toBe(333);
  });

  it('1 voter → ranking equals ballot order', () => {
    const players = [1, 2, 3];
    const ballots: Ballot[] = [
      {
        voterId: 10,
        rankings: [
          { userId: 2, position: 1 },
          { userId: 3, position: 2 },
          { userId: 1, position: 3 },
        ],
      },
    ];
    const results = computeWeeklyScores(ballots, players);
    expect(results[0]!.userId).toBe(2);
    expect(results[1]!.userId).toBe(3);
    expect(results[2]!.userId).toBe(1);
  });

  it('ballot missing a player → silently skipped, 0 points for all', () => {
    const players = [1, 2, 3];
    const ballots: Ballot[] = [
      {
        voterId: 10,
        rankings: [
          { userId: 1, position: 1 },
          { userId: 2, position: 2 },
          // userId 3 missing
        ],
      },
    ];
    // Invalid ballot → 0 valid ballots → all get 0 points
    const results = computeWeeklyScores(ballots, players);
    expect(results.every((r) => r.points === 0)).toBe(true);
    expect(results.every((r) => r.voteCount === 0)).toBe(true);
  });

  it('ballot with duplicate position → rejected', () => {
    const players = [1, 2, 3];
    const ballot: Ballot = {
      voterId: 10,
      rankings: [
        { userId: 1, position: 1 },
        { userId: 2, position: 1 }, // duplicate position
        { userId: 3, position: 3 },
      ],
    };
    expect(() => validateBallot(ballot, players)).toThrow(InvalidBallotError);
    expect(() => validateBallot(ballot, players)).toThrow('Position 1 appears more than once');
  });

  it('ballot with userId outside activeUserIds → rejected', () => {
    const players = [1, 2, 3];
    const ballot: Ballot = {
      voterId: 10,
      rankings: [
        { userId: 1, position: 1 },
        { userId: 2, position: 2 },
        { userId: 99, position: 3 }, // not in active list
      ],
    };
    expect(() => validateBallot(ballot, players)).toThrow(InvalidBallotError);
    expect(() => validateBallot(ballot, players)).toThrow('not in active players list');
  });

  it('tie-break: player with more top-3 finishes wins when points are equal', () => {
    const players = [1, 2, 3, 4];
    const ballots: Ballot[] = [
      {
        voterId: 10,
        rankings: [
          { userId: 1, position: 1 },
          { userId: 2, position: 2 },
          { userId: 3, position: 3 },
          { userId: 4, position: 4 },
        ],
      },
      {
        voterId: 11,
        rankings: [
          { userId: 2, position: 1 },
          { userId: 1, position: 2 },
          { userId: 3, position: 3 },
          { userId: 4, position: 4 },
        ],
      },
      {
        voterId: 12,
        rankings: [
          { userId: 1, position: 1 },
          { userId: 3, position: 2 },
          { userId: 4, position: 3 },
          { userId: 2, position: 4 },
        ],
      },
      {
        voterId: 13,
        rankings: [
          { userId: 4, position: 1 },
          { userId: 3, position: 2 },
          { userId: 2, position: 3 },
          { userId: 1, position: 4 },
        ],
      },
    ];
    const results = computeWeeklyScores(ballots, players);
    const user1 = results.find((r) => r.userId === 1)!;
    const user2 = results.find((r) => r.userId === 2)!;
    // user1 total: 4+3+4+1 = 12 → avg=3 → points=300
    // user2 total: 3+4+1+2 = 10 → avg=2.5 → points=250
    expect(user1.points).toBe(300);
    expect(user2.points).toBe(250);
    expect(user1.rank).toBeLessThan(user2.rank);
  });

  it('tie-break: alphabetical order by userId as last resort', () => {
    const players = [1, 2];
    const ballots: Ballot[] = [
      {
        voterId: 10,
        rankings: [
          { userId: 1, position: 1 },
          { userId: 2, position: 2 },
        ],
      },
      {
        voterId: 11,
        rankings: [
          { userId: 2, position: 1 },
          { userId: 1, position: 2 },
        ],
      },
    ];
    // user1: 2+1=3, avg=1.5→150; user2: 1+2=3, avg=1.5→150 → exact tie
    // Last resort: lower userId first → user1 rank 1
    const results = computeWeeklyScores(ballots, players);
    expect(results[0]!.userId).toBe(1);
    expect(results[0]!.rank).toBe(1);
    expect(results[1]!.userId).toBe(2);
    expect(results[1]!.rank).toBe(2);
    expect(results[0]!.points).toBe(results[1]!.points);
  });

  it('voteCount reflects how many valid ballots included each player', () => {
    const players = [1, 2, 3];
    const ballots: Ballot[] = [
      {
        voterId: 10,
        rankings: [
          { userId: 1, position: 1 },
          { userId: 2, position: 2 },
          { userId: 3, position: 3 },
        ],
      },
      {
        voterId: 11,
        rankings: [
          { userId: 1, position: 2 },
          { userId: 2, position: 1 },
          { userId: 3, position: 3 },
        ],
      },
    ];
    const results = computeWeeklyScores(ballots, players);
    expect(results.every((r) => r.voteCount === 2)).toBe(true);
  });
});
