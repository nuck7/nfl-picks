import React from 'react';
import { Checkmark } from 'grommet-icons';
import { Game, Team, TeamsKeyed } from '../../types';
import { getTeamByHomeAway } from '../../utils/teams';
import { getWinningSideKey } from '../../utils/grading';
import { BandContrast, resolveBandColors } from '../../utils/teamColors';
import VisuallyHidden from '../VisuallyHidden';
import {
    MatchupCentre,
    MatchupHeadingContainer,
    MatchupMeta,
    MatchupSeparator,
    MatchupTeam,
    MatchupTeamLogo,
    MatchupTeamName,
    MatchupSize,
    WinnerMark,
} from './index.styles';

interface Props {
    teams: TeamsKeyed;
    game: Game;
    // The type and logo scale. 'full' is the pick form, where the matchup is
    // the thing being acted on; 'medium' the schedule, which lists a whole week
    // at a time; 'compact' a standings cell.
    size?: MatchupSize;
    // Put each logo ahead of its own team name instead of mirroring the away
    // side. Used by the pick form, where the logo leads the name in the team
    // dropdown right below and the two should read the same way.
    leadingLogos?: boolean;
    // 'band' paints the two teams' colours behind the row, anchored at the
    // outer edges and meeting in a darkened centre. 'plain' leaves the heading
    // on the page background.
    tone?: 'plain' | 'band';
    // Rendered under the "@", inside the darkened centre of a band. The kickoff
    // time and the FINAL / LIVE label go here.
    meta?: React.ReactNode;
    // Marks the winner and dims the loser once the game is final. Off by
    // default: the pick form must not give the answer away above its dropdown.
    showResult?: boolean;
}

// A finished game gives most of the band to the winner's colour, but the loser
// keeps a stripe at its own edge so the row still reads as a matchup rather
// than a single-team block.
const WinnerSplit = 70
const EvenSplit = 50

// "Away Team <away logo> @ <home logo> Home Team", laid out as three tracks --
// 1fr, auto, 1fr -- so the "@" sits on the container's exact midpoint. Team
// names fall back to the ones carried on the game itself, so the heading never
// renders empty while TeamsContext is still loading.
const MatchupHeading: React.FC<Props> = ({
    teams, game, size = 'full', leadingLogos, tone = 'plain', meta, showResult,
}) => {
    const awayTeam = getTeamByHomeAway(teams, game, 'away')
    const homeTeam = getTeamByHomeAway(teams, game, 'home')

    // Only 'full' clears WCAG's large-text bar (24px regular), where 3:1 is
    // enough. Both smaller scales are ordinary body text and need 4.5:1 against
    // the band, so they ask resolveBandColors to clamp the team colours harder.
    const colors = resolveBandColors(
        awayTeam,
        homeTeam,
        size === 'full' ? BandContrast.regular : BandContrast.compact
    )

    const winner = showResult ? getWinningSideKey(game) : undefined
    const split = winner === 'away' ? WinnerSplit
        : winner === 'home' ? 100 - WinnerSplit
        : EvenSplit

    const renderLogo = (team?: Team) =>
        team?.logo ? <MatchupTeamLogo $size={size} src={team.logo} alt="" /> : null

    const awayLogo = renderLogo(awayTeam)

    const winnerMark = (
        <WinnerMark>
            <Checkmark size='12px' color='currentColor' />
            <VisuallyHidden>Winner</VisuallyHidden>
        </WinnerMark>
    )

    return (
        <MatchupHeadingContainer
            $size={size}
            $band={tone === 'band'}
            $away={colors.away}
            $home={colors.home}
            $split={split}
        >
            <MatchupTeam
                $align={leadingLogos ? 'start' : 'end'}
                $lost={Boolean(winner) && winner !== 'away'}
            >
                {leadingLogos ? awayLogo : null}
                <MatchupTeamName $won={winner === 'away'}>
                    {awayTeam?.displayName ?? game.away.displayName}
                </MatchupTeamName>
                {leadingLogos ? null : awayLogo}
                {winner === 'away' ? winnerMark : null}
            </MatchupTeam>

            <MatchupCentre>
                <MatchupSeparator aria-hidden='true'>@</MatchupSeparator>
                {meta ? <MatchupMeta>{meta}</MatchupMeta> : null}
            </MatchupCentre>

            <MatchupTeam $align='start' $lost={Boolean(winner) && winner !== 'home'}>
                {renderLogo(homeTeam)}
                <MatchupTeamName $won={winner === 'home'}>
                    {homeTeam?.displayName ?? game.home.displayName}
                </MatchupTeamName>
                {winner === 'home' ? winnerMark : null}
            </MatchupTeam>
        </MatchupHeadingContainer>
    )
}

export default MatchupHeading
