import { after, before, beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, deleteDoc, deleteField, getDoc, getDocs, collection, query, serverTimestamp, setDoc, updateDoc, where, Timestamp } from 'firebase/firestore';

let testEnv;

// Personas. Admin comes solely from the player document -- there is no hardcoded
// allowlist, so `stranger` (signed in, no document) must have no powers at all.
const stranger = () =>
  testEnv.authenticatedContext('stranger-uid', { email: 'stranger@example.com' }).firestore();
const admin = () =>
  testEnv.authenticatedContext('admin-uid', { email: 'admin@example.com' }).firestore();
const member = () =>
  testEnv.authenticatedContext('member-uid', { email: 'member@example.com' }).firestore();
const other = () =>
  testEnv.authenticatedContext('other-uid', { email: 'other@example.com' }).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

const player = (overrides = {}) => ({
  name: 'A Player',
  email: '',
  role: 'member',
  managed: false,
  ...overrides,
});

// week_id is a string: the rules interpolate it into a weeks/ document path to
// find the lock time. LockedWeek is in the past, OpenWeek is far in the future,
// and UnseededWeek has no week document at all.
const LockedWeek = '2026_week_1';
const OpenWeek = '2026_week_2';
const UnseededWeek = '2026_week_3';

// Relative to the clock the tests actually run on. Hard-coded dates rot: the
// first version of this file pinned "already locked" to a date that had not
// arrived yet, and the failure looked like a rules bug rather than a stale
// fixture.
const Yesterday = Date.now() - 24 * 60 * 60 * 1000;
const Tomorrow = Date.now() + 24 * 60 * 60 * 1000;

// The pair the app always writes together: the ISO string the UI reads and the
// millis the rules compare against.
const lockFields = (ms, prefix = 'default') =>
  prefix === 'default'
    ? { defaultLockAt: new Date(ms).toISOString(), defaultLockAtMs: ms }
    : { lockAt: new Date(ms).toISOString(), lockAtMs: ms };

const pick = (userId, overrides = {}) => ({
  user_id: userId,
  user_name: 'A Player',
  week_id: LockedWeek,
  tieBreakerPoints: 40,
  picks: [],
  ...overrides,
});

// fetchedAt must be the server's clock, so it is always serverTimestamp() here
// except in the test that proves a client-supplied value is refused.
const cacheDoc = (overrides = {}) => ({
  schemaVersion: 1,
  fetchedAt: serverTimestamp(),
  season: 2026,
  ...overrides,
});

const payment = (playerId, overrides = {}) => ({
  weekId: '2026_week_1',
  playerId,
  method: 'zelle',
  ...overrides,
});

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-nfl-picks',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

// Fixtures are written with rules disabled so they don't have to satisfy the
// rules under test.
beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'players/admin-uid'), player({ name: 'Admin', email: 'admin@example.com', role: 'admin' }));
    await setDoc(doc(db, 'players/member-uid'), player({ name: 'Member', email: 'member@example.com' }));
    await setDoc(doc(db, 'players/other-uid'), player({ name: 'Other', email: 'other@example.com' }));
    await setDoc(doc(db, 'players/managed-1'),
      player({ name: 'Uncle Dave', email: 'dave@example.com', managed: true }));
    await setDoc(doc(db, 'picks/member-pick'), pick('member-uid'));
    await setDoc(doc(db, 'picks/managed-pick'), pick('managed-1'));
    await setDoc(doc(db, 'picks/other-pick'), pick('other-uid'));
    // The same three players again in a week that has not locked yet.
    await setDoc(doc(db, 'picks/member-pick-open'), pick('member-uid', { week_id: OpenWeek }));
    await setDoc(doc(db, 'picks/other-pick-open'), pick('other-uid', { week_id: OpenWeek }));
    // ...and in a week the season seed has never run for.
    await setDoc(doc(db, 'picks/other-pick-unseeded'), pick('other-uid', { week_id: UnseededWeek }));
    await setDoc(doc(db, 'weeks/week-1'), { name: 'Week 1' });
    await setDoc(doc(db, `weeks/${LockedWeek}`), {
      weekId: LockedWeek,
      ...lockFields(Yesterday),
    });
    await setDoc(doc(db, `weeks/${OpenWeek}`), {
      weekId: OpenWeek,
      ...lockFields(Tomorrow),
    });
    await setDoc(doc(db, 'payments/2026_week_1_member-uid'), payment('member-uid'));
    await setDoc(doc(db, 'payments/2026_week_1_other-uid'), payment('other-uid', { method: 'cash' }));
  });
});

