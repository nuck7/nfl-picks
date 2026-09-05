import React, { useContext } from "react";
import { AppMenuOptions } from "../../constants";
import { color } from "../../theme";
import SideBar from "../SideBar";
import { MenuContainer } from "./index.styles";
import { CurrentUserContext } from "../../App";
import { getVisibleMenuOptions } from "../../utils/admin";
import { CurrentUser } from "../../types";

const AppMenu = () => {
    const { isAdmin } = useContext<CurrentUser>(CurrentUserContext)

    return (
    <MenuContainer gridArea="appNav"
        background={color.red}
        width="small"
        animation={[
            { type: 'fadeIn', duration: 300 },
            { type: 'slideRight', size: 'xlarge', duration: 150 },
        ]}>
        <SideBar options={getVisibleMenuOptions(AppMenuOptions, isAdmin)} />
    </MenuContainer>
    )
}

export default AppMenu
