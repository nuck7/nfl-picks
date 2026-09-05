import React from 'react';
import { EspnMatchup, TeamsKeyed } from '../../types';
import { getMatchupTeamNames, getTeamByHomeAway } from '../../utils/teams';
import { MatchupHeadingContainer, MatchupSeparator, MatchupTeam, MatchupTeamLogo } from './index.styles';

interface Props {
    teams: TeamsKeyed;
    matchup: EspnMatchup;
    // Smaller type and logos, for the standings table rows.
    compact?: boolean;
    // Put each logo ahead of its own team name instead of mirroring the away
    // side. Used by the pick form, where the logo leads the name in the team
    // dropdown right below and the two should read the same way.
    leadingLogos?: boolean;
    // Reserve a fixed width for the away side so the "@" lines up down a list
    // of games instead of moving with the length of the team names.
    alignSeparator?: boolean;
}

// "Away Team <away logo> @ <home logo> Home Team". The away side is mirrored by
// default so both logos sit against the "@" and read as one column down a list
// of games. Falls back to the names parsed from matchup.name while TeamsContext
// is still loading, so the heading never renders empty.
const MatchupHeading: React.FC<Props> = ({ teams, matchup, compact, leadingLogos, alignSeparator }) => {
    const teamNames = getMatchupTeamNames(matchup)
    const awayTeam = getTeamByHomeAway(teams, matchup, 'away')
    const homeTeam = getTeamByHomeAway(teams, matchup, 'home')

    const awayLogo = awayTeam?.logos[0]?.href
        ? <MatchupTeamLogo $compact={compact} src={awayTeam.logos[0].href} alt="" />
        : null

    return (
        <MatchupHeadingContainer $compact={compact}>
            <MatchupTeam $align={leadingLogos ? 'start' : 'end'} $fixedWidth={alignSeparator}>
                {leadingLogos ? awayLogo : null}
                {awayTeam?.displayName ?? teamNames[0]}
                {leadingLogos ? null : awayLogo}
            </MatchupTeam>
            <MatchupSeparator>@</MatchupSeparator>
            <MatchupTeam $align='start'>
                {homeTeam?.logos[0]?.href
                    ? <MatchupTeamLogo $compact={compact} src={homeTeam.logos[0].href} alt="" />
                    : null}
                {homeTeam?.displayName ?? teamNames[1]}
            </MatchupTeam>
        </MatchupHeadingContainer>
    )
}

export default MatchupHeading
