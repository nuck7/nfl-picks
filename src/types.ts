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
    Start: string,
    End: string,
    CreatedAt: string,
    UpdatedAt: string
    Matches: null
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
    Start: string,
    End: string
}

export type NewWeekFormValues = {
    week_number: string,
    
}
