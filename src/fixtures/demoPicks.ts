import { Game, Pick, PicksForm } from '../types';
import { createEmptyPick } from '../utils/picks';

// Demo participants are appended to the real picks when the page is loaded with
// ?demo=1, so the standings grid can be seen at full width without waiting on
// real submissions.
export const isDemoMode = () =>
  new URLSearchParams(window.location.search).get('demo') === '1';

// Fifteen, which is a full pool -- the size the standings grid actually has to
// survive. Name lengths vary on purpose: a column is sized by its header, so a
// mix of "Jo" and "Christopher Vandenberg" is what proves the pick tiles stay
// the same size regardless of the name above them.
const DemoParticipants = [
  { user_id: 'demo-1', user_name: 'Demo Nick' },
  { user_id: 'demo-2', user_name: 'Sam' },
  { user_id: 'demo-3', user_name: 'Alexandra Whitfield' },
  { user_id: 'demo-4', user_name: 'Jo' },
  { user_id: 'demo-5', user_name: 'Pat Boyle' },
  { user_id: 'demo-6', user_name: 'Christopher Vandenberg' },
  { user_id: 'demo-7', user_name: 'Ray' },
  { user_id: 'demo-8', user_name: 'Marcus Ellington' },
  { user_id: 'demo-9', user_name: 'Tess' },
  { user_id: 'demo-10', user_name: 'Danielle Cruz' },
  { user_id: 'demo-11', user_name: 'Omar' },
  { user_id: 'demo-12', user_name: 'Priya Raghunathan' },
  { user_id: 'demo-13', user_name: 'Wes' },
  { user_id: 'demo-14', user_name: 'Gabriela Santos' },
  { user_id: 'demo-15', user_name: 'Hal' },
];

export const makeDemoPicks = (matchups: Game[], weekId: string): PicksForm[] => {
  return DemoParticipants.map((participant, participantIndex) => {
    const picks: Pick[] = matchups.map((matchup, matchupIndex) => {
      const slot = createEmptyPick(matchup);

      // Every slot is filled. The standings only give a column to a participant
      // with a complete card -- see hasCompletePicks -- so the previous fixture,
      // which left every third slot blank to exercise the empty cell, stopped
      // producing any demo columns at all once that filter landed.
      //
      // Coprime multipliers so the two sides split differently for each
      // participant, and deterministic so the grid doesn't reshuffle between
      // renders.
      const pickHome = (participantIndex * 7 + matchupIndex * 3) % 2 === 0;

      return { ...slot, pickedTeam: pickHome ? slot.homeTeam : slot.awayTeam };
    });

    return {
      ...participant,
      week_id: weekId,
      tieBreakerPoints: 35 + participantIndex * 2,
      picks,
    };
  });
};
