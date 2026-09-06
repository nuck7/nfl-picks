import { MenuOption, PaymentMethod, PaymentMethodOption, PicksForm } from './types';

export const EspnRegularSeasonAbbreviation = 'reg';

export const DefaultAvatarImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

export const AppMenuOptions = [
  {
    label: 'Submit Picks',
    link: '/picks',
  },
  // Hidden for now -- neither page carries anything useful yet. The routes are
  // still registered, so an existing link keeps working and un-hiding is a
  // one-word change.
  {
    label: 'Seasons',
    link: '/seasons',
    hidden: true,
  },
  {
    label: 'Teams',
    link: '/teams',
    hidden: true,
  },
  {
    label: 'Standings',
    link: '/standings',
  },
  {
    label: 'Schedule',
    link: '/schedule',
  },
  {
    label: 'Admin',
    link: '/admin',
    adminOnly: true,
  },
];

// The ways money actually reaches the pool. The `value` strings are what land in
// Firestore, so they are also the allowlist in firestore.rules -- adding one here
// means adding it there too, or the write is refused.
export const PaymentMethodOptions: PaymentMethodOption[] = [
  { label: 'Zelle', value: 'zelle' },
  { label: 'Venmo', value: 'venmo' },
  { label: 'Apple Pay', value: 'applepay' },
  { label: 'Cash', value: 'cash' },
];

// Derived rather than written out a second time, so a label can never drift from
// the option the dropdown offers.
export const PaymentMethodLabels = PaymentMethodOptions.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<PaymentMethod, string>
);

export const ProfileMenuOptions: MenuOption[] = [
  {
    label: 'Profile',
    link: '/profile',
    authOnly: true,
  },
  {
    label: 'Log In',
    link: '/',
    anonOnly: true,
  },
  {
    label: 'Log Out',
    link: '/logout',
    authOnly: true,
  },
];

// Returns a fresh object every call. Previously this was a shared module-level
// constant that PickForm mutated in place, which leaked one session's picks into
// the next "empty" form. The picks array is sized from the week's matchups by
// alignPicksToMatchups, since weeks vary between 13 and 16 games.
export const createEmptyPickFormState = (): PicksForm => ({
  user_name: '',
  user_id: '',
  week_id: '',
  tieBreakerPoints: '',
  picks: [],
});
