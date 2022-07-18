import React from 'react';
import { Avatar, Button, Nav } from 'grommet';
import { Menu } from 'grommet-icons';
import { StyledNav } from './index.styles';
import { color } from '../../theme';

interface Props {
    openSideBar: boolean,
    setSideBar: Function,
    openProfileMenu: boolean,
    setProfileMenu: Function
}

const NavBar:React.FC<Props> = ({openSideBar, setSideBar, openProfileMenu, setProfileMenu}) => {

    return (
        <StyledNav direction="row" pad="medium">
            <Button primary onClick={() => setSideBar(!openSideBar)} color={color.black} icon={<Menu color={color.white}/>}/>
            <Button
                primary 
                onClick={() => setProfileMenu(!openProfileMenu)}
                color={color.black}
                icon={<Avatar src="//s.gravatar.com/avatar/b7fb138d53ba0f573212ccce38a7c43b?s=80" />}
            />
        </StyledNav>
    )
}

export default NavBar
