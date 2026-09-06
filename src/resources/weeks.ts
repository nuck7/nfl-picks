import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

import { WeekSettings } from '../types';
import { parseWeekId } from '../utils/espn';
import { db } from './firebase.config';

const WeeksCollection = 'weeks';

// Stored as an ISO string rather than a Firestore Timestamp so the value is the
// same shape everywhere -- the datetime-local input, the deadline comparison and
// the document all speak ISO.
export const getWeekSettings = async (
  weekId: string
): Promise<WeekSettings | undefined> => {
  if (!weekId) {
    return undefined;
  }

  const snapshot = await getDoc(doc(db, WeeksCollection, weekId));

  return snapshot.exists()
    ? ({ ...(snapshot.data() as WeekSettings), weekId })
    : undefined;
};

// An empty lockAt clears the override, putting the week back on the default
// deadline rather than locking it forever.
//
// lockAtMs is the same moment as a number, and it is the field the rules read:
// they gate a member's view of everyone else's picks on the lock having passed,
// and rules have no way to parse the ISO string. The two are written and cleared
// together -- deleteField rather than 0 or null, so that clearing the override
// really does fall through to the seeded defaultLockAtMs rather than pinning the
// week to the epoch and revealing every pick.
export const setWeekLock = (weekId: string, lockAt: string) => {
  const ms = lockAt ? new Date(lockAt).getTime() : Number.NaN;
  const cleared = Number.isNaN(ms);

  return setDoc(
    doc(db, WeeksCollection, weekId),
    {
      weekId,
      lockAt: cleared ? deleteField() : lockAt,
      lockAtMs: cleared ? deleteField() : ms,
    },
    { merge: true }
  );
};

// Every stored week of a season, for the pages that want the whole season's
// winners at once. The collection holds one small document per week, so this is
// a single read rather than one per week; the season is filtered here rather
// than queried because a document-id range query would also have to account for
// the legacy "week-1" documents, which parse to nothing.
export const getSeasonWeeks = async (
  season: number
): Promise<WeekSettings[]> => {
  if (!season) {
    return [];
  }

  const snapshot = await getDocs(collection(db, WeeksCollection));

  return snapshot.docs
    .map((document) => ({
      ...(document.data() as WeekSettings),
      weekId: document.id,
    }))
    .filter((settings) => parseWeekId(settings.weekId)?.season === season);
};

// The admin's confirmed winner for a week. An empty playerId clears it, which
// puts the week back to having no recorded winner rather than recording nobody
// -- the profile Results tab counts stored winners, so a blank string there
// would be a week somebody "won" under an empty name.
export const setWeekWinner = (weekId: string, playerId: string) =>
  setDoc(
    doc(db, WeeksCollection, weekId),
    {
      weekId,
      winnerPlayerId: playerId ? playerId : deleteField(),
    },
    { merge: true }
  );
