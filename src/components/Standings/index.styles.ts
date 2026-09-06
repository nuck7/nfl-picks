import styled, { css } from "styled-components";
import { Outcome } from "../../types";
import { Ink, Paper, withAlpha } from "../../utils/teamColors";
import { border, color, font, radius, space, typeStyle } from "../../theme";
import LinkButton from "../LinkButton";

// A wrong pick loses the team's colour rather than gaining a red one. At a
// glance down a whole column a pale tile reads as "not this one" instantly, and
// desaturation is a lightness cue, so it survives every form of colour
// blindness -- the badge and the hidden text are the redundant cues. A correct
// pick keeps the colour at full strength: the tint IS the reward. Pending sits
// in between, so a live column reads as "not graded" rather than "all wrong".
const tintFor = (outcome: Outcome, fill: string) =>
    outcome === 'correct' ? fill
        : outcome === 'incorrect' ? withAlpha(fill, 0.14)
        : withAlpha(fill, 0.40)

export const PickTile = styled.div<{ $background: string; $ink: string; $outcome: Outcome }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 64px;
    box-sizing: border-box;
    padding: ${space[2]};
    border-radius: ${radius.md};
    background: ${({ $background, $outcome }) => tintFor($outcome, $background)};
    /* Only the correct tile is a full-strength colour, so it is the only one
       whose ink has to be derived; the tinted ones sit on near-white. */
    color: ${({ $ink, $outcome }) => ($outcome === 'correct' ? $ink : Ink)};

    @media (prefers-contrast: more) {
        background: ${Paper};
        border: 2px solid ${Ink};
    }
`

export const PickLogo = styled.img<{ $outcome: Outcome }>`
    height: 48px;
    width: 48px;
    object-fit: contain;

    /* The chip is only needed where the tile is a full-strength team colour --
       which is exactly the case where a team's own mark would otherwise
       disappear into its own primary. */
    ${({ $outcome }) => $outcome === 'correct' && css`
        box-sizing: content-box;
        padding: 4px;
        background: ${Paper};
        border-radius: 30%;
    `}
    ${({ $outcome }) => $outcome === 'incorrect' && css`
        filter: grayscale(0.85);
        opacity: 0.55;
    `}
`

export const OutcomeBadge = styled.span<{ $outcome: Outcome }>`
    position: absolute;
    top: ${space[1]};
    right: ${space[1]};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 18px;
    width: 18px;
    border-radius: ${radius.circle};
    background: ${({ $outcome }) => ($outcome === 'correct' ? color.positive : color.inkFaint)};
    color: ${Paper};
`

export const NoPick = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 64px;
    color: ${color.inkFaint};
`

export const RecordLabel = styled.div`
    ${typeStyle('caption')}
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${color.inkMuted};
`

export const RecordValue = styled.div`
    ${typeStyle('subsection')}
    font-weight: ${font.medium};
    text-align: center;
    font-variant-numeric: tabular-nums;
`

// Players are columns here, not rows, so the payment badge goes at the top of a
// player's column -- directly under their name, which is the nearest thing the
// layout has to a first cell for them.
export const PlayerHeader = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${space[1]};
`

// Admins only, so it can afford to name the method rather than just say paid.
// Unpaid is the muted state: the eye should catch who still owes, not who has
// already settled.
export const PaymentBadge = styled.span<{ $paid: boolean }>`
    ${typeStyle('caption')}
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
    color: ${({ $paid }) => ($paid ? color.positive : color.inkFaint)};
`

// The heading keeps its own bottom margin from GlobalStyle; the link sits on
// its baseline rather than being pushed under it.
export const PageHeader = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: ${space[3]};
`

export const PrintLink = styled(LinkButton)`
    ${typeStyle('meta')}
    white-space: nowrap;
    padding: ${space[2]} ${space[3]};
    border: ${border.hairline};
    border-radius: ${radius.pill};
    background: ${color.surface};
    color: ${color.ink};
    text-decoration: none;

    &:hover { background: ${color.surfaceHover}; }
`

/* ------------------------------------------------------------- leaders -- */

// Sits between the heading and the table. A hairline strip rather than a card:
// it is a one-line answer to "who is winning", and giving it a filled panel
// would make it compete with the table it is summarising.
export const LeaderBanner = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: ${space[2]} ${space[3]};
    margin-bottom: ${space[6]};
    padding: ${space[3]} ${space[4]};
    border: 1px solid ${color.border};
    border-radius: ${radius.lg};
    background: ${color.surface};
`

export const LeaderLabel = styled.span`
    ${typeStyle('caption')}
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${color.inkMuted};
`

export const LeaderNames = styled.span`
    ${typeStyle('lead')}
    color: ${color.ink};
`

// The record is the reason they lead, so it reads as supporting detail rather
// than as a second name in the list.
export const LeaderRecord = styled.span`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    font-variant-numeric: tabular-nums;
`

// One column per player, so a full roster overflows a phone. Without this the
// table just clipped.
//
// The height bound is what makes the pinned header work at all. overflow-x on
// its own already makes this the scrollport for BOTH axes -- CSS promotes the
// other axis from visible to auto -- so a sticky header inside it sticks to this
// box, not to the window. Unbounded, this box is exactly as tall as the table
// and the header has nothing to stick against while the page scrolls past it.
// Bounding the height moves the vertical scrolling in here, where the header can
// actually hold its position.
export const TableScroll = styled.div`
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    /* Roughly the nav, the heading and the leader banner. A max, so short weeks
       still size to their content rather than leaving dead space. */
    max-height: calc(100vh - 260px);
    /* ...but never so short that only a row or two is visible on a small phone;
       below this the page scroll takes over again, which is the better trade. */
    min-height: 340px;
`

// The footer carries two lines per column -- week record and tie breaker -- so
// they share a stack to stay on the same baselines across columns.
export const FooterStack = styled.div<{ $align?: 'start' | 'center' }>`
    display: flex;
    flex-direction: column;
    align-items: ${({ $align }) => ($align === 'center' ? 'center' : 'flex-start')};
    gap: ${space[1]};
    /* A player with no picks has no tiles to widen their column, so "0-0"
       would wrap and drop the tie breaker off the shared baseline. */
    white-space: nowrap;
`

export const TieBreakerValue = styled.div`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    font-variant-numeric: tabular-nums;
`
