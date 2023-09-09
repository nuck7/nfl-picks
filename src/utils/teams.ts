import { EspnMatchup, TeamsKeyed } from "../types";


export const getTeamByHomeAway = (teams: TeamsKeyed, matchup: EspnMatchup, homeAway: string) => {
    if (matchup.competitions[0].competitors[0].homeAway == homeAway) {
        return teams[matchup.competitions[0].competitors[0].id]
    }
    return teams[matchup.competitions[0].competitors[1].id]
}
