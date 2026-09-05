import React, { useContext, useEffect, useState } from 'react';
import { Avatar, Button } from 'grommet';
import { Menu } from 'grommet-icons';
import { MenuButton, NavLink, NavLinks, ProfileButton, StyledNav } from './index.styles';
import { color } from '../../theme';
import { auth } from '../../resources/firebase.config';
import { AppMenuOptions, DefaultAvatarImage } from '../../constants';
import { CurrentUser, MenuOption } from '../../types';
import { getVisibleMenuOptions } from '../../utils/admin';
import { CurrentUserContext } from '../../App';

interface Props {
    openSideBar: boolean,
    setSideBar: Function,
    openProfileMenu: boolean,
    setProfileMenu: Function
}

const NavBar:React.FC<Props> = ({openSideBar, setSideBar, openProfileMenu, setProfileMenu}) => {
    const { isAdmin } = useContext<CurrentUser>(CurrentUserContext)
    const [avatarImage, setAvatarImage] = useState<string>(DefaultAvatarImage)

    useEffect(() => {
        if (auth.currentUser?.photoURL) {
            setAvatarImage(auth.currentUser?.photoURL)
        }
    }, [auth.currentUser])

    return (
        <StyledNav direction="row" gap="none" pad={{ horizontal: 'medium', vertical: 'xsmall' }}>
            <MenuButton
                primary
                onClick={() => setSideBar(!openSideBar)}
                color={color.black}
                icon={<Menu color={color.white} />}
            />
            <NavLinks>
                {getVisibleMenuOptions(AppMenuOptions, isAdmin).map((option: MenuOption) => (
                    <NavLink key={option.label} href={option.link} plain>
                        {option.label}
                    </NavLink>
                ))}
            </NavLinks>
            <ProfileButton
                primary
                onClick={() => setProfileMenu(!openProfileMenu)}
                color={color.black}
                icon={<Avatar size="small" src={avatarImage} />}
            />
        </StyledNav>
    )
}

export default NavBar
