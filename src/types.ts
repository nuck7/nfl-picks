import { Timestamp } from 'firebase/firestore';

export type MenuOption = {
  link: string;
  label: string;
  adminOnly?: boolean;
  // Shown only when signed in / only when signed out. Without these, Log In and
  // Log Out both render regardless of whether anyone is actually signed in.
  authOnly?: boolean;
  anonOnly?: boolean;
  // Kept out of the menus without removing the route, for pages that aren't
  // useful yet. Flip to false to bring one back.
  hidden?: boolean;
};

export type UserRole = 'admin' | 'member';

export type Player = {
  // The Firebase Auth uid for anyone with an account, an auto-id for a managed
  // player. Stored on each pick as user_id.
  id: string;
  // Always non-empty -- see resolvePlayerName in resources/players.ts.
  name: string;
  email: string;
  role: UserRole;
  // true = no login; an admin enters this player's picks for them.
  managed: boolean;
};

export type CurrentUser = {
  user?: Player;
  isAdmin: boolean;
  loading: boolean;
  // Re-reads the player document, so a name change is reflected immediately
  // rather than only after the next sign-in.
  refresh: () => Promise<void>;
};

// The old weeks collection, read by the unlinked /weeks page.
export type Week = {
  id: string;
  name: string;
  start: Timestamp;
  end: Timestamp;
};

/* -------------------------------------------------------------------------
 * ESPN site API wire types
 *
 * Only the fields we read; ESPN sends a great deal more. These stay inside
 * resources/espn.ts -- everything else in the app uses the mapped types below,
 * so a change at ESPN's end lands in one mapper rather than across components.
 * ---------------------------------------------------------------------- */

export type EspnSiteTeam = {
  id: string;
  location: string;
  name: string;
  displayName: string;
  abbreviation: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
};

export type EspnCompetitor = {
  id: string;
  homeAway: string;
  // A string on the wire, and absent before kickoff.
  score?: string;
  winner?: boolean;
  team: EspnSiteTeam;
};

export type EspnStatus = {
  type: {
    name: string;
    // 'pre' | 'in' | 'post'
    state: string;
    completed: boolean;
  };
};

export type EspnCompetition = {
  id: string;
  date: string;
  status: EspnStatus;
  competitors: EspnCompetitor[];
};

export type EspnEvent = {
  id: string;
  date: string;
  name: string;
  shortName: string;
  // Present when a response spans more than one week.
  week?: { number: number };
  competitions: EspnCompetition[];
};

export type EspnCalendarWeek = {
  label: string;
  // The week number, as a string.
  value: string;
  startDate: string;
  endDate: string;
};

// One entry per season type (preseason, regular season, postseason). The
// regular season is value '2'.
export type EspnCalendarEntry = {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
  entries?: EspnCalendarWeek[];
};

export type EspnLeague = {
  calendar: EspnCalendarEntry[];
  season: {
    year: number;
    startDate: string;
    endDate: string;
  };
};

export type EspnScoreboard = {
  leagues: EspnLeague[];
  season: { type: number; year: number };
  week: { number: number };
  events: EspnEvent[];
};

/* -------------------------------------------------------------------------
 * App-owned types, mapped from the wire shapes above.
 * ---------------------------------------------------------------------- */

export type Team = {
  id: string;
  // "New England" / "Patriots" / "New England Patriots" / "NE"
  location: string;
  name: string;
  displayName: string;
  abbreviation: string;
  color?: string;
  // Used when two teams' primaries are too close to tell apart in a matchup
  // band -- DAL, NE and SEA are all #002a5c, LV and PIT are both #000000.
  alternateColor?: string;
  logo?: string;
};

export type TeamsKeyed = {
  [key: string]: Team;
};

// One side of a game. The name is carried so a schedule renders before the
// teams have loaded; the logo is looked up from TeamsKeyed, since the URL is
// the same every week and would otherwise be duplicated 18 times over.
export type GameTeam = {
  id: string;
  displayName: string;
  abbreviation: string;
  score: number;
  winner: boolean;
};

export type Game = {
  // ESPN's competition id. Stored on every pick, and stable across both the
  // core and the site API, so existing pick documents keep matching.
  matchupId: string;
  date: string;
  // "NE @ SEA"
  shortName: string;
  // ESPN's status name, e.g. STATUS_SCHEDULED / STATUS_FINAL.
  status: string;
  // 'pre' | 'in' | 'post'
  state: string;
  completed: boolean;
  home: GameTeam;
  away: GameTeam;
};

// Per-week admin overrides. lockAt is an ISO string; empty means no override,
// so the week falls back to the default deadline computed from kickoffs.
export type WeekSettings = {
  weekId: string;
  // The admin's override, absent until one is set. ISO because that is the one
  // shape the datetime-local input, the deadline comparison and the document
  // all agree on.
  lockAt?: string;
  // The same moment in epoch millis. Firestore rules cannot parse an ISO string
  // into a timestamp -- there is no timestamp.parse() -- so this number is what
  // gates a member's read of anyone else's picks, and the string above is what
  // the UI speaks. Written and cleared together with lockAt.
  lockAtMs?: number;
  // The deadline derived from the schedule (noon on the day of the week's first
  // game), written for every week by the season seed so the rules always have a
  // lock time to compare against. The override wins when present.
  defaultLockAt?: string;
  defaultLockAtMs?: number;
  // Who won the week, as a player id. The app works out who it should be from
  // the picks and the results, but nothing is stored until an admin confirms it
  // on the Results tab -- and they can name someone else instead, which is what
  // makes this an override rather than a cache of the calculation. Absent means
  // nobody has confirmed a winner yet, not that the week was a draw.
  winnerPlayerId?: string;
};

