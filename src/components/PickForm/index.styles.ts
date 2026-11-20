import { Button, FormField } from "grommet";
import styled, { css } from "styled-components";
import { border, color, layout, media, motion, radius, space, typeStyle } from "../../theme";

export const PickContainer = styled.div`
    display: flex;
    flex-direction: column;
    /* One band per game now, with no buttons underneath, so the games can
       sit close together. MatchupRow adds 12px; this brings it to 16. */
    margin-bottom: ${space[1]};
`

export const PointsContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
`

export const MatchupLabel = styled.div`
    ${typeStyle('section')}
    margin-bottom: ${space[4]};
    display: flex;
    flex-direction: row;
`

// The label size comes from the theme now; the horizontal inset is gone so the
// select lines up with the matchup band directly above it.
export const StyledFormField = styled(FormField)`
    margin: 0;
    display: flex;
    flex-direction: column;
`

export const StyledPointsFormField = styled(FormField)`
    max-width: 90%
`

// Both bar buttons: compact, one height, on the dark dock. The global focus
// ring is the navy accent, which vanishes on chrome, so these ring in white.
const barButton = css`
    ${typeStyle('label')}
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${space[1]};
    height: 38px;
    border: none;
    border-radius: ${radius.md};
    white-space: nowrap;
    transition: background-color ${motion.fast} ${motion.ease},
                opacity ${motion.fast} ${motion.ease};

    &:focus-visible {
        outline: 2px solid ${color.inkInverse};
        outline-offset: 2px;
    }
`

// The primary action, inverted for the dark dock: a light button on chrome,
// the way the site's dark buttons sit on a light page.
export const SubmitButton = styled(Button)`
    ${barButton}
    padding: 0 ${space[4]};
    background: ${color.inkInverse};
    color: ${color.chrome};

    &:hover:not(:disabled) {
        opacity: 0.88;
    }

    /* Faded rather than greyed out: it is the same button, just not ready yet
       (picks missing, saving, or the week locked). */
    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`

export const PlayerSelectContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 320px;
    margin-bottom: 32px;
`

export const PlayerSelectLabel = styled.label`
    ${typeStyle('label')}
    /* Matches the theme's FormField label gap, so a bare Select with its own
       label sits the same way a boxed field does. */
    margin-bottom: ${space[3]};
`

export const LockedNotice = styled.div`
    background: ${color.negativeSurface};
    border-left: 4px solid ${color.negative};
    padding: ${space[3]} ${space[4]};
    margin-bottom: ${space[6]};
    color: ${color.ink};
`

// The three-step explainer above the form. A neutral panel rather than the
// LockedNotice treatment beneath it -- that one is red because it is bad news,
// and instructions are not. Only rendered while picks are open; once the week
// closes there is nothing left to explain how to do.
export const Instructions = styled.div`
    border: ${border.hairline};
    border-radius: ${radius.lg};
    background: ${color.surface};
    padding: ${space[4]} ${space[5]};
    margin-bottom: ${space[6]};
`

export const InstructionsTitle = styled.h2`
    ${typeStyle('subsection')}
    margin: 0 0 ${space[3]} 0;
`

// An ol, not the ul used elsewhere: these are three things done in order, and
// the numbers are half the explanation.
export const InstructionsSteps = styled.ol`
    color: ${color.inkMuted};
    margin: 0;
    padding-left: ${space[5]};

    li + li {
        margin-top: ${space[2]};
    }
`

// A dock across the bottom of the screen in the nav bar's chrome -- the header
// mirrored at the foot of the page -- so what is left to pick, and the way to
// get to it, never scrolls away. Fixed rather than sticky: the form sits inside
// the page card, and only a fixed bar can reach the screen edges.
export const StickyBar = styled.div`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    /* Level with the nav bar; grommet's drawers and menus (20+) cover it. */
    z-index: 10;
    padding: ${space[3]} 0;
    /* Clears the home indicator on notched phones. */
    padding-bottom: max(${space[3]}, env(safe-area-inset-bottom));
    background: ${color.chrome};
    color: ${color.inkInverse};
    /* A soft lift rather than a hairline, so the page meets the dock without
       a hard edge. */
    box-shadow: 0 -8px 24px rgba(26, 24, 22, 0.14);
`

// Lines the dock's contents up with the page card's content above it: the
// same max width as Main, inset by Main's gutter, the card's border and the
// card's padding.
export const BarInner = styled.div`
    display: flex;
    align-items: center;
    gap: ${space[2]};
    max-width: ${layout.maxWidth};
    margin: 0 auto;
    padding: 0 calc(${layout.gutter} + ${space[8]} + 1px);

    ${media.upToMobile} {
        padding: 0 calc(${layout.gutterMobile} + ${space[5]} + 1px);
    }
`

// Holds the page open by the dock's height, so the tie breaker and the last
// game can scroll clear of it.
export const BarSpacer = styled.div`
    height: calc(80px + env(safe-area-inset-bottom));
`

// Two short lines: what is left, then the tie breaker if that is missing too.
// Two lines rather than one joined with a dot, which did not fit beside the
// buttons on a phone.
export const BarStatus = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
    font-variant-numeric: tabular-nums;
`

export const BarPrimary = styled.span`
    ${typeStyle('label')}
    display: flex;
    align-items: center;
    gap: ${space[1]};
    color: ${color.inkInverse};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    /* grommet-icons paint from their own theme; same fix as the nav bar. */
    svg {
        flex: none;
        fill: currentColor;
        stroke: currentColor;
    }
`

export const BarSecondary = styled.span`
    ${typeStyle('caption')}
    color: ${color.inkInverseMuted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

// Secondary to Save: the nav bar's hover wash at rest, its active wash on
// hover, so it reads as part of the same dark surface.
export const NextButton = styled(Button)`
    ${barButton}
    padding: 0 ${space[3]};
    background: ${color.surfaceInverseHover};
    color: ${color.inkInverse};

    &:hover {
        background: ${color.surfaceInverseActive};
    }

    svg {
        fill: currentColor;
        stroke: currentColor;
    }
`
