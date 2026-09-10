import React from 'react';
import { Checkmark } from 'grommet-icons';
import { Game, Team, TeamsKeyed } from '../../types';
import { getTeamByHomeAway } from '../../utils/teams';
import { getWinningSideKey } from '../../utils/grading';
import { BandContrast, resolveBandColors } from '../../utils/teamColors';
import VisuallyHidden from '../VisuallyHidden';
import TeamName from '../TeamName';
import {
    MatchupCentre,
    MatchupHeadingContainer,
    MatchupLogoStack,
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
    // Below the mobile breakpoint, show ESPN's code rather than letting the
    // name ellipse. For the pick form, where the band is full width and still
    // has to fit two names on a phone.
    abbreviateOnMobile?: boolean;
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
    abbreviateOnMobile,
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

    // The standings column abbreviates at every width, and on a phone drops the
    // name altogether -- one pinned column can't hold two names, two logos and
    // still leave the pick columns anything. The pick form only abbreviates on a
    // phone. Everywhere else has room for the real name.
    const abbreviateWhen = size === 'grid' ? 'fromMobile'
        : abbreviateOnMobile ? 'mobile'
        : undefined

    const renderName = (fullName: string, abbreviation?: string) => (
        abbreviateWhen
            ? <TeamName full={fullName} abbreviation={abbreviation} when={abbreviateWhen} />
            : fullName
    )

    const winner = showResult ? getWinningSideKey(game) : undefined
    const split = winner === 'away' ? WinnerSplit
        : winner === 'home' ? 100 - WinnerSplit
        : EvenSplit

    const winnerMark = (props?: { onLogo: boolean; side: 'away' | 'home' }) => (
        <WinnerMark $onLogo={props?.onLogo} $side={props?.side}>
            <Checkmark size={props?.onLogo ? '10px' : '12px'} color='currentColor' />
            <VisuallyHidden>Winner</VisuallyHidden>
        </WinnerMark>
    )

    // The standings column has no width to spare, so its mark sits on the logo.
    // Everywhere else it stands beside the name, where there is room for it.
    const markOnLogo = size === 'grid'

    const renderLogo = (team: Team | undefined, side: 'away' | 'home') => {
        if (!team?.logo) {
            return null
        }
        const logo = <MatchupTeamLogo $size={size} src={team.logo} alt="" />

        return markOnLogo && winner === side ? (
            <MatchupLogoStack>
                {logo}
                {winnerMark({ onLogo: true, side })}
            </MatchupLogoStack>
        ) : logo
    }

    // Beside the name whenever the badge has nowhere to ride -- either because
    // this size keeps its mark inline, or because ESPN gave us no logo to put it
    // on. Without the second case a winner would go unmarked while TeamsContext
    // is still loading.
    const standaloneMark = (side: 'away' | 'home', team?: Team) =>
        winner === side && (!markOnLogo || !team?.logo)
            ? winnerMark()
            : null

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
                $size={size}
            >
                {/* Outer edge, mirroring the home side's -- the two marks sit
                    at the ends of the band rather than one of them next to the
                    "@", which read as if it belonged to the wrong team. */}
                {standaloneMark('away', awayTeam)}
                {leadingLogos ? renderLogo(awayTeam, 'away') : null}
                <MatchupTeamName $won={winner === 'away'} $size={size}>
                    {renderName(
                        awayTeam?.displayName ?? game.away.displayName,
                        awayTeam?.abbreviation ?? game.away.abbreviation
                    )}
                </MatchupTeamName>
                {leadingLogos ? null : renderLogo(awayTeam, 'away')}
            </MatchupTeam>

            <MatchupCentre>
                <MatchupSeparator aria-hidden='true'>@</MatchupSeparator>
                {meta ? <MatchupMeta>{meta}</MatchupMeta> : null}
            </MatchupCentre>

            <MatchupTeam $align='start' $lost={Boolean(winner) && winner !== 'home'} $size={size}>
                {renderLogo(homeTeam, 'home')}
                <MatchupTeamName $won={winner === 'home'} $size={size}>
                    {renderName(
                        homeTeam?.displayName ?? game.home.displayName,
                        homeTeam?.abbreviation ?? game.home.abbreviation
                    )}
                </MatchupTeamName>
                {standaloneMark('home', homeTeam)}
            </MatchupTeam>
        </MatchupHeadingContainer>
    )
}

export default MatchupHeading
