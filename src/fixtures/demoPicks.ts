import { Game, Pick, PicksForm } from '../types';
import { createEmptyPick } from '../utils/picks';

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

export const makeDemoPicks = (matchups: Game[], weekId: string): PicksForm[] => {
  return DemoParticipants.map((participant, participantIndex) => {
    const picks: Pick[] = matchups.map((matchup, matchupIndex) => {
      const slot = createEmptyPick(matchup);

      // Deterministic so the grid doesn't reshuffle between renders.
      // Every third slot is left unpicked to exercise the empty-cell rendering.
      const choice = (participantIndex + matchupIndex) % 3;
      if (choice === 2) {
        return slot;
      }

      return { ...slot, pickedTeam: choice === 0 ? slot.homeTeam : slot.awayTeam };
    });

    return {
      ...participant,
      week_id: weekId,
      tieBreakerPoints: 35 + participantIndex * 3,
      picks,
    };
  });
};
