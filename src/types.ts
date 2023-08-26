<<<<<<< HEAD
import { Timestamp } from 'firebase/firestore';
=======
import { Timestamp } from "firebase/firestore"
>>>>>>> 927b4d7 (Add espn api resource, start ingestion of espn data, add paths and components for said data)

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

export type Season = {
    id: string,
    name: string,
    start: Timestamp,
    end: Timestamp
}

export type SeasonCreate = {
    name: string,
    start: Timestamp,
    end: Timestamp
}

export type Team = {
  id: string;
  name: string;
  city: string;
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

export type Pick = {
  id: string;
  userID: string;
  matchupID: string;
  winnerID: string;
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
  week: {
    number: number;
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

export type DropdownOption = {
  label: string;
  value: number;
};

export type CreateMatchupsInput = {
  HomeTeamID: number;
  AwayTeamID: number;
  WeekID: number;
};

export type MatchupsInput = {
  ID: number;
  HomeTeamID: number;
  AwayTeamID: number;
  WeekID: number;
};

export type CreatePickInput = {
  UserID: number;
  MatchupID: number;
  WinnerID: number;
};

export type CreateWeekInput = {
  Name: string;
  Start: string;
  End: string;
};

export type UpdateWeekInput = {
  ID: number;
  Name: string;
  Start: string;
  End: string;
};

export type FormMatchup = {
<<<<<<< HEAD
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
=======
    id?: number,
    weekId?: number,
    home: {
        ID: number,
        City: string,
        Name: string,
    },
    away: {
        ID: number,
        City: string,
        Name: string,
    }
}

export type FormUpdateMatchup = {
    id: number,
    weekId: number,
    home: {
        ID: number,
        City: string,
        Name: string,
    },
    away: {
        ID: number,
        City: string,
        Name: string,
    }
}
>>>>>>> 927b4d7 (Add espn api resource, start ingestion of espn data, add paths and components for said data)

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
<<<<<<< HEAD
  ID: number;
  HomeTeamID: number;
  HomeTeamCity: string;
  HomeTeamName: string;
  AwayTeamID: number;
  AwayTeamCity: string;
  AwayTeamName: string;
  WeekID: number;
};
=======
    ID: number,
    HomeTeamID: number,
    HomeTeamCity: string,
    HomeTeamName: string,
    AwayTeamID: number,
    AwayTeamCity: string,
    AwayTeamName: string,
    WeekID: number
}
>>>>>>> 927b4d7 (Add espn api resource, start ingestion of espn data, add paths and components for said data)

export type WeekMatchupsAPI = {
  ID: number;
  Name: string;
  Start: string;
  End: string;
  Matchups: MatchupTeams[];
};
