import React, { useEffect, useState } from 'react'
import { Box, Grommet } from 'grommet'
import {
    Navigate,
    Routes,
    Route,
    useLocation
} from 'react-router-dom'
import NavBar from '../components/NavBar'
import Login from '../components/Login'
import { ProtectedRoute } from '../components/ProtectedRoute'
import ProfileMenu from '../components/ProfileMenu'
import AppMenu from '../components/AppMenu'
import { Main, Shell, Surface } from './index.styles'
import { grommetTheme } from '../grommetTheme'
import { GlobalStyle } from '../GlobalStyle'
import Standings from '../components/Standings'
import Schedule from '../components/Schedule'
import Admin from '../components/Admin'
import Profile from '../components/Profile'
import PicksForm from '../components/PickForm'
import PrintPicks from '../components/PrintPicks'
import Teams from '../components/Teams'
import Weeks from '../components/Weeks'
import Seasons from '../components/Seasons'
import { LogOut } from '../components/LogOut'
import { TeamsSourceWeek, fetchScoreboard, getWeekMatchups, toGames, toSeasonCalendar, toSeasonWeek, toTeamsKeyed } from '../resources/espn'
import { CurrentUser, CurrentWeek, TeamsKeyed } from '../types'
import { getEffectiveDeadline } from '../utils/picks'
import { isFinal } from '../utils/grading'
import { makeWeekId } from '../utils/espn'
import { getWeekSettings } from '../resources/weeks'
import { useCurrentPlayer } from '../resources/players'

// How often to re-check ESPN while a week still has undecided games.
const ScoreRefreshMs = 60_000

// setTimeout holds its delay in a signed 32-bit int, so anything beyond ~24 days
// overflows and fires immediately. A deadline further out than this is slept to
// in stages instead.
const MaxTimeoutMs = 2_147_483_647

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
    const location = useLocation()
    const [showSideBar, setShowSideBar] = React.useState(false)
    const [showProfileMenu, setShowProfileMenu] = React.useState(false)

    const closeMenus = React.useCallback(() => {
        setShowSideBar(false)
        setShowProfileMenu(false)
    }, [])

    // Nav links used to be plain hrefs, so a full page load dismissed whichever
    // drawer was open. Client-side routing keeps them mounted, so close them on
    // every completed navigation. SideBar also calls closeMenus on click, which
    // covers tapping the link you are already on.
    useEffect(() => {
        closeMenus()
    }, [location.pathname, closeMenus])
    const [canSubmitPicks, setCanSubmitPicks] = useState(true)
    const [pickDeadline, setPickDeadline] = useState<Date>()
    // Bumped by the timer below purely to re-run the lock effect. The deadline
    // itself doesn't change, so there is nothing else to key that re-run on.
    const [lockTick, setLockTick] = useState(0)
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

            // Only the deadline is set here. Whether it has passed is the effect
            // below's job, so there is one place that decides it rather than two
            // that can disagree.
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

    // The lock used to be decided once, when the week loaded. A tab left open
    // across the deadline therefore kept the form live and kept saving picks --
    // the Firestore rules gate who can READ a week's picks by its lock time, but
    // they do not refuse a late write, so nothing downstream caught it either.
    // Sleeping until the exact moment costs one timer and no polling.
    useEffect(() => {
        if (!pickDeadline) {
            // No games to derive a deadline from, or still loading. Open, which
            // is what canSubmitPicks has always done with an unknown deadline.
            setCanSubmitPicks(true)
            return
        }

        const remaining = pickDeadline.getTime() - Date.now()

        if (remaining <= 0) {
            setCanSubmitPicks(false)
            return
        }

        setCanSubmitPicks(true)

        // Clamped, then re-armed from the tick, so a deadline past the timeout
        // ceiling sleeps in stages instead of firing straight away.
        const timer = window.setTimeout(
            () => setLockTick((tick) => tick + 1),
            Math.min(remaining, MaxTimeoutMs)
        )

        return () => window.clearTimeout(timer)
    }, [pickDeadline, lockTick])

    // ESPN's completed / winner flags are what the schedule and the standings
    // grade against, and the request above runs once at mount. On a Sunday that
    // means a tab opened at noon still shows every game as scheduled at 6pm and
    // no pick ever grades. Re-poll while the week has anything left to decide,
    // and stop the moment it doesn't -- so the other six days of the week cost
    // exactly one request, as before.
    const weekIsSettled = currentWeek.games.length > 0 && currentWeek.games.every(isFinal)

    useEffect(() => {
        if (currentWeek.loading || !currentWeek.games.length || weekIsSettled) {
            return
        }

        const timer = window.setInterval(() => {
            getWeekMatchups(currentWeek.season, currentWeek.week)
                .then((games) => setCurrentWeek((state) => ({ ...state, games })))
                .catch(console.error)
        }, ScoreRefreshMs)

        return () => window.clearInterval(timer)
        // Deliberately not [currentWeek]: that object is replaced on every poll,
        // which would tear the interval down and rebuild it each time.
    }, [currentWeek.loading, currentWeek.season, currentWeek.week, weekIsSettled])

    return (
        <CurrentUserContext.Provider value={currentUser}>
        <TeamsContext.Provider value={teams}>
            <CurrentWeekContext.Provider value={currentWeek}>
            <SubmitPicksContext.Provider value={canSubmitPicks}>
            <PickDeadlineContext.Provider value={pickDeadline}>
                <Grommet theme={grommetTheme}>
                    <GlobalStyle />
                    <Shell>
                        <NavBar
                            openSideBar={showSideBar}
                            setSideBar={setShowSideBar}
                            openProfileMenu={showProfileMenu}
                            setProfileMenu={setShowProfileMenu}
                        />

                        <Main>
                            <Surface>
                                <Routes>
                                    <Route path='login' element={<Login />} />
                                    <Route path='logout' element={<LogOut />} />

                                    <Route element={<ProtectedRoute />}>
                                        {/* The home page was instructions nobody needed. Signing
                                            in lands on the one page with something to do on it --
                                            ProtectedRoute swaps the login form for the real page at
                                            the same URL, so this redirect is what "after logging
                                            in" actually resolves to. */}
                                        <Route path='/' element={<Navigate to='/picks' replace />} />
                                        <Route path='teams' element={<Teams />} />
                                        <Route path='weeks' element={<Weeks />} />
                                        <Route path='seasons' element={<Seasons />} />
                                        <Route path='picks' element={<PicksForm />} />
                                        <Route path='standings' element={<Standings />} />
                                        {/* Admin-only, enforced in the component. A separate
                                            route rather than a print stylesheet on /standings:
                                            the sheet is a different document -- abbreviations
                                            instead of logo tiles -- not the same one restyled. */}
                                        <Route path='standings/print' element={<PrintPicks />} />
                                        <Route path='schedule' element={<Schedule />} />
                                        <Route path='admin' element={<Admin />} />
                                        <Route path='profile' element={<Profile />} />

                                    </Route>
                                </Routes>
                            </Surface>
                        </Main>

                        {showSideBar && currentUser.user ? (
                            <AppMenu onClose={closeMenus} />
                        ) : null}
                        {showProfileMenu && currentUser.user ? (
                            <ProfileMenu onClose={closeMenus} />
                        ) : null}
                    </Shell>
                </Grommet>
            </PickDeadlineContext.Provider>
            </SubmitPicksContext.Provider>
            </CurrentWeekContext.Provider>
        </TeamsContext.Provider>
        </CurrentUserContext.Provider>
    )
}

export default App
