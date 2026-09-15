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
import Footer from '../components/Footer'
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
import { useThemeMode } from '../utils/themeMode'

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
    isOwner: false,
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
    // every completed navigation. The menus also call closeMenus on click, which
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
    // Mounted here rather than in the menu that exposes it: the hook is what
    // writes data-theme onto <html>, so it has to run on every page whether or
    // not anyone opens the profile panel.
    const theme = useThemeMode();

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

    // The deadline follows the week rather than the page load. It used to be
    // resolved once, beside the first scoreboard request, so a rollover left it
    // pointing at the week that had just finished -- and the lock effect below,
    // which is keyed on the deadline, never re-ran to notice.
    //
    // An admin can move the lock time for a week; that override wins over the
    // deadline derived from kickoff times. A failed read leaves the default in
    // place rather than locking everyone out. Only the deadline is set here:
    // whether it has passed is the next effect's job, so one place decides it
    // rather than two that can disagree.
    //
    // Keyed on the week id alone. The games are set in the same update as the id
    // they belong to, so they are already the new week's by the time this runs,
    // and keying on the array as well would re-read the week's settings on every
    // score poll -- a Firestore read a minute, per open tab, for an answer that
    // only changes when the week does.
    useEffect(() => {
        if (!currentWeek.weekId) {
            return
        }

        let current = true

        getWeekSettings(currentWeek.weekId)
            .catch(() => undefined)
            .then((settings) => {
                if (current) {
                    setPickDeadline(getEffectiveDeadline(currentWeek.games, settings?.lockAt))
                }
            })

        return () => { current = false }
    }, [currentWeek.weekId])

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

    // ESPN's week pointer is not "the week in progress" -- it is a calendar
    // window that runs on well past the last whistle. Week 1 of 2026 ends
    // 2026-09-16T06:59Z, some 52 hours after that week's Monday night game, and
    // until then the default scoreboard still answers "week 1". Waiting on it
    // would keep picks locked for two days after the week they belong to was
    // over, so the week rolls forward here the moment it is settled instead.
    //
    // One step per run, driven from state, so a tab left open rolls forward
    // again at the end of the next week too rather than only on a reload. It
    // stops at the first week with anything left to play -- in season, the very
    // next one -- and never walks past the calendar's last week.
    const nextWeek = currentWeek.calendar.weeks.find(
        (entry) => entry.week === currentWeek.week + 1
    )

    useEffect(() => {
        if (currentWeek.loading || !weekIsSettled || !nextWeek) {
            return
        }

        let current = true

        const advance = async () => {
            const games = await getWeekMatchups(currentWeek.season, nextWeek.week)

            // A week ESPN has no games for yet is not somewhere to strand the
            // app: better the finished week than an empty one.
            if (!current || !games.length) {
                return
            }

            setCurrentWeek((state) => ({
                ...state,
                week: nextWeek.week,
                weekId: makeWeekId(state.season, nextWeek.week),
                games,
            }))
        }

        advance().catch(console.error)

        return () => { current = false }
        // nextWeek.week covers currentWeek.week: the two move together.
    }, [currentWeek.loading, currentWeek.season, weekIsSettled, nextWeek?.week])

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

                        {/* The standings is the one page whose width is set by
                            how many people are in the pool rather than by
                            reading comfort, so it alone opts out of the prose
                            cap. Both standings routes: the print sheet is the
                            same grid in a different costume. */}
                        <Main $wide={location.pathname.startsWith('/standings')}>
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

                        <Footer />

                        {showSideBar && currentUser.user ? (
                            <AppMenu onClose={closeMenus} />
                        ) : null}
                        {showProfileMenu && currentUser.user ? (
                            <ProfileMenu onClose={closeMenus} mode={theme.mode} onChooseMode={theme.chooseMode} />
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
