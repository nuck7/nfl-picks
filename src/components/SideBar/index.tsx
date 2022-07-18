import React from 'react';
import { Avatar, Button, Nav, Sidebar } from 'grommet';
import { Link } from 'react-router-dom';
import { MenuOption } from '../../types';

interface Props {
    options: MenuOption[]
}

const SideBar:React.FC<Props> = ({options}) => {
    return (
    <Sidebar round="small">
        <Nav gap="small">
            {options.map((option: MenuOption) => (
                <Button href={option.link}>{option.label}</Button>
            ))}
        </Nav>
    </Sidebar>
)
            }

export default SideBar
