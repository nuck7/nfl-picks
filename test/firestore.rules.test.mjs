import { after, before, beforeEach, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, deleteDoc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';

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

const pick = (userId) => ({
  user_id: userId,
  user_name: 'A Player',
  week_id: 1,
  tieBreakerPoints: 40,
  picks: [],
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
    await setDoc(doc(db, 'weeks/week-1'), { name: 'Week 1' });
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

  it('lets any signed-in user read all picks', async () => {
    await assertSucceeds(getDocs(collection(member(), 'picks')));
  });

  it('denies picks to anonymous users', async () => {
    await assertFails(getDoc(doc(anon(), 'picks/member-pick')));
  });
});

describe('weeks', () => {
  it('lets a signed-in user read', async () => {
    await assertSucceeds(getDoc(doc(member(), 'weeks/week-1')));
  });

  it('stops a member writing', async () => {
    await assertFails(setDoc(doc(member(), 'weeks/week-2'), { name: 'Week 2' }));
  });

  it('lets an admin write', async () => {
    await assertSucceeds(setDoc(doc(admin(), 'weeks/week-2'), { name: 'Week 2' }));
  });
});
