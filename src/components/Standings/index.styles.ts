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

// Everything above the grid on one line: what week you are looking at, the
// control that changes it, and the week's numbers.
//
// The spacing below the row is set here rather than left to the heading's own
// margin from GlobalStyle. That worked while the heading was the tallest thing
// in the row; with a control beside it the heading's margin no longer reaches
// the bottom of the line, so the gap before the table has to come from the row
// itself.
export const PageHeader = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: ${space[3]};
    margin-bottom: ${space[6]};

    h1 {
        margin-bottom: 0;
    }
`

// The heading and the select that rewrites it, kept together as one group: when
// the header wraps it is the week's numbers that drop to their own line, and
// the control stays with the heading it belongs to.
export const HeaderTitle = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: ${space[3]};
`

// A basis rather than a fixed width -- beside the heading it needs the room a
// week label takes and no more, but it is still the first thing to give way
// when the row runs out of space. The schedule page's select is the other place
// you change week; it is still a full-width row of its own there.
export const WeekSelectContainer = styled.div`
    flex: 0 1 200px;
    max-width: 240px;
`

// The right-hand side of the header: the print link, and under it everything
// about the week that is not the grid. Stacked and right-aligned so it sits in
// space the header was already occupying beside the heading, instead of taking
// lines of its own further down the page.
//
// `align-items: flex-end` rather than `text-align: right` so the link keeps its
// pill shape -- it is an inline-block whose width is its text, and a text
// alignment on the column would not move it.
export const HeaderMeta = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: ${space[2]};

    /* Beside a heading that can be most of the width at small sizes, and the
       header wraps before it overlaps. A wrapped flex line does not stretch its
       item, so this stays a content-width box on a line of its own -- and one
       that space-between leaves at flex-start, which put its right-aligned text
       in the middle of the page. The auto margin is what carries it to the
       right edge; text-align then right-aligns the line inside it. */
    margin-left: auto;
    text-align: right;
`

// What is in the pot, how many are playing for it, and who is ahead, in one
// line.
//
// A paragraph, not a flex row. The parts are a sentence with separators in it,
// so letting them wrap as text keeps a "\u00b7" from ever landing at the start of
// a wrapped line -- which is exactly what flex-wrap with gap would do.
//
// The leaders used to have a bordered banner of their own at 17px, under the
// week select. That reads well for one name and badly for the state the week
// actually spends most of its time in -- one decided game leaves most of the
// pool tied, and the banner became a wrapping wall of names above the table it
// was meant to summarise.
export const HeaderMetaLine = styled.p`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    margin: 0;
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
// The names behind a wide tie, under the line that counts them. Capped so a
// pool-wide tie wraps as readable text rather than one long line, and pushed
// right with a margin because a max-width box in a flex-end column is still
// positioned by the column, not by its own text alignment.
export const LeaderList = styled.p`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    margin: 0;
    max-width: 68ch;
    margin-left: auto;
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
// Why the grid is empty, in the space the grid would have filled. An empty
// table says "nobody entered" whatever the reason actually was, and the one
// reason that needs acting on -- the week never got a lock time, so the rules
// refuse the pool's picks -- looked exactly like the ordinary quiet ones.
export const TableNote = styled.p`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    margin: ${space[3]} 0 0;
    max-width: 62ch;
`

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
