import { useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import { CurrentUser, Player, UserRole } from '../types';
import { isAdmin } from '../utils/admin';
import { auth, db } from './firebase.config';

const PlayersCollection = 'players';

const FallbackName = 'Unnamed player';

// A blank name would be copied onto every pick as user_name and end up as the
// Standings column header, so nothing is ever written without one. An existing
// stored name wins: upsertCurrentPlayer runs on every sign-in, and a provider
// that returns a null displayName must not blank out a name an admin fixed.
export const resolvePlayerName = (
  firebaseUser: Pick<FirebaseUser, 'displayName' | 'email'>,
  existingName?: string
) =>
  existingName?.trim() ||
  firebaseUser.displayName?.trim() ||
  firebaseUser.email?.split('@')[0]?.trim() ||
  FallbackName;

export const getPlayers = async (): Promise<Player[]> => {
  const snapshot = await getDocs(collection(db, PlayersCollection));

  return snapshot.docs.map((document) => ({
    ...(document.data() as Player),
    id: document.id,
  }));
};

// Written on every sign-in so everyone who has logged in appears on the admin
// page and in the pick-form dropdown without having to submit picks first. The
// existing document is read first so a refresh never demotes an admin or blanks
// a name.
export const upsertCurrentPlayer = async (
  firebaseUser: FirebaseUser
): Promise<Player> => {
  const reference = doc(db, PlayersCollection, firebaseUser.uid);
  const existing = (await getDoc(reference)).data() as Player | undefined;

  // Sign-up sets the display name via updateProfile immediately after the
  // account is created, which can land after onAuthStateChanged has already
  // fired. Prefer the live auth user so that name isn't missed.
  const source = auth.currentUser ?? firebaseUser;

  const record: Player = {
    id: firebaseUser.uid,
    name: resolvePlayerName(source, existing?.name),
    email: source.email ?? existing?.email ?? '',
    role: existing?.role ?? 'member',
    managed: false,
  };

  await setDoc(reference, record, { merge: true });

  return record;
};

// A player with no login. The admin enters their picks for them.
export const addManagedPlayer = async ({
  name,
  email,
}: {
  name: string;
  email?: string;
}): Promise<Player> => {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error('A player needs a name.');
  }

  const record = {
    name: trimmed,
    email: email?.trim() ?? '',
    role: 'member' as UserRole,
    managed: true,
  };

  const created = await addDoc(collection(db, PlayersCollection), record);

  return { ...record, id: created.id };
};

export const setPlayerRole = (playerId: string, role: UserRole) =>
  setDoc(doc(db, PlayersCollection, playerId), { role }, { merge: true });

export const setPlayerName = (playerId: string, name: string) => {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error('A player needs a name.');
  }

  return setDoc(doc(db, PlayersCollection, playerId), { name: trimmed }, { merge: true });
};

export const useCurrentPlayer = (): CurrentUser => {
  const [user, setUser] = useState<Player>();
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(undefined);
          setLoading(false);
          return;
        }

        try {
          setUser(await upsertCurrentPlayer(firebaseUser));
        } catch (error) {
          // Firestore can be unreachable (denied rules, offline). Fall back to
          // the auth details so a seed admin still gets in.
          console.error(error);
          setUser({
            id: firebaseUser.uid,
            name: resolvePlayerName(firebaseUser),
            email: firebaseUser.email ?? '',
            role: 'member',
            managed: false,
          });
        } finally {
          setLoading(false);
        }
      }),
    []
  );

  return { user, isAdmin: isAdmin(user), loading };
};
