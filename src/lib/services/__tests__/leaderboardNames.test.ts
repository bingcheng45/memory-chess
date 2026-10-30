/** @jest-environment node */

import { getLeaderboard, submitLeaderboardEntry } from '@/lib/services/leaderboardService';

const row = (id: string, player_name: string, correct_pieces: number) => ({
  id, player_name, correct_pieces, difficulty: 'medium', piece_count: 16, memorize_time: 30, solution_time: 20,
});

const ROWS = [
  row('1', 'Fares Fakhouri', 16),
  row('2', 'penis', 15),
  row('3', 'fares fakhouri', 14),
  row('4', 'Magnus77', 13),
  row('5', ' FARES FAKHOURI ', 12),
  row('6', 'P3N1S', 11),
  row('7', 'Cassandra', 10),
];

function mockFetch(): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(ROWS), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  );
}

jest.mock('@/lib/supabase', () => ({
  checkSupabaseConnection: jest.fn().mockResolvedValue({ connected: true }),
  supabase: jest
    .requireActual('@supabase/supabase-js')
    .createClient('http://127.0.0.1:1', 'test-anon-key', { global: { fetch: mockFetch } }),
  leaderboardWriter: jest.fn(() => null),
  SUPABASE_WRITES_OFF_REASON: 'writes off',
}));

describe('getLeaderboard names', () => {
  it('drops offensive names and keeps the best row per name in rank order', async () => {
    const { data } = await getLeaderboard({ difficulty: 'medium' });

    expect(data.map((entry) => [entry.id, entry.player_name])).toEqual([
      ['1', 'Fares Fakhouri'],
      ['4', 'Magnus77'],
      ['7', 'Cassandra'],
    ]);
  });
});

describe('submitLeaderboardEntry names', () => {
  it('rejects an offensive name before any write', async () => {
    const result = await submitLeaderboardEntry({
      player_name: 'p3nis', difficulty: 'medium', piece_count: 16, correct_pieces: 16,
      memorize_time: 30, solution_time: 20,
    } as never);

    expect(result).toEqual({ status: 'invalid', message: 'Please choose a different player name' });
  });
});
