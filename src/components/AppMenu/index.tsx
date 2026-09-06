import React, { useContext } from "react";
import { Layer, ResponsiveContext } from "grommet";
import { Close } from "grommet-icons";
import { useLocation } from "react-router-dom";
import { AppMenuOptions } from "../../constants";
import { CurrentUserContext } from "../../App";
import { getVisibleMenuOptions } from "../../utils/admin";
import { CurrentUser, MenuOption } from "../../types";
import { color } from "../../theme";
import {
    CloseButton,
    Drawer,
    DrawerBrand,
    DrawerHeader,
    DrawerLink,
    DrawerNav,
} from "./index.styles";

interface Props {
    onClose: () => void
}

const AppMenu: React.FC<Props> = ({ onClose }) => {
    const { isAdmin } = useContext<CurrentUser>(CurrentUserContext)
    const size = useContext(ResponsiveContext)
    const { pathname } = useLocation()

    // The drawer is the mobile affordance only -- above the breakpoint these
    // same links live in the nav bar. This replaces the old `display: none`
    // media query, which a Layer portals out of reach of.
    if (size !== 'small') {
        return null
    }

    return (
        <Layer
            position='left'
            full='vertical'
            modal
            animation='slide'
            // The container carries the ink, not just the panel inside it: with
            // the theme's white layer background showing through, the drawer's
            // edges flashed white for the length of the slide.
            background={color.ink}
            // Without this grommet expands the Layer to fill the screen below
            // its own breakpoint -- which is every phone, i.e. the only place
            // this drawer is ever shown. The ink container then covered the
            // whole viewport instead of a 320px panel, so the scrim vanished
            // and the page behind it went black.
            responsive={false}
            onEsc={onClose}
            onClickOutside={onClose}
            aria-label='Menu'
        >
            <Drawer>
                <DrawerHeader>
                    <DrawerBrand>NFL Picks</DrawerBrand>
                    <CloseButton
                        a11yTitle='Close menu'
                        onClick={onClose}
                        icon={<Close size='18px' />}
                    />
                </DrawerHeader>

                <DrawerNav aria-label='Main'>
                    {getVisibleMenuOptions(AppMenuOptions, isAdmin).map((option: MenuOption, index) => (
                        <DrawerLink
                            key={option.label}
                            to={option.link}
                            onClick={onClose}
                            aria-current={pathname === option.link ? 'page' : undefined}
                            // Drives the stagger; the delay is per position in
                            // the list, so it stays right when Admin is hidden.
                            style={{ ['--index' as string]: index } as React.CSSProperties}
                        >
                            {option.label}
                        </DrawerLink>
                    ))}
                </DrawerNav>
            </Drawer>
        </Layer>
    )
}

export default AppMenu
