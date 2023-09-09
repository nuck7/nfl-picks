import React from 'react';
import { Button, Nav, Sidebar } from 'grommet';
import { MenuOption } from '../../types';

interface Props {
    options: MenuOption[]
}

const SideBar:React.FC<Props> = ({options}) => {
    return (
    <Sidebar round="small">
        <Nav gap="small">
            {options.map((option: MenuOption) => (
                <Button key={`${option.label}`} href={option.link}>{option.label}</Button>
            ))}
        </Nav>
    </Sidebar>
)
            }

export default SideBar
