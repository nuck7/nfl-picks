import React, { useContext, useEffect, useState } from 'react';
import { Avatar } from 'grommet';
import { Menu } from 'grommet-icons';
import { useLocation } from 'react-router-dom';
import { MenuButton, NavLink, NavLinks, ProfileButton, StyledNav } from './index.styles';
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
    const { user, isAdmin } = useContext<CurrentUser>(CurrentUserContext)
    const [avatarImage, setAvatarImage] = useState<string>(DefaultAvatarImage)
    const { pathname } = useLocation()

    // Keyed on the player rather than auth.currentUser, which is a mutable object
    // React can't compare -- the old effect only re-ran by coincidence. Resets to
    // the generic avatar on sign-out so the previous user's photo doesn't linger.
    useEffect(() => {
        setAvatarImage(user && auth.currentUser?.photoURL
            ? auth.currentUser.photoURL
            : DefaultAvatarImage)
    }, [user])

    return (
        <StyledNav direction="row" gap="none" pad={{ horizontal: 'medium', vertical: 'xsmall' }}>
            {user ? (
                <MenuButton
                    a11yTitle='Open menu'
                    aria-expanded={openSideBar}
                    onClick={() => setSideBar(!openSideBar)}
                    icon={<Menu />}
                />
            ) : null}
            <NavLinks>
                {(user ? getVisibleMenuOptions(AppMenuOptions, isAdmin) : []).map((option: MenuOption) => (
                    <NavLink
                        key={option.label}
                        to={option.link}
                        plain
                        aria-current={pathname === option.link ? 'page' : undefined}
                    >
                        {option.label}
                    </NavLink>
                ))}
            </NavLinks>
            <ProfileButton
                a11yTitle='Open profile menu'
                aria-expanded={openProfileMenu}
                onClick={() => setProfileMenu(!openProfileMenu)}
                icon={<Avatar size="small" src={avatarImage} />}
            />
        </StyledNav>
    )
}

export default NavBar