describe('admin comes only from the player document', () => {
  it('grants admin when the document says so', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'players/new-managed'),
      player({ managed: true, email: 'managed@example.com' })));
  });

  it('gives a signed-in user with no player document no admin powers', async () => {
    await assertFails(setDoc(doc(stranger(), 'players/new-managed-2'),
      player({ managed: true, email: 'managed@example.com' })));
    await assertFails(setDoc(doc(stranger(), 'picks/forged'), pick('member-uid')));
    await assertFails(updateDoc(doc(stranger(), 'players/member-uid'), { role: 'admin' }));
  });

  it('gives no admin powers to a member whose email matches another player', async () => {
    // Nothing keys off email any more, so impersonating one buys nothing.
    await assertFails(setDoc(doc(member(), 'players/sneaky'),
      player({ managed: true, email: 'managed@example.com' })));
  });
});

describe('players', () => {
  it('lets a signed-in user create their own member record', async () => {
    const db = testEnv.authenticatedContext('fresh-uid', { email: 'fresh@example.com' }).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'players/fresh-uid'), player({ name: 'Fresh', email: 'fresh@example.com' }))
    );
  });

  it('stops a member granting themselves admin', async () => {
    await assertFails(updateDoc(doc(member(), 'players/member-uid'), { role: 'admin' }));
  });

  it('stops a member rewriting their own email', async () => {
    await assertFails(
      updateDoc(doc(member(), 'players/member-uid'), { email: 'someone.else@example.com' })
    );
  });

  it('stops a member marking themselves managed', async () => {
    await assertFails(updateDoc(doc(member(), 'players/member-uid'), { managed: true }));
  });

  it('rejects a blank name on create', async () => {
    const db = testEnv.authenticatedContext('blank-uid', { email: 'blank@example.com' }).firestore();
    await assertFails(setDoc(doc(db, 'players/blank-uid'), player({ name: '' })));
  });

  it('rejects a blank name on update', async () => {
    await assertFails(updateDoc(doc(member(), 'players/member-uid'), { name: '' }));
  });

  it('stops a member creating a record for someone else', async () => {
    await assertFails(setDoc(doc(member(), 'players/someone-else'), player()));
  });

  it('lets a member rename themselves', async () => {
    await assertSucceeds(updateDoc(doc(member(), 'players/member-uid'), { name: 'Chosen Name' }));
  });

  it('stops a member editing another player', async () => {
    await assertFails(updateDoc(doc(member(), 'players/other-uid'), { name: 'Hacked' }));
  });

  it('stops a member adding a managed player', async () => {
    await assertFails(setDoc(doc(member(), 'players/nope'),
      player({ managed: true, email: 'managed@example.com' })));
  });

  it('lets an admin add a managed player with a name and an email', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'players/managed-2'),
      player({ managed: true, name: 'Uncle Dave', email: 'dave@example.com' })));
  });

  it('rejects an admin-added player with no email', async () => {
    await assertFails(setDoc(doc(admin(), 'players/managed-3'),
      player({ managed: true, name: 'No Email', email: '' })));
  });

  it('rejects an admin-added player with no name', async () => {
    await assertFails(setDoc(doc(admin(), 'players/managed-4'),
      player({ managed: true, name: '', email: 'noname@example.com' })));
  });

  it('still lets someone sign up when their provider gives no email', async () => {
    // Self-created players are deliberately not held to the email requirement.
    const db = testEnv.authenticatedContext('noemail-uid', {}).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'players/noemail-uid'), player({ name: 'No Email', email: '' }))
    );
  });

  it('lets an admin rename anyone', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'players/member-uid'), { name: 'Corrected' }));
  });

  it('lets an admin change anyone else\'s role', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'players/member-uid'), { role: 'admin' }));
  });

  it('lets any signed-in user read the roster', async () => {
    await assertSucceeds(getDocs(collection(member(), 'players')));
  });

  it('denies the roster to anonymous users', async () => {
    await assertFails(getDocs(collection(anon(), 'players')));
  });
});

describe('picks', () => {
  it('lets an admin create picks for another player', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'picks/for-managed'), pick('managed-1')));
  });

  it('stops a member creating picks for someone else', async () => {
    await assertFails(setDoc(doc(member(), 'picks/forged'), pick('other-uid')));
  });

  it('lets a member create their own picks', async () => {
    await assertSucceeds(setDoc(doc(member(), 'picks/mine'), pick('member-uid')));
  });

  it('lets a member update their own picks', async () => {
    await assertSucceeds(updateDoc(doc(member(), 'picks/member-pick'), { tieBreakerPoints: 12 }));
  });

  it('stops a member updating someone else\'s picks', async () => {
    await assertFails(updateDoc(doc(other(), 'picks/member-pick'), { tieBreakerPoints: 99 }));
  });

  it('lets an admin update anyone\'s picks', async () => {
    await assertSucceeds(updateDoc(doc(admin(), 'picks/member-pick'), { tieBreakerPoints: 7 }));
  });

  it('stops a member deleting picks', async () => {
    await assertFails(deleteDoc(doc(member(), 'picks/member-pick')));
  });

  it('lets an admin delete picks', async () => {
    await assertSucceeds(deleteDoc(doc(admin(), 'picks/member-pick')));
  });

  it('denies picks to anonymous users', async () => {
    await assertFails(getDoc(doc(anon(), 'picks/member-pick')));
  });
});

