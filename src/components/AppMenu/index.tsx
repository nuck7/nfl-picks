import React, { useContext } from "react";
import { Layer, ResponsiveContext } from "grommet";
import { AppMenuOptions } from "../../constants";
import SideBar from "../SideBar";
import { CurrentUserContext } from "../../App";
import { getVisibleMenuOptions } from "../../utils/admin";
import { CurrentUser } from "../../types";

interface Props {
    onClose: () => void
}

const AppMenu: React.FC<Props> = ({ onClose }) => {
    const { isAdmin } = useContext<CurrentUser>(CurrentUserContext)
    const size = useContext(ResponsiveContext)

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
            onEsc={onClose}
            onClickOutside={onClose}
            aria-label='Menu'
        >
            <SideBar options={getVisibleMenuOptions(AppMenuOptions, isAdmin)} onNavigate={onClose} />
        </Layer>
    )
}

export default AppMenu
