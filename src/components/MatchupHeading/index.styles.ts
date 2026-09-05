import styled, { css } from "styled-components";

// Compact is for the standings table, where the heading sits in a cell next to
// the pick logos rather than being the row's own title. It lays out as three
// tracks instead of a flex row: every cell in the column is the same width and
// the "@" track is the same width in each, so the "@" lands on the same x in
// every row no matter how long the team names are.
export const MatchupHeadingContainer = styled.div<{ $compact?: boolean }>`
    font-size: ${({ $compact }) => ($compact ? '16px' : '24px')};
    display: flex;
    flex-direction: row;
    align-items: center;
    white-space: nowrap;

    ${({ $compact }) => $compact && css`
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        width: 100%;
    `}
`

// Reserves the away side's width so the "@" -- and with it the home team --
// starts at the same x in every row of a list of games. Sized to the longest
// team name ("Washington Commanders", the league's longest, measures 317px
// here) plus its logo and gap, with a little headroom.
const AwayTrackWidth = '328px'

export const MatchupTeam = styled.div<{ $align?: 'start' | 'end'; $fixedWidth?: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    justify-self: ${({ $align }) => $align ?? 'auto'};
    /* Only bites on the reserved track, where the box is wider than its
       content: it decides which end of that track the team sits against. */
    justify-content: ${({ $align }) => ($align === 'end' ? 'flex-end' : 'flex-start')};
    ${({ $fixedWidth }) => $fixedWidth && `min-width: ${AwayTrackWidth};`}
`

export const MatchupTeamLogo = styled.img<{ $compact?: boolean }>`
    height: ${({ $compact }) => ($compact ? '24px' : '32px')};
    width: ${({ $compact }) => ($compact ? '24px' : '32px')};
    object-fit: contain;
`

export const MatchupSeparator = styled.div`
    padding: 0 12px;
`
