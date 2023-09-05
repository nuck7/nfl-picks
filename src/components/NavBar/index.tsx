import React, { useCallback, useEffect, useState } from 'react';
import { Avatar, Button } from 'grommet';
import { Menu } from 'grommet-icons';
import { StyledNav } from './index.styles';
import { color } from '../../theme';
import { auth } from '../../resources/firebase.config';
import { DefaultAvatarImage } from '../../constants';

interface Props {
    openSideBar: boolean,
    setSideBar: Function,
    openProfileMenu: boolean,
    setProfileMenu: Function
}

const NavBar:React.FC<Props> = ({openSideBar, setSideBar, openProfileMenu, setProfileMenu}) => {
    const [avatarImage, setAvatarImage] = useState<string>(DefaultAvatarImage)

    useEffect(() => {
        if (auth.currentUser?.photoURL) {
            setAvatarImage(auth.currentUser?.photoURL)
        }
    }, [auth.currentUser])

    return (
        <StyledNav direction="row" pad="medium">
            <Button primary onClick={() => setSideBar(!openSideBar)} color={color.black} icon={<Menu color={color.white}/>}/>
            <Button
                primary 
                onClick={() => setProfileMenu(!openProfileMenu)}
                color={color.black}
                icon={<Avatar src={avatarImage} />}
            />
        </StyledNav>
    )
}

export default NavBar
