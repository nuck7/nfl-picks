import styled from 'styled-components';
import { border, color, layout, media, radius, space } from '../theme';

// The shell used to be a 3x3 grommet Grid whose left and right `small` columns
// (192px each) were reserved for the drawers at every width, whether or not
// they were open. The drawers are grommet Layers now, so they overlay and this
// is a plain column.
export const Shell = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    background: ${color.ground};
`

export const Main = styled.main`
    flex: 1 1 auto;
    width: 100%;
    max-width: ${layout.maxWidth};
    margin: 0 auto;
    padding: ${space[10]} ${layout.gutter} ${space[16]};

    ${media.upToMobile} {
        padding: ${space[6]} ${layout.gutterMobile} ${space[12]};
    }
`

// The page card. Replaces MainContainer, whose grommet align='center' was what
// made page content shrink-wrap to its widest child instead of filling.
export const Surface = styled.div`
    background: ${color.surface};
    border: ${border.hairline};
    border-radius: ${radius.xl};
    padding: ${space[8]};

    ${media.upToMobile} {
        border-radius: ${radius.lg};
        padding: ${space[5]};
    }
`
