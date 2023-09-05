import {
  CollectionReference,
  DocumentData,
  Query,
  QueryCompositeFilterConstraint,
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase.config';
import { getCurrentUser } from './auth';
import { PicksForm } from '../types';
import { getCurrentWeekId } from './espn';

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

export const getPicks = async (): Promise<PicksForm[]> => {
  const currentWeekId = await getCurrentWeekId();

  const q = query(
    collection(db, 'picks'),
    where('week_id', '==', currentWeekId)
  );
  const querySnapshot = await getDocs(q);
  const picks = querySnapshot.docs.map((doc) => {
    return doc.data() as PicksForm;
  });

  return picks;
};

export const getPicksForCurrentUser = async (): Promise<PicksForm> => {
  const currentWeekId = await getCurrentWeekId();
  const user = getCurrentUser();
  const userId = user.uid;
  const q = query(
    collection(db, 'picks'),
    where('week_id', '==', currentWeekId),
    where('user_id', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  const [doc] = querySnapshot.docs;
  const picks = doc.data() as PicksForm;

  return picks;
};

export const savePicks = async (picks: PicksForm) => {
  const user = getCurrentUser();
  picks.user_id = user.uid;

  if (picks.key) {
    return setDoc(doc(db, 'picks', picks.key), picks);
  }

  return await addDoc(collection(db, 'picks'), picks);
};
