import React from "react";
import { Box, Grid, Grommet } from 'grommet';
import {
    Routes,
    Route
} from "react-router-dom";
import Home from "../components/Home";
import NavBar from "../components/NavBar";
import Login from "../components/Login";
import { ProtectedRoute } from "../components/ProtectedRoute";
import ProfileMenu from "../components/ProfileMenu";
import AppMenu from "../components/AppMenu";
import { MainContainer, Theme } from "./index.styles";
import { color } from "../theme";
import Standings from "../components/Standings";
import PicksForm from "../components/PickForm";
import Teams from "../components/Teams";
import Weeks from "../components/Weeks";
import Seasons from "../components/Seasons";

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
                        <Route path='login' element={<Login />} />

                        <Route element={<ProtectedRoute />}>
                            <Route path='/' element={<Home />} />
                            <Route path='teams' element={<Teams />} />
                            <Route path='weeks' element={<Weeks />} />
                            <Route path='seasons' element={<Seasons />} />
                            <Route path='picks' element={<PicksForm />} />
                            <Route path='standings" element={<Standings />} />
                        </Route>
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
