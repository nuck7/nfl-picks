import { Button, Nav } from 'grommet';
import styled from 'styled-components';
import { breakpoint, color } from '../../theme';

// Three columns so the links sit in the true centre of the bar regardless of
// how wide the hamburger and avatar either side of them are. Nav is given
// gap="none" at the call site: grommet renders its gap as spacer <div>s, which
// would take grid cells of their own and knock the real items out of place.
export const StyledNav = styled(Nav)`
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    background: ${color.black};
`

export const MenuButton = styled(Button)`
    grid-column: 1;
    justify-self: start;
    padding: 4px;

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
        gap: 8px;
    }
`

export const NavLink = styled(Button)`
    color: ${color.white};
    font-size: 16px;
    line-height: 1;
    white-space: nowrap;
    padding: 6px 12px;
    border-radius: 4px;

    &:hover {
        text-decoration: underline;
    }
`

export const ProfileButton = styled(Button)`
    grid-column: 3;
    justify-self: end;
    padding: 4px;
`
