import { Box } from "grommet";
import styled from "styled-components";
import { breakpoint } from "../../theme";

// The slide-out menu is the mobile affordance only. Above the breakpoint the
// same links live in the nav bar, so this stays hidden even if it was left
// open before the window was widened.
export const MenuContainer = styled(Box)`
    @media (min-width: ${breakpoint.mobile}) {
        display: none;
    }
`