// Seeing the pool's picks before the deadline is the whole cheating vector, so
// it is the rules that hold this and not the standings page.
describe('picks stay private until the week locks', () => {
  const weekQuery = (db, weekId) =>
    query(collection(db, 'picks'), where('week_id', '==', weekId));
  const myWeekQuery = (db, weekId, userId) =>
    query(collection(db, 'picks'),
      where('week_id', '==', weekId), where('user_id', '==', userId));

  it('lets a member read their own picks before the lock', async () => {
    await assertSucceeds(getDoc(doc(member(), 'picks/member-pick-open')));
    await assertSucceeds(getDocs(myWeekQuery(member(), OpenWeek, 'member-uid')));
  });

  it('stops a member reading someone else\'s picks before the lock', async () => {
    await assertFails(getDoc(doc(member(), 'picks/other-pick-open')));
  });

  it('refuses a member the whole week before the lock', async () => {
    // Not filtered down to the rows they may have -- refused outright, which is
    // why Standings asks the narrower query until the lock passes.
    await assertFails(getDocs(weekQuery(member(), OpenWeek)));
  });

  it('lets a member read everyone once the week has locked', async () => {
    await assertSucceeds(getDoc(doc(member(), 'picks/other-pick')));
    await assertSucceeds(getDocs(weekQuery(member(), LockedWeek)));
  });

  it('lets an admin read everyone before the lock', async () => {
    await assertSucceeds(getDoc(doc(admin(), 'picks/other-pick-open')));
    await assertSucceeds(getDocs(weekQuery(admin(), OpenWeek)));
  });

  it('hides other players when the week has never been seeded', async () => {
    // No week document means no known deadline, and an unknown deadline must
    // hide picks rather than expose them.
    await assertFails(getDoc(doc(member(), 'picks/other-pick-unseeded')));
  });

  it('lets an admin override reveal a week the seed still has closed', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `weeks/${OpenWeek}`),
        lockFields(Yesterday, 'override'), { merge: true });
    });
    await assertSucceeds(getDoc(doc(member(), 'picks/other-pick-open')));
  });

  it('keeps a week closed when an admin override postpones the lock', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `weeks/${LockedWeek}`),
        lockFields(Tomorrow, 'override'), { merge: true });
    });
    await assertFails(getDoc(doc(member(), 'picks/other-pick')));
  });
});

describe('weeks', () => {
  it('lets a signed-in user read', async () => {
    await assertSucceeds(getDoc(doc(member(), 'weeks/week-1')));
  });

  // The profile Results tab lists the whole collection to find the weeks a
  // player won, so this is a read shape the app actually depends on.
  it('lets a signed-in user list every week', async () => {
    await assertSucceeds(getDocs(collection(member(), 'weeks')));
  });

  it('stops a member writing', async () => {
    await assertFails(setDoc(doc(member(), 'weeks/week-2'), { name: 'Week 2' }));
  });

  it('stops a member recording a winner', async () => {
    await assertFails(
      setDoc(doc(member(), `weeks/${LockedWeek}`), { winnerPlayerId: 'member-uid' },
        { merge: true })
    );
  });

  it('lets an admin record and clear a winner', async () => {
    await assertSucceeds(
      setDoc(doc(admin(), `weeks/${LockedWeek}`), { winnerPlayerId: 'member-uid' },
        { merge: true })
    );
    await assertSucceeds(
      setDoc(doc(admin(), `weeks/${LockedWeek}`), { winnerPlayerId: deleteField() },
        { merge: true })
    );
  });

  it('lets an admin write', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'weeks/week-2'), { name: 'Week 2' }));
  });
});

