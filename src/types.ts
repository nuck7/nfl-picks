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
  lockAt: string;
};

export type SeasonWeek = {
  season: number;
  week: number;
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

// The team shape embedded in a pick document. Distinct from Team: these are
// written into Firestore and must stay readable for documents already saved.
export type PickTeam = {
  id: number | string;
  name: string;
  city?: string;
};

export type Pick = {
  awayTeam: PickTeam;
  homeTeam: PickTeam;
  pickedTeam: PickTeam;
  // ESPN competition id. Optional: documents written before it existed have none.
  matchupId?: string;
};

export type PicksForm = {
  user_name?: string | null;
  key?: string;
  picks: Pick[];
  user_id: string;
  // Season-scoped, e.g. "2026_week_1" -- see makeWeekId in utils/espn.
  week_id: string;
  tieBreakerPoints: number | '';
};

export type PickKeyed = {
  matchupName: string;
  // undefined means the participant has no pick for that matchup
  [key: string]: string | undefined;
};
