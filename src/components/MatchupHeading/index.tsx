import React from 'react';
import { Game, TeamsKeyed } from '../../types';
import { getTeamByHomeAway } from '../../utils/teams';
import { MatchupHeadingContainer, MatchupSeparator, MatchupTeam, MatchupTeamLogo } from './index.styles';

interface Props {
    teams: TeamsKeyed;
    game: Game;
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
// of games. Team names fall back to the ones carried on the game itself, so the
// heading never renders empty while TeamsContext is still loading.
const MatchupHeading: React.FC<Props> = ({ teams, game, compact, leadingLogos, alignSeparator }) => {
    const awayTeam = getTeamByHomeAway(teams, game, 'away')
    const homeTeam = getTeamByHomeAway(teams, game, 'home')

    const awayLogo = awayTeam?.logo
        ? <MatchupTeamLogo $compact={compact} src={awayTeam.logo} alt="" />
        : null

    return (
        <MatchupHeadingContainer $compact={compact}>
            <MatchupTeam $align={leadingLogos ? 'start' : 'end'} $fixedWidth={alignSeparator}>
                {leadingLogos ? awayLogo : null}
                {awayTeam?.displayName ?? game.away.displayName}
                {leadingLogos ? null : awayLogo}
            </MatchupTeam>
            <MatchupSeparator>@</MatchupSeparator>
            <MatchupTeam $align='start'>
                {homeTeam?.logo
                    ? <MatchupTeamLogo $compact={compact} src={homeTeam.logo} alt="" />
                    : null}
                {homeTeam?.displayName ?? game.home.displayName}
            </MatchupTeam>
        </MatchupHeadingContainer>
    )
}

export default MatchupHeading
