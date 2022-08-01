export type MenuOption = {
    link: string,
    label: string
}

export type Team = {
    ID: number,
    Name: string,
    City: string,
    CreatedAt: string,
    UpdatedAt: string,
    Winners: null,
    HomeTeams: null,
    AwayTeams: null
}

export type User = {
    ID: number,
    Name: string,
    Email: string,
    CreatedAt: string,
    UpdatedAt: string,
    Picks: null
}

export type Matchup = {
    ID: number,
    HomeTeamID: number,
    AwayTeamID: number,
    WeekID: number,
    CreatedAt: string,
    UpdatedAt: string,
    Picks: null
}

export type Pick = {
    ID: number,
    UserID: number,
    MatchupID: number,
    WinnerID: number,
    CreatedAt: string,
    UpdatedAt: string
}

export type Week = {
    ID: number,
    Name: string,
    Start: string,
    End: string,
    CreatedAt: string,
    UpdatedAt: string
    Matchups: Team[]
}

export type DropdownOption = {
    label: string,
    value: number
}

export type CreateMatchupInput = {
    HomeTeamID: number,
    AwayTeamID: number,
    WeekID: number
}

export type CreatePickInput = {
    UserID: number,
    MatchupID: number,
    WinnerID: number
}

export type CreateWeekInput = {
    Name: string,
    Start: string,
    End: string
}

type FormMatchup = {
    home: Team,
    away: Team
}

export type WeekFormValues = {
    name: string,
    start_date: string,
    end_date: string,
    matchups: FormMatchup[]
}

export type MatchupTeams = {
    ID:      number,
	HomeTeamID:   number,
	HomeTeamName: string,
	AwayTeamID:   number,
	AwayTeamName: string,
	WeekID:       number
}

export type WeekMatchupAPI = {
    ID: number
    Name: string,
    Start: string,
    End: string,
    Matchups: MatchupTeams[]
}
