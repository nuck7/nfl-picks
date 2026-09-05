import { doc, getDoc, setDoc } from 'firebase/firestore';

import { WeekSettings } from '../types';
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
export const setWeekLock = (weekId: string, lockAt: string) =>
  setDoc(doc(db, WeeksCollection, weekId), { weekId, lockAt }, { merge: true });
