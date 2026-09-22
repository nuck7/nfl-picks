import {
  CollectionReference,
  DocumentData,
  QueryCompositeFilterConstraint,
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { PicksForm, Player } from '../types';
import { toPicksDocument } from '../utils/picks';
import { db } from './firebase.config';

export const getDocuments = async (
  collectionRef: CollectionReference<DocumentData, DocumentData>,
  queryParams?: QueryCompositeFilterConstraint
) => {
  const q = queryParams
    ? query(collectionRef, queryParams)
    : query(collectionRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs;
};

// The week is passed in rather than looked up here: this module stores picks,
// and going out to ESPN to discover its own argument is what had /picks and
// /standings resolving the same week three times over.
export const getPicks = async (weekId: string): Promise<PicksForm[]> => {
  const q = query(
    collection(db, 'picks'),
    where('week_id', '==', weekId)
  );
  const querySnapshot = await getDocs(q);
  const picks = querySnapshot.docs.map((doc) => {
    return doc.data() as PicksForm;
  });

  return picks;
};

// What came back, and how much of it. An empty picks array is ambiguous on its
// own -- nobody entered, the week is still private, or the read was refused all
// look identical in a grid -- and that ambiguity is exactly what left members
// staring at a standings page with no columns and no error.
export type WeekPicks = {
  picks: PicksForm[];
  // 'everyone' only when the whole week was actually read.
  scope: 'everyone' | 'mine';
  // The rules refused a read the client believed it was allowed to make. Means
  // the two disagree about whether the week is locked -- see
  // weekIsLockedForReads in resources/weeks.
  denied: boolean;
};

const mineOnly = async (
  weekId: string,
  playerId: string | undefined,
  denied: boolean
): Promise<WeekPicks> => {
  const mine = playerId ? await getPicksForPlayer(weekId, playerId) : undefined;

  return { picks: mine ? [mine] : [], scope: 'mine', denied };
};

// Firestore rejects a refused list with this code; anything else is a real
// failure and should not be quietly downgraded to "you may only see your own".
const isPermissionDenied = (error: unknown): boolean =>
  typeof error === 'object'
  && error !== null
  && (error as { code?: string }).code === 'permission-denied';

// What the standings may ask for. Before the week locks the rules refuse a
// member anyone else's picks -- and refuse the whole query rather than filtering
// the rows they may not have -- so this asks a narrower question instead of
// fetching everything and filtering the answer. Filtering client-side would both
// fail the read and leave the picks in the response.
export const getPicksForWeek = async (
  weekId: string,
  viewer: { playerId?: string; canSeeEveryone: boolean }
): Promise<WeekPicks> => {
  if (!weekId) {
    return { picks: [], scope: 'mine', denied: false };
  }

  if (!viewer.canSeeEveryone) {
    return mineOnly(weekId, viewer.playerId, false);
  }

  try {
    return { picks: await getPicks(weekId), scope: 'everyone', denied: false };
  } catch (error) {
    if (!isPermissionDenied(error)) {
      throw error;
    }

    // The caller was wrong about the week being readable. Rather than let the
    // page render as though nobody had entered, fall back to the one thing the
    // rules always allow -- the viewer's own card -- and say so.
    return mineOnly(weekId, viewer.playerId, true);
  }
};

// Takes the player explicitly rather than reading auth.currentUser, so an admin
// can load the picks of a managed player who has no account at all.
export const getPicksForPlayer = async (
  weekId: string,
  playerId: string
): Promise<PicksForm | undefined> => {
  if (!weekId || !playerId) {
    return undefined;
  }

  const q = query(
    collection(db, 'picks'),
    where('week_id', '==', weekId),
    where('user_id', '==', playerId)
  );
  const querySnapshot = await getDocs(q);
  const [doc] = querySnapshot.docs;

  if (doc) {
    const picks = doc.data() as PicksForm;
    picks.key = doc.id;
    return picks;
  }
};

// The player these picks belong to is passed in, not derived from the session:
// an admin submitting on someone's behalf is saving under their id, not their own.
export const savePicks = async (picks: PicksForm, player: Player) => {
  const document = toPicksDocument(picks, player);

  // `key` is the document's own id, not part of its data, so it is deliberately
  // not in the payload above.
  if (picks.key) {
    await setDoc(doc(db, 'picks', picks.key), document);
    return picks.key;
  }

  // First submission for this user/week: no document exists yet.
  const created = await addDoc(collection(db, 'picks'), document);
  return created.id;
};
