import { useCallback, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

import { CurrentUser, Player, UserRole } from '../types';
import { isAdmin, isOwner } from '../utils/admin';
import { isValidEmail, normalizeEmail } from '../utils/validation';
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

// Alphabetical by display name, for the pickers that offer a player to choose:
// the two dropdowns and the payments table. localeCompare with sensitivity
// 'base' so casing and accents don't split names apart -- "alice" belongs next
// to "Alice", not at the other end of the list.
//
// Deliberately NOT folded into getPlayers. The standings and the print sheet
// take their column order from that same array, and reordering those is a
// different decision from ordering a dropdown.
//
// Returns a copy: every caller holds its array in state, so sorting in place
// would mutate it behind React's back.
export const sortPlayersByName = (players: Player[]): Player[] =>
  [...players].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

// An admin typing in an email the pool already holds. Distinct from a write
// failing, so the admin page can say which player has it rather than blaming
// the Firestore rules. Only addManagedPlayer raises this -- accounts people
// create for themselves are Firebase's business, and its account linking
// already keeps one email to one account there.
export class DuplicateEmailError extends Error {
  constructor(readonly existing: Player) {
    super(`${existing.name} is already in the pool with that email.`);
    this.name = 'DuplicateEmailError';
  }
}

// The whole collection, filtered here, rather than a where('email','==')
// query. Firestore compares strings exactly, so a query would miss the
// Bob@x.com stored against the bob@x.com being typed in -- and that is
// precisely the duplicate this exists to catch. A pool is a dozen or so small
// documents, and this runs only when an admin submits the add-player form.
const findPlayerByEmail = async (email: string): Promise<Player | undefined> => {
  const normalized = normalizeEmail(email);

  return (await getPlayers()).find(
    (player) => normalizeEmail(player.email) === normalized
  );
};

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
  firebaseUser: FirebaseUser,
  nameOverride?: string
): Promise<Player> => {
  const reference = doc(db, PlayersCollection, firebaseUser.uid);
  const existing = (await getDoc(reference)).data() as Player | undefined;

  // Sign-up sets the display name via updateProfile immediately after the
  // account is created, which can land after onAuthStateChanged has already
  // fired. Prefer the live auth user so that name isn't missed.
  const source = auth.currentUser ?? firebaseUser;

  const record: Player = {
    id: firebaseUser.uid,
    // An override wins outright. Sign-up needs this: createUserWithEmailAndPassword
    // fires onAuthStateChanged before updateProfile has run, so the listener's
    // upsert writes the email-derived fallback first -- and resolvePlayerName
    // prefers a stored name, so without the override that wrong name would stick.
    name: nameOverride?.trim() || resolvePlayerName(source, existing?.name),
    email: source.email ?? existing?.email ?? '',
    role: existing?.role ?? 'member',
    managed: false,
  };

  await setDoc(reference, record, { merge: true });

  return record;
};

// A player with no login. The admin enters their picks for them. Both fields are
// required: the name is what appears in the standings, and the email is what
// lets the player be recognised if they ever sign in for themselves.
export const addManagedPlayer = async ({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<Player> => {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName) {
    throw new Error('A player needs a name.');
  }

  if (!isValidEmail(trimmedEmail)) {
    throw new Error('A player needs a valid email.');
  }

  // Both kinds of player count: adding a managed row for someone who already
  // signed in for themselves is the same duplicate as adding the row twice.
  const clash = await findPlayerByEmail(trimmedEmail);

  if (clash) {
    throw new DuplicateEmailError(clash);
  }

  const record = {
    name: trimmedName,
    email: trimmedEmail,
    role: 'member' as UserRole,
    managed: true,
  };

  const created = await addDoc(collection(db, PlayersCollection), record);

  return { ...record, id: created.id };
};

// The roles the app is allowed to write. 'owner' is deliberately absent: it is
// set once by hand in the Firebase console and the rules refuse it from any
// client, so the owner can neither be created nor cleared from this page.
export type GrantableRole = Exclude<UserRole, 'owner'>;

// Only the owner may call this -- the rules enforce it, and the Admin page
// hides the control from everyone else. An admin who tries anyway gets a
// permission error rather than a silent no-op.
export const setPlayerRole = (playerId: string, role: GrantableRole) =>
  setDoc(doc(db, PlayersCollection, playerId), { role }, { merge: true });

export const setPlayerName = (playerId: string, name: string) => {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error('A player needs a name.');
  }

  return setDoc(doc(db, PlayersCollection, playerId), { name: trimmed }, { merge: true });
};

// A player naming themselves -- used both by the sign-up form and the profile
// page. The auth profile is updated so the two don't drift, then the full player
// record is written through upsertCurrentPlayer, which creates the document if
// the auth listener hasn't got there yet. A partial { name } write would be
// rejected on create, since the rules require role and managed to be present.
export const setOwnName = async (name: string) => {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error('A player needs a name.');
  }

  if (!auth.currentUser) {
    throw new Error('Not signed in.');
  }

  await updateProfile(auth.currentUser, { displayName: trimmed });

  return upsertCurrentPlayer(auth.currentUser, trimmed);
};

export const useCurrentPlayer = (): CurrentUser => {
  const [user, setUser] = useState<Player>();
  const [loading, setLoading] = useState(true);

  // Stable identity, so callers can depend on it in an effect without the
  // effect re-running every render. It reads auth.currentUser at call time, so
  // it never goes stale despite the empty dependency list.
  const refresh = useCallback(async () => {
    if (!auth.currentUser) {
      return;
    }
    const existing = (
      await getDoc(doc(db, PlayersCollection, auth.currentUser.uid))
    ).data() as Player | undefined;

    if (existing) {
      setUser({ ...existing, id: auth.currentUser.uid });
    }
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(undefined);
          setLoading(false);
          return;
        }

        // The upsert is async and a sign-out can land while it is still in
        // flight. Without this check its result -- or its failure fallback --
        // arrives after setUser(undefined) and resurrects a signed-out user:
        // the app then renders the whole signed-in shell to nobody, with an
        // empty page, because Firestore rightly refuses every read.
        const isStale = () => auth.currentUser?.uid !== firebaseUser.uid;

        try {
          const player = await upsertCurrentPlayer(firebaseUser);

          if (isStale()) {
            return;
          }

          setUser(player);
        } catch (error) {
          // Firestore can be unreachable (denied rules, offline). Fall back to
          // the auth details so a seed admin still gets in.
          console.error(error);

          if (isStale()) {
            return;
          }

          setUser({
            id: firebaseUser.uid,
            name: resolvePlayerName(firebaseUser),
            email: firebaseUser.email ?? '',
            role: 'member',
            managed: false,
          });
        } finally {
          // A stale callback must not clear the loading flag either; the
          // sign-out path has already done that.
          if (!isStale()) {
            setLoading(false);
          }
        }
      }),
    []
  );

  return { user, isAdmin: isAdmin(user), isOwner: isOwner(user), loading, refresh };
};
