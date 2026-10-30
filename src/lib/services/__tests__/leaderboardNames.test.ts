/** @jest-environment node */

import { getLeaderboard, submitLeaderboardEntry } from '@/lib/services/leaderboardService';

const row = (id: string, player_name: string, correct_pieces: number) => ({
  id, player_name, correct_pieces, difficulty: 'medium', piece_count: 16, memorize_time: 30, solution_time: 20,
});

const ROWS = [
  row('1', 'Fares Fakhouri', 16),
  row('2', 'penis', 15),
  row('3', 'fares fakhouri', 14),
  row('4', 'fck', 13),
  row('5', ' PENIS ', 12),
  row('6', 'Magnus77', 11),
  row('7', 'Cassandra', 10),
];

let mockRows: unknown[] = ROWS;

function mockFetch(input: RequestInfo | URL): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
  const limit = Number(url.searchParams.get('limit') ?? mockRows.length);
  return Promise.resolve(
    new Response(JSON.stringify(mockRows.slice(0, limit)), { status: 200, headers: { 'Content-Type': 'application/json' } }),
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
  afterEach(() => {
    mockRows = ROWS;
  });

  it('drops offensive names of any length or padding and keeps every other row in rank order', async () => {
    const { data } = await getLeaderboard({ difficulty: 'medium' });

    expect(data.map((entry) => [entry.id, entry.player_name])).toEqual([
      ['1', 'Fares Fakhouri'],
      ['3', 'fares fakhouri'],
      ['6', 'Magnus77'],
      ['7', 'Cassandra'],
    ]);
  });

  it('fills the board to the row limit from the rows past it when offensive rows are hidden', async () => {
    const players = Array.from({ length: 230 }, (_, index) => row(`r${index}`, `Player${index}`, 500 - index));
    mockRows = [row('x1', 'penis', 600), row('x2', 'fuk', 599), ...players];

    const { data } = await getLeaderboard({ difficulty: 'medium' });

    expect([data.length, data[0].id, data[199].id]).toEqual([200, 'r0', 'r199']);
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
