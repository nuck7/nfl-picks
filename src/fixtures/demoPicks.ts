import { EspnMatchup, PicksForm, TeamsKeyed } from '../types';
import { getMatchupId, getTeamByHomeAway } from '../utils/teams';

// Demo participants are appended to the real picks when the page is loaded with
// ?demo=1, so the standings grid can be seen without waiting on real submissions.
export const isDemoMode = () =>
  new URLSearchParams(window.location.search).get('demo') === '1';

const DemoParticipants = [
  { user_id: 'demo-1', user_name: 'Demo Nick' },
  { user_id: 'demo-2', user_name: 'Demo Sam' },
  { user_id: 'demo-3', user_name: 'Demo Alex' },
  { user_id: 'demo-4', user_name: 'Demo Jo' },
  { user_id: 'demo-5', user_name: 'Demo Pat' },
];

export const makeDemoPicks = (
  matchups: EspnMatchup[],
  teams: TeamsKeyed,
  weekId: number | ''
): PicksForm[] => {
  return DemoParticipants.map((participant, participantIndex) => {
    const picks = matchups.map((matchup, matchupIndex) => {
      const homeTeam = getTeamByHomeAway(teams, matchup, 'home');
      const awayTeam = getTeamByHomeAway(teams, matchup, 'away');

      const home = { id: homeTeam?.id ?? 0, name: homeTeam?.displayName ?? '' };
      const away = { id: awayTeam?.id ?? 0, name: awayTeam?.displayName ?? '' };

      // Deterministic so the grid doesn't reshuffle between renders.
      // Every third slot is left unpicked to exercise the empty-cell rendering.
      const choice = (participantIndex + matchupIndex) % 3;
      const pickedTeam =
        choice === 0 ? home : choice === 1 ? away : { id: 0, name: '' };

      return {
        matchupId: getMatchupId(matchup),
        homeTeam: home,
        awayTeam: away,
        pickedTeam,
      };
    });

    return {
      ...participant,
      week_id: weekId,
      tieBreakerPoints: 35 + participantIndex * 3,
      picks,
    };
  });
};
