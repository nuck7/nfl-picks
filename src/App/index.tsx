import React, { useEffect, useMemo, useState } from 'react'
import { Box, Grid, Grommet } from 'grommet'
import {
    Routes,
    Route
} from 'react-router-dom'
import Home from '../components/Home'
import NavBar from '../components/NavBar'
import Login from '../components/Login'
import { ProtectedRoute } from '../components/ProtectedRoute'
import ProfileMenu from '../components/ProfileMenu'
import AppMenu from '../components/AppMenu'
import { MainContainer, Theme } from './index.styles'
import { color } from '../theme'
import Standings from '../components/Standings'
import PicksForm from '../components/PickForm'
import Teams from '../components/Teams'
import Weeks from '../components/Weeks'
import Seasons from '../components/Seasons'
import { LogOut } from '../components/LogOut'
import { espnFetchUrl, getCurrentSeason, getTeams } from '../resources/espn'
import { EspnTeam, EspnTeams, TeamsKeyed } from '../types'

export const SubmitPicksContext = React.createContext(true)
export const TeamsContext = React.createContext({})

const App = () => {
    const [showSideBar, setShowSideBar] = React.useState(false)
    const [showProfileMenu, setShowProfileMenu] = React.useState(false)
    const [canSubmitPicks, setCanSubmitPicks] = useState(true)
    const [teams, setTeams] = useState<TeamsKeyed>({});

    useMemo(async () => {
        const season = await getCurrentSeason()
        const weekEnd = new Date(season.type.week.endDate)
        const picksEnd = new Date(weekEnd.getDate())
        const nowUTC = new Date(new Date(Date.now()).toUTCString())
        console.log(`nowUTC ${nowUTC}`)
        console.log(`picksEnd ${picksEnd}`)
        console.log(`compare ${nowUTC > picksEnd}`)

        setCanSubmitPicks(nowUTC >= picksEnd)
    }, [])

    useEffect(() => {
        let teamList = {} as TeamsKeyed
        const getTeamsEspn = async () => {
            const response: EspnTeams = await getTeams()
            for (const teamRef of response.items) {
                const team: EspnTeam = await espnFetchUrl(teamRef.$ref)
                teamList[team.id] = team
            }
            setTeams(teamList)
        }
        getTeamsEspn().catch(console.error);
    }, [])

    return (
        <TeamsContext.Provider value={teams}>
            <SubmitPicksContext.Provider value={canSubmitPicks}>
                <Grommet theme={Theme}>
                    <Grid
                        rows={['auto', 'flex', 'auto']}
                        columns={['small', 'auto', 'small']}
                        gap='small'
                        areas={[
                            { name: 'nav', start: [0, 0], end: [2, 0] },
                            { name: 'appNav', start: [0, 1], end: [0, 1] },
                            { name: 'main', start: [1, 1], end: [1, 1] },
                            { name: 'profileNav', start: [2, 1], end: [2, 1] },
                        ]}
                    >
                        <Box gridArea='nav' overflow='auto' background={color.black}>
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
                        <MainContainer gridArea='main' background={color.white} alignContent='center' align='center'>
                            <Routes>
                                <Route path='login' element={<Login />} />
                                <Route path='logout' element={<LogOut />} />

                                <Route element={<ProtectedRoute />}>
                                    <Route path='/' element={<Home />} />
                                    <Route path='teams' element={<Teams />} />
                                    <Route path='weeks' element={<Weeks />} />
                                    <Route path='seasons' element={<Seasons />} />
                                    <Route path='picks' element={<PicksForm />} />
                                    <Route path='standings' element={<Standings />} />

                                </Route>
                            </Routes>
                        </MainContainer>
                        {showProfileMenu ? (
                            <ProfileMenu />
                        ) : null}
                    </Grid>
                </Grommet>
            </SubmitPicksContext.Provider>
        </TeamsContext.Provider>
    )
}

export default App
