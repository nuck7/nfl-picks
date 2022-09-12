import React from "react";
import { Box, Grid, Grommet, Main } from 'grommet';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from "react-router-dom";
import WeekForm from "../components/WeekForm";
import Home from "../components/Home";
import NavBar from "../components/NavBar";
import ProfileMenu from "../components/ProfileMenu";
import AppMenu from "../components/AppMenu";
import { MainContainer, Theme } from "./index.styles";
import { color } from "../theme";
import Standings from "../components/Standings";
import PicksForm from "../components/PickForm";

const App = () => {
    const [showSideBar, setShowSideBar] = React.useState(false);
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);
    return (
        <Grommet theme={Theme}>
            <Grid
                rows={['auto', 'flex', 'auto']}
                columns={['small', 'auto', 'small']}
                gap="small"
                areas={[
                    { name: 'nav', start: [0, 0], end: [2, 0] },
                    { name: 'appNav', start: [0, 1], end: [0, 1] },
                    { name: 'main', start: [1, 1], end: [1, 1] },
                    { name: 'profileNav', start: [2, 1], end: [2, 1] },
                ]}
            >
                <Box gridArea="nav" overflow="auto" background={color.black}>
                    <NavBar
                        openSideBar={showSideBar}
                        setSideBar={setShowSideBar}
                        openProfileMenu={showProfileMenu}
                        setProfileMenu={setShowProfileMenu}
                    />
                </Box>
                {showSideBar ? (
                    <AppMenu />
                ) : null}
                <MainContainer gridArea="main" background={color.white} alignContent="center" align="center">
                    <Routes>
                        <Route path='/' element={<Home />} />
                        <Route path='week/add' element={<WeekForm />} />
                        <Route path='week/:weekId' element={<WeekForm />} />
                        <Route path='picks/:picksId' element={<PicksForm />} />
                        <Route path='standings/:weekId' element={<Standings />} /> 
                    </Routes>
                </MainContainer>
                {showProfileMenu ? (
                    <ProfileMenu />
                ) : null}
            </Grid>
        </Grommet>
    )
}

export default App;