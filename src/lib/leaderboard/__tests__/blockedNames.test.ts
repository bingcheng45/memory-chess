import { isBlockedName } from '@/lib/leaderboard/blockedNames';
import { playerNameProblem } from '@/lib/leaderboard/playerName';

describe('isBlockedName', () => {
  it.each([
    'penis', 'PeNiS', 'p3n1s', 'p.e.n.i.s', 'p e n i s', 'xx_penis_xx', 'xx_fuck_xx', 'Sh1t', '$h!t',
    'b!tch', 'n1gg3r', 'd1ck', 'Dick', 'DICK', 'big dick', 'Moby Dick', 'c0ck', 'a55', 'Cunt', 'sluts', 'Pénis',
    'pu55y', 'd1ld0', 'Dickhead', 'BigDick', 'xXDickXx', 'AssMaster', 'bigcock', 'fck', 'fuk', 'fvck', 'phuck',
    'cvnt', 'niqqer', 'Retard', 'Pedo', ' penis ',
  ])('blocks %s', (name) => {
    expect(isBlockedName(name)).toBe(true);
  });

  it.each([
    'Cassandra', 'Scunthorpe', 'Fares Fakhouri', 'Hancock', 'Janus', 'Grapes', 'Assad', 'Classic', 'Titan',
    'Nigeria', 'Mass Effect', 'Mass Hit', 'Richard', 'Dickens', 'Penelope', 'Bing Cheng', 'Player 455', 'Player 717',
    '717', 'Shitake', 'Mishit', 'Snigger', 'Sniggers', 'Penistone', 'Bitchin', 'Fukuoka', 'McDonald',
  ])('allows %s', (name) => {
    expect(isBlockedName(name)).toBe(false);
  });

  it.each(['f u c k', 'F.U.C.K', 's h i t'])('misses the spaced short spelling %s, a known gap', (name) => {
    expect(isBlockedName(name)).toBe(false);
  });
});

describe('playerNameProblem', () => {
  it('reports length before content', () => {
    expect(playerNameProblem('ab')).toBe('short');
    expect(playerNameProblem('a'.repeat(17))).toBe('long');
  });

  it('rejects an offensive name of valid length', () => {
    expect(playerNameProblem('penis')).toBe('blocked');
    expect(playerNameProblem('P3N1S')).toBe('blocked');
  });

  it('accepts an ordinary name', () => {
    expect(playerNameProblem('Cassandra')).toBeNull();
  });
});
