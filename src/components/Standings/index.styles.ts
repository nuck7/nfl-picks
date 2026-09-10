import styled, { css } from "styled-components";
import { Outcome } from "../../types";
import { Ink, Paper, withAlpha } from "../../utils/teamColors";
import { border, color, font, media, radius, space, typeStyle } from "../../theme";
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

// Every pick cell is the same size whatever its column ends up being. A column
// is sized by the player's name in the header, so at width:100% a "Nick W Chu"
// column drew visibly wider tiles than a "Nick Chu" one -- the logos were
// always 48px, but the tiles around them were not, and the grid read as if the
// icons themselves were different sizes. Centred in whatever room the name
// leaves, so the extra width becomes gutter rather than tile.
const TileWidth = '64px'

export const PickTile = styled.div<{ $background: string; $ink: string; $outcome: Outcome }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${TileWidth};
    margin: 0 auto;
    min-height: 48px;
    box-sizing: border-box;
    padding: ${space[1]};
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

// ESPN's marks are transparent PNGs drawn to sit on white, so a team's logo over
// its own primary partly disappears -- and a tile filled with the picked team's
// colour makes that the most common pairing on the page. Seattle's navy hawk on
// Seattle navy and the Jets' green wordmark on Jets green both vanish outright.
//
// This is the same job the white chip behind the logo used to do, minus the box:
// drop-shadow works off the alpha channel, so four of them -- one per side --
// trace a 1px keyline around the mark's own silhouette instead of squaring it
// off. Applied to every tile rather than only the correct one, because it costs
// nothing where it isn't needed: on a pale tint it is white on near-white and
// simply doesn't show, while in dark mode it carries the dim tiles too.
const LogoKeyline = css`
    drop-shadow(1px 0 0 ${Paper})
    drop-shadow(-1px 0 0 ${Paper})
    drop-shadow(0 1px 0 ${Paper})
    drop-shadow(0 -1px 0 ${Paper})
`

export const PickLogo = styled.img<{ $outcome: Outcome }>`
    height: 36px;
    width: 36px;
    object-fit: contain;
    filter: ${LogoKeyline};

    /* One filter declaration, not two -- the second would replace the first and
       take the keyline with it. Desaturating first leaves the keyline white. */
    ${({ $outcome }) => $outcome === 'incorrect' && css`
        filter: grayscale(0.85) ${LogoKeyline};
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
    height: 15px;
    width: 15px;
    border-radius: ${radius.circle};
    background: ${({ $outcome }) => ($outcome === 'correct' ? color.positive : color.inkFaint)};
    color: ${Paper};
`

export const NoPick = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    /* Matches PickTile so an empty cell holds the same column rhythm as a
       filled one. */
    width: ${TileWidth};
    margin: 0 auto;
    min-height: 48px;
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
    /* The tile is only 64px, but a column is as wide as its widest cell -- and
       on a one-line header that is the name, so "Christopher Vandenberg" was
       setting a 150px column and undoing the tile shrink. Capping and wrapping
       the name is what actually buys the width back for the matchup column. */
    max-width: 76px;
    ${typeStyle('meta')}
    text-align: center;
    white-space: normal;
    overflow-wrap: anywhere;
    /* Fill the header cell so the badge below can be pushed to its floor. Names
       wrap to one, two or three lines, so without this every column's payment
       status sat at a different height and the row of them read as ragged. */
    height: 100%;
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
    /* Pinned to the bottom of the header cell, so every badge lands on one line
       across the table however many lines the name above it took. */
    margin-top: auto;
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

// Matches the schedule page's week select, which is the other place in the app
// you change which week you are looking at.
export const WeekSelectContainer = styled.div`
    max-width: 240px;
    margin-bottom: ${space[6]};
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

/* -------------------------------------------------- week summary line -- */

// Everything about the week that is not the grid, on one line: what is in the
// pot, how many are playing for it, and who is ahead.
//
// The leaders used to have a bordered banner of their own at 17px. That reads
// well for one name and badly for the state the week actually spends most of
// its time in -- one decided game leaves most of the pool tied, and the banner
// became a wrapping wall of names above the table it was meant to summarise.
export const WeekSummary = styled.div`
    margin-bottom: ${space[6]};
`

// A paragraph, not a flex row. The parts are a sentence with separators in it,
// so letting them wrap as text keeps a "·" from ever landing at the start of a
// wrapped line -- which is exactly what flex-wrap with gap would do.
export const MetaBar = styled.p`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    margin: 0;
`

// The two things on the line worth reading at full strength: the amount, and
// whoever is ahead. Everything else is scaffolding between them.
//
// Weight is set explicitly because GlobalStyle turns off synthesis and this
// system has no bold -- a bare <strong> would otherwise render at 400 here.
export const MetaValue = styled.strong`
    font-weight: ${font.medium};
    color: ${color.ink};
    font-variant-numeric: tabular-nums;
`

// Reveals the names behind a wide tie. Styled as text rather than as a control:
// it sits mid-sentence, so a border or a fill would break the line it lives in.
export const LeaderToggle = styled.button`
    appearance: none;
    background: none;
    border: 0;
    padding: 0;
    margin: 0;
    font: inherit;
    color: ${color.ink};
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: ${color.borderStrong};

    /* inline-flex to keep the chevron beside the text; baseline so the button
       sits in the sentence's own baseline run instead of setting the line box
       height and pushing the rest of the line around. */
    display: inline-flex;
    align-items: center;
    gap: ${space[1]};
    vertical-align: baseline;

    &:hover {
        text-decoration-color: ${color.ink};
    }

    &:focus-visible {
        outline: 2px solid ${color.accent};
        outline-offset: 2px;
        border-radius: ${radius.sm};
    }
`

// The names once revealed, on their own line under the summary so they read as
// its detail rather than as a second statement.
export const LeaderList = styled.p`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    margin: ${space[2]} 0 0 0;
    max-width: 68ch;
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

    /* Bled out to the card's edges. The page card's padding is generous because
       most pages are prose; this one is a grid that would rather have the 64px
       than the margin, and the cells carry their own padding, so nothing ends up
       flush against the border. */
    margin: 0 -${space[8]};

    ${media.upToMobile} {
        margin: 0 -${space[5]};
    }

    /* The pinned Matchups column, which grommet's column size prop does not
       reach -- so its floor is CSS. Two floors, because the column's contents
       differ by width: from the mobile breakpoint up it draws both logos, both
       abbreviations and the "@", and below it the names drop out and only the
       logos and the "@" have to fit. Both measured against the widest case the
       league can produce (WSH @ WSH: 247.7px with codes, 155.6px without) with
       enough over the top to absorb a font that renders wider than Inter.
       Undersized, the band overflows itself. */
    th:first-child,
    td:first-child {
        min-width: 168px;
    }

    ${media.fromMobile} {
        th:first-child,
        td:first-child {
            min-width: 264px;
        }
    }

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
