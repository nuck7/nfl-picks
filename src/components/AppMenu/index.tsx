import { Box } from "grommet";
import React from "react";
import { AppMenuOptions } from "../../constants";
import { color } from "../../theme";
import SideBar from "../SideBar";

const AppMenu = () => (
    <Box gridArea="appNav"
        background={color.red}
        width="small"
        animation={[
            { type: 'fadeIn', duration: 300 },
            { type: 'slideRight', size: 'xlarge', duration: 150 },
        ]}>
        <SideBar options={AppMenuOptions} />
    </Box>
)

export default AppMenu
