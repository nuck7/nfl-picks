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
  picks.user_name = player.name;
  picks.user_id = player.id;
  if (picks.key) {
    await setDoc(doc(db, 'picks', picks.key), picks);
    return picks.key;
  }

  // First submission for this user/week: no document exists yet.
  const created = await addDoc(collection(db, 'picks'), picks);
  return created.id;
};
