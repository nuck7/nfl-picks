import { Timestamp } from 'firebase/firestore';

export type MenuOption = {
  link: string;
  label: string;
};

export type Season = {
  id: string;
  name: string;
  start: Timestamp;
  end: Timestamp;
};

export type SeasonCreate = {
  name: string;
  start: Timestamp;
  end: Timestamp;
};

export type Team = {
  id: number | string;
  name: string;
  city?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Matchup = {
  id: string;
  homeTeamID: number;
  awayTeamID: number;
  weekID: number;
};

export type MatchupV2 = {
  id: string;
  homeTeamId: number;
  awayTeamId: number;
  startTimestamp: number;
};

export type Picks = {
  id: string;
  userID: string;
  pickedTeam: string;
  weekId: string;
  matchups: MatchupV2[];
};

export type Week = {
  id: string;
  name: string;
  start: Timestamp;
  end: Timestamp;
};

export type EspnSeasons = {
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: EspnRef[];
};

export type EspnTeams = {
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: EspnRef[];
};

export type EspnTeam = {
  id: number;
  location: string;
  name: string;
  displayName: string;
  logos: EspnTeamImage[];
  homeAway: string;
};

export type EspnTeamImage = {
  href: string;
  width: number;
  height: number;
  alt: string;
}

export type EspnRef = {
  $ref: string;
};

export type EspnEvent = {
  items: EspnRef[];
};

export type EspnSeason = {
  $ref: string;
  year: number;
  startDate: string;
  endDate: string;
  displayName: string;
  types: EspnSeasonTypes;
  type: {
    week: {
      number: number;
      startDate: Date;
      endDate: Date;
    };
  };
};

export type EspnSeasonTypes = {
  $ref: string;
  count: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  items: EspnSeasonDetails[];
};

export type EspnSeasonDetails = {
  $ref: string;
  id: string;
  type: number;
  name: string;
  abbreviation: string;
  year: number;
  startDate: string;
  endDate: string;
  hasGroups: boolean;
  hasStandings: boolean;
  hasLegs: boolean;
  groups: EspnRef;
  weeks: EspnRef;
  corrections: EspnRef;
  leaders: EspnRef;
  slug: string;
};

export type EspnMatchup = {
  date: string;
  name: string;
  shortName: string;
  week: EspnRef;
  competitions: EspnCompetition[];
};

export type EspnCompetition = {
  $ref: string;
  id: string;
  date: string;
  competitors: EspnCompetitor[];
};

export type EspnCompetitor = {
  $ref: string;
  id: string;
  type: string;
  order: number;
  homeAway: string;
  team: EspnRef;
};

export type DropdownOption = {
  label: string;
  value: number;
};

export type FormMatchup = {
  id?: number;
  weekId?: number;
  home: {
    ID: number;
    City: string;
    Name: string;
  };
  away: {
    ID: number;
    City: string;
    Name: string;
  };
};

export type FormUpdateMatchup = {
  id: number;
  weekId: number;
  home: {
    ID: number;
    City: string;
    Name: string;
  };
  away: {
    ID: number;
    City: string;
    Name: string;
  };
};

export type WeekFormValues = {
  id?: number;
  name: string;
  start_date: string;
  end_date: string;
  matchups: FormMatchup[];
};

export type WeekUpdateFormValues = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  matchups: FormUpdateMatchup[];
};

export type MatchupTeams = {
  ID: number;
  HomeTeamID: number;
  HomeTeamCity: string;
  HomeTeamName: string;
  AwayTeamID: number;
  AwayTeamCity: string;
  AwayTeamName: string;
  WeekID: number;
};

export type WeekMatchupsAPI = {
  ID: number;
  Name: string;
  Start: string;
  End: string;
  Matchups: MatchupTeams[];
};

export type Pick = {
  awayTeam: Team;
  homeTeam: Team;
  pickedTeam: Team;
};

export type PicksForm = {
  user_name?: string | null;
  key?: string;
  picks: Pick[];
  user_id: string;
  week_id: number | '';
  tieBreakerPoints: number | '';
};

export type TeamsKeyed = {
  [key: string]: EspnTeam;
}

export type PickKeyed = {
  matchupName: string;
  [key: string]: string;
}

export type StandingsRowData = {
  teamName: string;
  teamLogo: string;
}
