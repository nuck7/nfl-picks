import React from 'react';
import { Box, Nav } from 'grommet';
import { useLocation } from 'react-router-dom';
import LinkButton from '../LinkButton';
import { MenuOption } from '../../types';

interface Props {
    options: MenuOption[]
    // The drawer used to be dismissed as a side effect of the full page reload
    // each link caused. Client-side navigation doesn't unmount it, so it has to
    // be closed explicitly.
    onNavigate?: () => void
}

const SideBar: React.FC<Props> = ({ options, onNavigate }) => {
    const { pathname } = useLocation()

    return (
        <Box pad='small' fill='vertical'>
            <Nav gap='xsmall'>
                {options.map((option: MenuOption) => (
                    <LinkButton
                        key={option.label}
                        to={option.link}
                        active={pathname === option.link}
                        onClick={onNavigate}
                        justify='start'
                        alignSelf='stretch'
                    >
                        {option.label}
                    </LinkButton>
                ))}
            </Nav>
        </Box>
    )
}

export default SideBar