describe('payments', () => {
  const mine = 'payments/2026_week_1_member-uid';
  const theirs = 'payments/2026_week_1_other-uid';

  const weekQuery = (db) =>
    query(collection(db, 'payments'), where('weekId', '==', '2026_week_1'));
  const ownQuery = (db, playerId) =>
    query(collection(db, 'payments'), where('playerId', '==', playerId));

  it('lets an admin record, change and clear a payment', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'payments/2026_week_1_managed-1'), payment('managed-1')));
    await assertSucceeds(updateDoc(doc(admin(), mine), { method: 'venmo' }));
    await assertSucceeds(deleteDoc(doc(admin(), mine)));
  });

  it('lets an admin read the whole week', async () => {
    await assertSucceeds(getDocs(weekQuery(admin())));
  });

  it('lets a member read their own payment', async () => {
    await assertSucceeds(getDoc(doc(member(), mine)));
  });

  it('lets a member list their own history', async () => {
    await assertSucceeds(getDocs(ownQuery(member(), 'member-uid')));
  });

  // The point of one document per player: a member cannot see what anybody else
  // paid, whether they ask for one row or for the week.
  it('stops a member reading someone else\'s payment', async () => {
    await assertFails(getDoc(doc(member(), theirs)));
  });

  it('stops a member listing the week or another player\'s history', async () => {
    await assertFails(getDocs(weekQuery(member())));
    await assertFails(getDocs(collection(member(), 'payments')));
    await assertFails(getDocs(ownQuery(member(), 'other-uid')));
  });

  it('stops a member recording or clearing a payment', async () => {
    await assertFails(setDoc(doc(member(), mine), payment('member-uid', { method: 'cash' })));
    await assertFails(setDoc(doc(member(), 'payments/2026_week_2_member-uid'),
      payment('member-uid', { weekId: '2026_week_2' })));
    await assertFails(deleteDoc(doc(member(), mine)));
  });

  it('denies payments to anonymous users', async () => {
    await assertFails(getDoc(doc(anon(), mine)));
  });

  it('refuses an unknown payment method', async () => {
    await assertFails(setDoc(doc(admin(), mine), payment('member-uid', { method: 'bitcoin' })));
    await assertFails(setDoc(doc(admin(), mine), payment('member-uid', { method: '' })));
  });

  it('refuses a payment carrying an extra or missing field', async () => {
    await assertFails(setDoc(doc(admin(), mine), payment('member-uid', { amount: 20 })));
    await assertFails(setDoc(doc(admin(), mine), { weekId: '2026_week_1', method: 'cash' }));
  });
});

describe('cache', () => {
  const weekDocId = 'cache/matchups_2026_week_1';

  it('lets a signed-in user read', async () => {
    await assertSucceeds(getDoc(doc(member(), weekDocId)));
  });

  it('denies reads to anonymous users', async () => {
    await assertFails(getDoc(doc(anon(), weekDocId)));
  });

  it('lets an admin seed a week of games', async () => {
    await assertSucceeds(setDoc(doc(admin(), weekDocId), cacheDoc({
      week: 1,
      weekId: '2026_week_1',
      games: [{ matchupId: '401', home: { id: '26' }, away: { id: '17' } }],
    })));
  });

  it('lets an admin seed the season and the teams', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'cache/season_2026'), cacheDoc({
      start: '2026-09-06T07:00Z',
      end: '2027-01-13T07:59Z',
      weeks: [{ week: 1, label: 'Week 1' }],
    })));
    await assertSucceeds(setDoc(doc(admin(), 'cache/teams_2026'), cacheDoc({
      teams: [{ id: '26', displayName: 'Seattle Seahawks' }],
    })));
  });

  // The standings grade picks off the winner flag in these documents, so a
  // member being able to write here would mean a member could change who won.
  it('stops a member writing', async () => {
    await assertFails(setDoc(doc(member(), weekDocId), cacheDoc({ games: [] })));
  });

  it('stops a stranger and an anonymous user writing', async () => {
    await assertFails(setDoc(doc(stranger(), weekDocId), cacheDoc({ games: [] })));
    await assertFails(setDoc(doc(anon(), weekDocId), cacheDoc({ games: [] })));
  });

  it('refuses a document id outside the allowlist', async () => {
    await assertFails(setDoc(doc(admin(), 'cache/junk'), cacheDoc()));
    await assertFails(setDoc(doc(admin(), 'cache/matchups_20260_week_1'), cacheDoc()));
    await assertFails(setDoc(doc(admin(), 'cache/season_26'), cacheDoc()));
  });

  it('refuses a client-supplied fetchedAt', async () => {
    await assertFails(setDoc(doc(admin(), weekDocId), cacheDoc({
      fetchedAt: Timestamp.fromDate(new Date('2020-01-01')),
    })));
  });

  it('refuses a missing envelope field or a wrong type', async () => {
    await assertFails(setDoc(doc(admin(), weekDocId), { season: 2026, fetchedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(admin(), weekDocId), cacheDoc({ schemaVersion: 'one' })));
    await assertFails(setDoc(doc(admin(), weekDocId), cacheDoc({ season: '2026' })));
  });
});

describe('superseded collections', () => {
  it('denies the leftover users, matchups and teams collections to everyone', async () => {
    await assertFails(getDoc(doc(member(), 'users/anything')));
    await assertFails(getDoc(doc(admin(), 'matchups/anything')));
    await assertFails(setDoc(doc(admin(), 'teams/anything'), { name: 'Nope' }));
  });
});
