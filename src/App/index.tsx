import React, { useEffect, useState } from 'react'
import { Box, Grid, Grommet } from 'grommet'
import {
    Navigate,
    Routes,
    Route
} from 'react-router-dom'
import NavBar from '../components/NavBar'
import Login from '../components/Login'
import { ProtectedRoute } from '../components/ProtectedRoute'
import ProfileMenu from '../components/ProfileMenu'
import AppMenu from '../components/AppMenu'
import { MainContainer, Theme } from './index.styles'
import { color } from '../theme'
import Standings from '../components/Standings'
import Schedule from '../components/Schedule'
import Admin from '../components/Admin'
import Profile from '../components/Profile'
import PicksForm from '../components/PickForm'
import Teams from '../components/Teams'
import Weeks from '../components/Weeks'
import Seasons from '../components/Seasons'
import { LogOut } from '../components/LogOut'
import { TeamsSourceWeek, fetchScoreboard, toGames, toSeasonCalendar, toSeasonWeek, toTeamsKeyed } from '../resources/espn'
import { CurrentUser, CurrentWeek, TeamsKeyed } from '../types'
import { canSubmitPicks as isBeforeDeadline, getEffectiveDeadline } from '../utils/picks'
import { makeWeekId } from '../utils/espn'
import { getWeekSettings } from '../resources/weeks'
import { useCurrentPlayer } from '../resources/players'

export const SubmitPicksContext = React.createContext(true)
// The moment picks lock for the current week, so the form can say when rather
// than only that it is closed. Undefined while loading, or when a week has no
// games to derive one from.
export const PickDeadlineContext = React.createContext<Date | undefined>(undefined)
export const TeamsContext = React.createContext({})
const EmptyCurrentWeek: CurrentWeek = {
    season: 0,
    week: 0,
    weekId: '',
    games: [],
    calendar: { season: 0, start: '', end: '', weeks: [] },
    loading: true,
}

export const CurrentWeekContext = React.createContext<CurrentWeek>(EmptyCurrentWeek)
export const CurrentUserContext = React.createContext<CurrentUser>({
    user: undefined,
    isAdmin: false,
    loading: true,
    refresh: async () => {},
})

const App = () => {
    const [showSideBar, setShowSideBar] = React.useState(false)
    const [showProfileMenu, setShowProfileMenu] = React.useState(false)
    const [canSubmitPicks, setCanSubmitPicks] = useState(true)
    const [pickDeadline, setPickDeadline] = useState<Date>()
    const [teams, setTeams] = useState<TeamsKeyed>({});
    const [currentWeek, setCurrentWeek] = useState<CurrentWeek>(EmptyCurrentWeek);
    const currentUser = useCurrentPlayer();

    // One scoreboard request resolves the week every page needs: which week it
    // is, that week's games, whether picks are still open, and -- when we're on
    // week 1 -- every team in the league.
    useEffect(() => {
        const load = async () => {
            const scoreboard = await fetchScoreboard()
            const { season, week } = toSeasonWeek(scoreboard)
            const games = toGames(scoreboard)

            setCurrentWeek({
                season,
                week,
                weekId: makeWeekId(season, week),
                games,
                calendar: toSeasonCalendar(scoreboard),
                loading: false,
            })
            // An admin can move the lock time for the week; that override wins
            // over the deadline derived from kickoff times. A failed read leaves
            // the default in place rather than locking everyone out.
            const settings = await getWeekSettings(makeWeekId(season, week)).catch(() => undefined)

            setCanSubmitPicks(isBeforeDeadline(games, Date.now(), settings?.lockAt))
            setPickDeadline(getEffectiveDeadline(games, settings?.lockAt))

            // Week 1 has all 32 teams playing, so it is the one week that names
            // the whole league. Any later week costs a second request.
            setTeams(toTeamsKeyed(
                week === TeamsSourceWeek
                    ? scoreboard
                    : await fetchScoreboard({ season, week: TeamsSourceWeek })
            ))
        }
        load().catch(console.error)
    }, [])

    return (
        <CurrentUserContext.Provider value={currentUser}>
        <TeamsContext.Provider value={teams}>
            <CurrentWeekContext.Provider value={currentWeek}>
            <SubmitPicksContext.Provider value={canSubmitPicks}>
            <PickDeadlineContext.Provider value={pickDeadline}>
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
                        {showSideBar && currentUser.user ? (
                            <AppMenu />
                        ) : null}
                        <MainContainer gridArea='main' background={color.white} alignContent='center' align='center'>
                            <Routes>
                                <Route path='login' element={<Login />} />
                                <Route path='logout' element={<LogOut />} />

                                <Route element={<ProtectedRoute />}>
                                    {/* The home page was instructions nobody needed; the
                                        standings are what people open the app for. */}
                                    <Route path='/' element={<Navigate to='/standings' replace />} />
                                    <Route path='teams' element={<Teams />} />
                                    <Route path='weeks' element={<Weeks />} />
                                    <Route path='seasons' element={<Seasons />} />
                                    <Route path='picks' element={<PicksForm />} />
                                    <Route path='standings' element={<Standings />} />
                                    <Route path='schedule' element={<Schedule />} />
                                    <Route path='admin' element={<Admin />} />
                                    <Route path='profile' element={<Profile />} />

                                </Route>
                            </Routes>
                        </MainContainer>
                        {showProfileMenu && currentUser.user ? (
                            <ProfileMenu />
                        ) : null}
                    </Grid>
                </Grommet>
            </PickDeadlineContext.Provider>
            </SubmitPicksContext.Provider>
            </CurrentWeekContext.Provider>
        </TeamsContext.Provider>
        </CurrentUserContext.Provider>
    )
}

export default App
