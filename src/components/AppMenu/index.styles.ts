import { Button } from 'grommet'
import styled, { keyframes } from 'styled-components'
import { color, motion, radius, space, typeStyle } from '../../theme'
import LinkButton from '../LinkButton'

// The drawer is the nav bar continued downward rather than a separate white
// panel dropped on top of the page: same ink surface, same on-dark link states.
// It used to be a plain Box of default grommet buttons on white, which read as
// unstyled next to a bar that is now near-black.
export const Drawer = styled.div`
    display: flex;
    flex-direction: column;
    width: min(320px, 84vw);
    height: 100%;
    padding: ${space[3]} ${space[3]} ${space[6]};
    background: ${color.ink};
    /* A lit edge rather than a border: on a dark drawer over a dark scrim, this
       is what actually separates the two. */
    box-shadow: inset -1px 0 0 rgba(250, 249, 247, 0.08);
`

export const DrawerHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${space[3]};
    padding: ${space[1]} ${space[1]} ${space[1]} ${space[3]};
    margin-bottom: ${space[4]};
`

export const DrawerBrand = styled.span`
    ${typeStyle('caption')}
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: ${color.inkInverseMuted};
`

export const CloseButton = styled(Button)`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    width: 40px;
    padding: 0;
    border: none;
    border-radius: ${radius.circle};
    background: transparent;
    color: ${color.inkInverse};

    &:hover { background: ${color.surfaceInverseHover}; }

    /* grommet-icons paints fill and stroke from its own theme, which resolves
       to near-black and vanishes here. Same fix the nav bar's icons need. */
    svg {
        fill: currentColor;
        stroke: currentColor;
    }
`

// Each item arrives just after the one above it. Small enough to read as the
// menu settling rather than as an effect -- 40ms apart, four items, done in
// under a fifth of a second after the drawer itself lands.
const arrive = keyframes`
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
`

export const DrawerNav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: ${space[1]};
`

export const DrawerLink = styled(LinkButton)`
    ${typeStyle('subsection')}
    position: relative;
    display: flex;
    align-items: center;
    /* The extra start padding is the gutter the current-page marker sits in, so
       selecting an item never shifts its label. */
    padding: ${space[3]} ${space[4]} ${space[3]} ${space[5]};
    border: none;
    border-radius: ${radius.md};
    background: transparent;
    color: ${color.inkInverseMuted};
    text-align: start;
    text-decoration: none;
    transition: color ${motion.fast} ${motion.ease},
                background-color ${motion.fast} ${motion.ease};
    animation: ${arrive} ${motion.slow} ${motion.ease} both;
    animation-delay: calc(var(--index, 0) * 40ms);

    &:hover {
        color: ${color.inkInverse};
        background: ${color.surfaceInverseHover};
    }

    &[aria-current='page'] {
        color: ${color.inkInverse};
        background: ${color.surfaceInverseActive};
    }

    /* A lit bar rather than a weight change: 400 -> 500 on the current item
       would reflow every label in the drawer as you navigate. */
    &[aria-current='page']::before {
        content: '';
        position: absolute;
        inset-inline-start: ${space[2]};
        top: 50%;
        width: 3px;
        height: 18px;
        transform: translateY(-50%);
        border-radius: ${radius.pill};
        background: ${color.inkInverse};
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`
