import styled, { css } from "styled-components";
import { BandInk, BandScrimRgb, Ink, Paper } from "../../utils/teamColors";
import { color, font, media, radius, space, typeStyle } from "../../theme";

export type MatchupSize = 'compact' | 'grid' | 'medium' | 'full'

// One row per size, so the type, the logo and the band padding can never drift
// out of proportion with one another. `full` is the original scale, kept for
// the pick form where the matchup is the thing being acted on; `medium` is the
// schedule, which lists a whole week at once and does not need every row to be
// a headline; `compact` is the standings cell.
const scale = {
    compact: { font: '16px', tracking: '-0.006em', logo: '24px', chip: '2px', pad: `${space[2]} ${space[3]}` },
    // Deliberately off the linear scale: big logos, small type. It is the
    // standings matchup column, where the logos have to hold their own against
    // the pick tiles alongside them (36px, matched here) while the team names
    // stay small, because that column's width is competing with fifteen player
    // columns for the same page.
    grid: { font: '17px', tracking: '-0.011em', logo: '36px', chip: '2px', pad: `${space[2]} ${space[3]}` },
    medium: { font: '19px', tracking: '-0.015em', logo: '28px', chip: '2px', pad: `${space[2]} ${space[4]}` },
    full: { font: '24px', tracking: '-0.02em', logo: '32px', chip: '3px', pad: `${space[3]} ${space[5]}` },
} as const

// Three tracks at every size -- the standings cell, the schedule row and the
// pick form share one layout and differ only in the scale above. The auto track
// is the container's midpoint by construction, which is what a band's darkened
// centre is aligned to, and it is why the old hand-measured 328px away track is
// gone: the grid does the alignment that constant was faking, at any type size.
export const MatchupHeadingContainer = styled.div<{
    $size: MatchupSize
    $band?: boolean
    $away: string
    $home: string
    $split: number
}>`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    white-space: nowrap;
    font-size: ${({ $size }) => scale[$size].font};
    letter-spacing: ${({ $size }) => scale[$size].tracking};

    ${({ $band, $away, $home, $split, $size }) => $band && css`
        /* Two layers. The bottom one is the teams at full saturation, anchored
           at the outer edges, with the boundary at $split -- 50% for a live or
           scheduled game, 70/30 once one side has won.

           The top one is a fixed near-black scrim, always centred at 50%. It is
           deliberately team-independent: it means the "@" and the kickoff time
           have the same contrast in all 992 matchups, and its plateau sits
           directly over the colour ramp, which is the one stretch of the band
           whose luminance we can't reason about ahead of time. The ends stay
           legible on their own because resolveBandColors has already clamped
           them, so white clears its target everywhere. */
        background-image:
            linear-gradient(90deg,
                rgba(${BandScrimRgb}, 0) 0%,
                rgba(${BandScrimRgb}, 0.74) 38%,
                rgba(${BandScrimRgb}, 0.88) 50%,
                rgba(${BandScrimRgb}, 0.74) 62%,
                rgba(${BandScrimRgb}, 0) 100%),
            linear-gradient(90deg,
                ${$away} 0%,
                ${$away} ${Math.max(0, $split - 20)}%,
                ${$home} ${Math.min(100, $split + 20)}%,
                ${$home} 100%);
        color: ${BandInk};
        border-radius: ${radius.md};
        padding: ${scale[$size].pad};
        /* The band is the box the row lives in, so nothing may draw outside it.
           In a column narrow enough that even the abbreviations and the winner
           mark don't fit, the grid overflows -- and an unclipped overflow put
           the winner's tick out past the rounded corner, floating on the page
           beside the band it belongs to. */
        overflow: hidden;
    `}

    /* Colour is decoration; at forced-contrast the band goes flat and the
       structure carries the meaning on its own. */
    @media (prefers-contrast: more) {
        background-image: none;
        color: ${Ink};
    }
`

export const MatchupTeam = styled.div<{ $align: 'start' | 'end'; $lost?: boolean; $size?: MatchupSize }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${space[2]};
    justify-content: ${({ $align }) => ($align === 'end' ? 'flex-end' : 'flex-start')};
    /* Without this a long name blows its 1fr track out instead of ellipsing.
       The grid is the exception: it shows a three-letter code, which has no
       useful truncation, so it keeps the content-based minimum and the table
       column sizes itself to whatever the codes and logos actually need. */
    min-width: ${({ $size }) => ($size === 'grid' ? 'auto' : '0')};

    /* The losing side loses saturation and weight as well as prominence.
       Neither cue is hue-based, so both survive every colour-vision
       deficiency -- the winner mark is the redundant symbolic cue. */
    ${({ $lost }) => $lost && css`
        opacity: 0.6;
        filter: saturate(0.25);
    `}