export type SeasonWeek = {
  season: number;
  week: number;
};

export type PaymentMethod = 'zelle' | 'venmo' | 'applepay' | 'cash';

// One player's payment for one week. No amount by design: the buy-in is fixed
// and everybody knows it, so the only thing worth recording is how it arrived.
// Unpaid is the absence of a document rather than a false flag, which is what
// keeps "who still owes" a single question about existence.
export type WeekPayment = {
  // makeWeekId(season, week), the same id picks are stored under.
  weekId: string;
  // The player's id -- their auth uid, or the auto-id of a managed player.
  playerId: string;
  method: PaymentMethod;
};

// The dropdown's option shape. Distinct from DropdownOption below, whose value
// is a number.
export type PaymentMethodOption = {
  label: string;
  value: PaymentMethod;
};

// The week the app is on, resolved once at startup and shared. Every page that
// needs the week's games or the id picks are stored under reads it from here
// rather than asking ESPN again.
export type CurrentWeek = {
  season: number;
  week: number;
  // makeWeekId(season, week), e.g. "2026_week_1"
  weekId: string;
  games: Game[];
  // The season's week list, which arrives on the same response.
  calendar: SeasonCalendar;
  loading: boolean;
};

export type SeasonCalendarWeek = {
  week: number;
  label: string;
  start: string;
  end: string;
};

export type SeasonCalendar = {
  season: number;
  start: string;
  end: string;
  weeks: SeasonCalendarWeek[];
};

export type MatchupsByDate = {
  key: string;
  date: string;
  matchups: Game[];
};

export type DropdownOption = {
  label: string;
  value: number;
};

// The team shape embedded in a pick document. Distinct from Team: this is what
// gets written into Firestore, so it carries the name rather than looking it up.
export type PickTeam = {
  // ESPN team id, as a string -- the same form GameTeam.id takes, so a pick and
  // a game side compare directly with no coercion.
  id: string;
  name: string;
};

export type Pick = {
  // ESPN competition id. Slots are built from the week's matchups, so every
  // pick belongs to a game.
  matchupId: string;
  awayTeam: PickTeam;
  homeTeam: PickTeam;
  // Absent until a team is chosen.
  pickedTeam?: PickTeam;
};

export type PicksForm = {
  user_name: string;
  // The document's own id, when it has one. Not part of the stored data.
  key?: string;
  picks: Pick[];
  user_id: string;
  // Season-scoped, e.g. "2026_week_1" -- see makeWeekId in utils/espn.
  week_id: string;
  tieBreakerPoints: number | '';
};

// How one pick turned out. 'push' covers both a tie and a final ESPN hasn't
// flagged a winner on: neither should mark anybody wrong. 'pending' is distinct
// from 'incorrect' so an ungraded game never reads as a miss.
/* -------------------------------------------------------------------------
 * The Firestore copy of the ESPN data, under the `cache` collection.
 *
 * One document per payload rather than one per game: every consumer wants a
 * whole week at once, so per-game documents would turn each page into 16 reads.
 * A trimmed week is ~4KB and all 32 teams ~6.5KB, nowhere near the 1MB limit.
 * ---------------------------------------------------------------------- */

export type CachedSeasonWeek = {
  week: number;
  label: string;
  // ESPN's calendar window for the week -- administrative boundaries, midnight
  // to 11:59pm, not games.
  start: string;
  end: string;
  // First and last kickoff, ISO. Empty when ESPN has no games for the week yet.
  // Note lastKickoff is when the final game STARTS, not when it ends.
  firstKickoff: string;
  lastKickoff: string;
  gameCount: number;
};

// Written by an admin, so `fetchedAt` is a server timestamp on the way in and a
// Timestamp on the way back out.
export type CachedSeason = {
  schemaVersion: number;
  fetchedAt: Timestamp;
  season: number;
  start: string;
  end: string;
  weeks: CachedSeasonWeek[];
};

export type CachedTeams = {
  schemaVersion: number;
  fetchedAt: Timestamp;
  season: number;
  teams: Team[];
};

export type CachedWeekGames = {
  schemaVersion: number;
  fetchedAt: Timestamp;
  season: number;
  week: number;
  weekId: string;
  games: Game[];
};

// What a seed run wrote, for reporting back on the admin page.
export type SeedSummary = {
  season: number;
  weeks: number;
  games: number;
  teams: number;
};

export type Outcome = 'correct' | 'incorrect' | 'push' | 'pending' | 'none';

// One participant's pick for one matchup, resolved when the row is built rather
// than looked up again on every render of the cell.
export type StandingsPickCell = {
  logo?: string;
  name?: string;
  // The picked team's ESPN primary, still without its leading '#'.
  color?: string;
  outcome: Outcome;
};

export type StandingsRow = {
  matchupId: string;
  matchupName: string;
  // Keyed by user_id, matching that participant's column property.
  picks: Record<string, StandingsPickCell>;
};
