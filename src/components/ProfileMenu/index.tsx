import { Box } from "grommet";
import React from "react";
import { ProfileMenuOptions } from "../../constants";
import { color } from "../../theme";
import SideBar from "../SideBar";

const ProfileMenu = () => (
    <Box gridArea="profileNav"
        background={color.red}
        width="small"
        animation={[
            { type: 'fadeIn', duration: 300 },
            { type: 'slideLeft', size: 'xlarge', duration: 150 },
        ]}>
        <SideBar options={ProfileMenuOptions} />
    </Box>
)

export default ProfileMenu
