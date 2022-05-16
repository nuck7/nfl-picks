import React from 'react';
import { Avatar, Button, Clock, Nav, Sidebar } from 'grommet';
import { Help, Projects } from "grommet-icons";
import { SideBarOptions } from "../../constants";
import { Link } from 'react-router-dom';

const SideBar = () => (
    <Sidebar round="small"
        header={
            <Avatar src="//s.gravatar.com/avatar/b7fb138d53ba0f573212ccce38a7c43b?s=80" />
        }
    // footer={
    //     <Button icon={<Help />} hoverIndicator />
    // }
    >
        <Nav gap="small">
            {SideBarOptions.map((option) => (
                <Button href={option.link}>{option.label}</Button>
            ))}
        </Nav>
    </Sidebar>
)

export default SideBar
