import React from "react";
import { Box, Grid, Grommet, Main } from 'grommet';
// import { Sheet } from './Sheet';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from "react-router-dom";
import NewWeekForm from "../components/NewWeekForm";
import Home from "../components/Home";
import NavBar from "../components/NavBar";
import SideBar from "../components/SideBar";
import { SideBarContainer } from "./index.styles";

const App = () => {
    const [showSideBar, setShowSideBar] = React.useState(false);

    return (
        <>

            <Grid
                rows={['auto', 'flex']}
                columns={['auto', 'flex']}
                gap="small"
                areas={[
                    { name: 'nav', start: [0, 0], end: [1, 0] },
                    { name: 'sidenav', start: [0, 1], end: [0, 1] },
                    { name: 'main', start: [1, 1], end: [1, 1] },
                ]}
            >
                <Box gridArea="nav" background="brand">
                    <NavBar open={showSideBar} setOpen={setShowSideBar} />
                </Box>
                {showSideBar ? (
                    <Box gridArea="sidenav"
                        background="dark-1"
                        width="small"
                        animation={[
                            { type: 'fadeIn', duration: 300 },
                            { type: 'slideRight', size: 'xlarge', duration: 150 },
                        ]}>
                        <SideBar />
                    </Box>
                ) : null}
                <Box gridArea="main" background="light-1" alignContent="center"  align="center">
                    <Routes>
                        <Route path='/' element={<Home />} />
                        <Route path='new-week-form' element={<NewWeekForm />} />
                    </Routes>
                </Box>
            </Grid>
        </>
    )
}

export default App;