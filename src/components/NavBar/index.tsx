import React from 'react';
import { Button, Nav } from 'grommet';
import { Menu } from 'grommet-icons';

interface Props {
    open: boolean,
    setOpen: Function
}

const NavBar:React.FC<Props> = ({open, setOpen}) => {

    return (
        <Nav direction="row" background="dark-1" pad="medium">
            <Button primary onClick={() => setOpen(!open)} color='dark-1' icon={<Menu color="white"/>}/>
        </Nav>
    )
}

export default NavBar
