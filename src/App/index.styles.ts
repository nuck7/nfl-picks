import { Box } from 'grommet';
import styled from 'styled-components';
import { color } from '../theme';

export const SideBarContainer = styled.div`
    max-width: 25%
`

export const MainContainer = styled(Box)`
    border-radius: 24px;
    padding-top: 24px;
    color: ${color.black};
`

export const Theme = {
    global: {
        colors: {
            doc: '#ff99cc',
            brand: color.blue,
            focus: color.pink,
            selected: color.blue
        },
        font: {
            family: "'Roboto', sans-serif;",
          },
    }
}