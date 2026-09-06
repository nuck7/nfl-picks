import { Button, Nav } from 'grommet';
import styled from 'styled-components';
import { breakpoint, color, layout, motion, radius, space, typeStyle } from '../../theme';
import LinkButton from '../LinkButton';

// Three columns so the links sit in the true centre of the bar regardless of
// how wide the hamburger and avatar either side of them are. Nav is given
// gap="none" at the call site: grommet renders its gap as spacer <div>s, which
// would take grid cells of their own and knock the real items out of place.
export const StyledNav = styled(Nav)`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    min-height: ${layout.navHeight};
    /* The one dark surface in the system. No hairline under it: a bar this dark
       separates itself from the ground, and a border would read as a seam. */
    background: ${color.ink};
    position: sticky;
    top: 0;
    z-index: 10;

    /* GlobalStyle's focus ring is the navy accent, which all but vanishes on
       near-black. Scoped here so the rest of the app keeps the accent ring. */
    :focus-visible {
        outline-color: ${color.inkInverse};
    }
`

const iconButton = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    width: 40px;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: ${radius.circle};

    /* grommet-icons paints fill and stroke explicitly from its own theme, which
       resolves to near-black -- invisible on this bar. Nothing but currentColor
       makes the icon follow the button's colour. */
    svg {
        fill: currentColor;
        stroke: currentColor;
    }
`

export const MenuButton = styled(Button)`
    ${iconButton}
    grid-column: 1;
    justify-self: start;
    color: ${color.inkInverse};

    &:hover { background: ${color.surfaceInverseHover}; }

    @media (min-width: ${breakpoint.mobile}) {
        display: none;
    }
`

export const NavLinks = styled.div`
    grid-column: 2;
    justify-self: center;
    display: none;

    @media (min-width: ${breakpoint.mobile}) {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: ${space[1]};
    }
`

export const NavLink = styled(LinkButton)`
    ${typeStyle('meta')}
    color: ${color.inkInverseMuted};
    text-decoration: none;
    white-space: nowrap;
    padding: ${space[2]} ${space[3]};
    border: none;
    border-radius: ${radius.pill};
    background: transparent;
    transition: color ${motion.fast} ${motion.ease},
                background-color ${motion.fast} ${motion.ease};

    &:hover {
        color: ${color.inkInverse};
        background: ${color.surfaceInverseHover};
    }

    /* Deliberately not a weight change: 400 -> 500 on the active item would
       reflow every other link in the bar as you navigate. */
    &[aria-current='page'] {
        color: ${color.inkInverse};
        background: ${color.surfaceInverseActive};
    }
`

export const ProfileButton = styled(Button)`
    ${iconButton}
    grid-column: 3;
    justify-self: end;

    &:hover { background: ${color.surfaceInverseHover}; }
`
