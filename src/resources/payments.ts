import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { PaymentMethod, WeekPayment } from '../types';
import { db } from './firebase.config';

const PaymentsCollection = 'payments';

// One document per player per week, rather than one document per week holding a
// map of everybody. Firestore rules cannot hide a field, so a single shared
// document would mean any member who could read their own entry could read the
// whole pool's. Splitting them is what makes "a player sees only their own" a
// rule the server enforces rather than something the UI merely hides.
export const paymentDocId = (weekId: string, playerId: string) =>
  `${weekId}_${playerId}`;

const toWeekPayment = (data: unknown) => data as WeekPayment;

// Every payment for one week. Admin-only under the rules: a member's unfiltered
// query is refused whole, so callers must check isAdmin before asking.
export const getWeekPayments = async (
  weekId: string
): Promise<WeekPayment[]> => {
  if (!weekId) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, PaymentsCollection), where('weekId', '==', weekId))
  );

  return snapshot.docs.map((document) => toWeekPayment(document.data()));
};

// One player's whole history, for the Payments section of their own Profile. The
// playerId filter is what makes this pass the rules for a member -- an
// unconstrained read of the collection would not.
export const getPlayerPayments = async (
  playerId: string
): Promise<WeekPayment[]> => {
  if (!playerId) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, PaymentsCollection), where('playerId', '==', playerId))
  );

  return snapshot.docs.map((document) => toWeekPayment(document.data()));
};

export const setPlayerPayment = (
  weekId: string,
  playerId: string,
  method: PaymentMethod
) =>
  setDoc(doc(db, PaymentsCollection, paymentDocId(weekId, playerId)), {
    weekId,
    playerId,
    method,
  });

// Unpaid is the absence of a record, so clearing one removes the document rather
// than writing a flag nothing else would ever read.
export const clearPlayerPayment = (weekId: string, playerId: string) =>
  deleteDoc(doc(db, PaymentsCollection, paymentDocId(weekId, playerId)));

// Both the admin table and the standings header want the week's payments keyed by
// player, which is the shape a per-row lookup needs.
export const toPaymentsByPlayer = (payments: WeekPayment[]) =>
  payments.reduce(
    (byPlayer, payment) => ({ ...byPlayer, [payment.playerId]: payment.method }),
    {} as Record<string, PaymentMethod>
  );