`

export const MatchupTeamName = styled.span<{ $won?: boolean; $size?: MatchupSize }>`
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: ${({ $won }) => ($won ? font.medium : font.regular)};

    /* The grid shows a code, not a name, and there is no honest way to ellipse
       "WSH" -- "W..." is not a team. So it never shrinks: either the column is
       wide enough for the whole code or, on a phone, the code goes away and the
       logos carry the matchup on their own.

       display:contents rather than none for that disappearance, so the box goes
       with the text and takes the flex gap either side of it too; the
       screen-reader name inside is absolutely positioned, so it survives losing
       its parent's box. */
    ${({ $size }) => $size === 'grid' && css`
        flex: none;
        overflow: visible;

        ${media.upToMobile} {
            display: contents;
        }
    `}
`

// ESPN's marks are transparent full-colour PNGs drawn to sit on white, so a
// team's own logo over its own primary partly disappears -- the Raiders shield
// and the Steelers wordmark are black on black, and a team-coloured background
// makes that exact pairing the most common one on the page. A white chip under
// every mark is the one treatment that works for all 32 teams at every size.
// It is applied unconditionally: on the plain white page it is invisible, so
// there is one code path rather than two.
//
// Rounded square, not a circle: object-fit fits the mark to the square content
// box, whose corners fall outside a 50% radius, so a disc either clips wide
// marks or shrinks every mark by 30% to inscribe them.
export const MatchupTeamLogo = styled.img<{ $size: MatchupSize }>`
    height: ${({ $size }) => scale[$size].logo};
    width: ${({ $size }) => scale[$size].logo};
    flex: none;
    object-fit: contain;
    box-sizing: content-box;
    padding: ${({ $size }) => scale[$size].chip};
    background: ${Paper};
    border-radius: 30%;
`

export const MatchupCentre = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    /* em, not a space token: this gutter has to stay in proportion to the team
       names either side of it, and a fixed 20px crowded the smaller scales. */
    padding: 0 0.85em;
`

// Deliberately smaller and quieter than the team names. At full size it sat as
// heavy as the teams and crowded the kickoff time directly beneath it.
export const MatchupSeparator = styled.div`
    font-size: 0.7em;
    line-height: 1;
    opacity: 0.65;
`

// The kickoff time, or FINAL / LIVE. Sits under the "@" rather than pinned to
// the right of the row, so it lands inside the band's dark centre instead of on
// full-saturation home-team colour.
export const MatchupMeta = styled.div`
    ${typeStyle('caption')}
    /* Wider than the caption default: this is a micro-label (FINAL / LIVE / a
       kickoff time), and tracking is what keeps it from reading as body text. */
    letter-spacing: 0.06em;
    line-height: 1;
    opacity: 0.82;
`

// Holds the winner's badge against the corner of the winning logo. Only the
// grid needs it -- everywhere else the mark can afford to stand beside the name.
export const MatchupLogoStack = styled.span`
    position: relative;
    display: inline-flex;
    flex: none;
`

export const WinnerMark = styled.span<{ $onLogo?: boolean; $side?: 'away' | 'home' }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 18px;
    width: 18px;
    flex: none;
    border-radius: ${radius.circle};
    background: ${Paper};
    color: ${Ink};

    /* In the standings column the mark rides on the corner of the winning logo
       instead of standing beside it: absolutely positioned, so it costs the row
       nothing, which is 26px of a phone's 200px column -- the widest thing on
       that page that wasn't carrying information.
       
       Inverted (dark disc, white check) with a white ring, because here it lands
       half on the logo's white chip and half on the team's colour, and neither
       an all-white disc nor a bare dark one reads against both. Deliberately not
       the pick cell's green: alongside a column of green ticks meaning "your
       pick was right", a green tick here would look like it was saying the same
       thing about a game you may well have got wrong.
       
       Pinned to the outer corner, mirroring by side, so it stays over its own
       team rather than drifting towards the "@". */
    ${({ $onLogo, $side }) => $onLogo && css`
        position: absolute;
        top: -4px;
        ${$side === 'away' ? 'left' : 'right'}: -4px;
        height: 16px;
        width: 16px;
        background: ${Ink};
        color: ${Paper};
        box-shadow: 0 0 0 2px ${Paper};
    `}
`

// Used by Schedule for a game that is under way.
export const LiveTag = styled.span`
    color: ${color.surface};
    font-weight: ${font.medium};
`
