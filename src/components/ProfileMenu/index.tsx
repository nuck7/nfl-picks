import { Box } from "grommet";
import React, { useContext } from "react";
import { ProfileMenuOptions } from "../../constants";
import { color } from "../../theme";
import SideBar from "../SideBar";
import { CurrentUserContext } from "../../App";
import { getVisibleMenuOptions } from "../../utils/admin";
import { CurrentUser } from "../../types";

const ProfileMenu = () => {
    const { user, isAdmin } = useContext<CurrentUser>(CurrentUserContext)

    return (
    <Box gridArea="profileNav"
        background={color.red}
        width="small"
        animation={[
            { type: 'fadeIn', duration: 300 },
            { type: 'slideLeft', size: 'xlarge', duration: 150 },
        ]}>
        <SideBar options={getVisibleMenuOptions(ProfileMenuOptions, isAdmin, !!user)} />
    </Box>
    )
}

export default ProfileMenu
