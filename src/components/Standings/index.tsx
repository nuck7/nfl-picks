import React, { useContext, useEffect, useMemo, useState } from 'react';
import { DataTable } from 'grommet';
import { getPicks } from '../../resources/firebase';
import { getPlayers } from '../../resources/players';
import { getCurrentSeasonWeek, getCurrentWeekMatchups } from '../../resources/espn';
import { EspnMatchup, EspnTeam, Pick, PickKeyed, PicksForm, Player, SeasonWeek, TeamsKeyed } from '../../types';
import { TeamsContext } from '../../App';
import { getMatchupId, getMatchupLabel, getTeamByHomeAway } from '../../utils/teams';
import { findPickForMatchup } from '../../utils/picks';
import { isDemoMode, makeDemoPicks } from '../../fixtures/demoPicks';
import MatchupHeading from '../MatchupHeading';
import { NoPick, TeamLogo, TeamLogoContainer } from './index.styles';

type Column = {
    property: string;
    header: string;
    render?: (datum: PickKeyed) => JSX.Element;
}

// Returns the team the user picked, or undefined when they didn't pick this
// matchup. An unpicked slot has a pickedTeam id of 0, which must not be treated
// as a pick for either side.
const getPickedTeam = (
    pick: Pick | undefined,
    homeTeam: EspnTeam,
    awayTeam: EspnTeam
): EspnTeam | undefined => {
    if (!pick) {
        return undefined
    }

    const pickedId = String(pick.pickedTeam?.id ?? '')
    if (pickedId === String(homeTeam.id)) {
        return homeTeam
    }
    if (pickedId === String(awayTeam.id)) {
        return awayTeam
    }

    return undefined
}

const Standings = () => {
    const teams = useContext<TeamsKeyed>(TeamsContext)
    const [userPicks, setUserPicks] = useState<PicksForm[]>([])
    const [players, setPlayers] = useState<Player[]>([])
    const [matchups, setMatchups] = useState<EspnMatchup[]>([])
    const [seasonWeek, setSeasonWeek] = useState<SeasonWeek>()
    const [columnHeaders, setColumnHeaders] = useState<Column[]>([])
    const [rows, setRows] = useState<PickKeyed[]>([])

    useEffect(() => {
        const fetchMatchups = async () => {
            const matchups = await getCurrentWeekMatchups()
            setMatchups(matchups)
        }
        fetchMatchups().catch(console.error)
    }, [])

    useEffect(() => {
        // Columns come from the roster, not from who happens to have submitted --
        // otherwise a player the admin just added wouldn't appear at all.
        getPlayers().then(setPlayers).catch(console.error)
    }, [])

    useEffect(() => {
        const fetchSeasonWeek = async () => {
            setSeasonWeek(await getCurrentSeasonWeek())
        }
        fetchSeasonWeek().catch(console.error)
    }, [])

    useEffect(() => {
        const fetchPicks = async () => {
            const userPicks: PicksForm[] = await getPicks()
            setUserPicks(userPicks)
        }
        // Firestore can reject (expired rules, offline). Demo mode should still
        // render, so swallow the failure and leave the real picks empty.
        fetchPicks().catch(console.error)
    }, [])

    // teams must be a dependency: App loads it with 32 sequential ESPN requests,
    // so it always resolves after the matchups and picks do.
    useMemo(() => {
        if (!matchups.length || !Object.keys(teams).length) {
            return
        }

        // One entry per player, carrying their picks when they have some. Anyone
        // with picks but no roster record (older documents) is kept on the end so
        // their column doesn't silently vanish.
        const picksByPlayer = new Map(userPicks.map((entry) => [entry.user_id, entry]))
        const roster: PicksForm[] = players.map((player) => ({
            ...(picksByPlayer.get(player.id) ?? { picks: [], week_id: '', tieBreakerPoints: '' }),
            user_id: player.id,
            user_name: player.name,
        }))
        const unrostered = userPicks.filter((entry) => !players.some((player) => player.id === entry.user_id))

        const participants = isDemoMode()
            ? [...roster, ...unrostered, ...makeDemoPicks(matchups, teams, seasonWeek?.week ?? '')]
            : [...roster, ...unrostered]

        // Keyed by matchup id so the Matchups column can render the same logo
        // heading the schedule page uses; a row can only carry strings.
        const matchupsById = new Map(matchups.map((matchup) => [getMatchupId(matchup), matchup]))

        const columns: Column[] = [{
            property: 'matchupName',
            header: 'Matchups',
            render: (datum: PickKeyed) => {
                const matchup = datum.matchupId ? matchupsById.get(datum.matchupId) : undefined
                if (!matchup) {
                    return <>{datum.matchupName}</>
                }
                return <MatchupHeading compact teams={teams} matchup={matchup} />
            },
        }]

        for (const participant of participants) {
            if (!participant.user_id) {
                continue
            }
            columns.push({
                property: participant.user_id,
                header: participant.user_name ?? participant.user_id,
                render: (datum: PickKeyed) => {
                    const logo = datum[participant.user_id]
                    if (!logo) {
                        return <NoPick>&mdash;</NoPick>
                    }
                    return (
                        <TeamLogoContainer>
                            <TeamLogo fit="contain" src={logo} />
                        </TeamLogoContainer>
                    )
                },
            })
        }

        const rowData: PickKeyed[] = []
        matchups.forEach((matchup, index) => {
            const homeTeam = getTeamByHomeAway(teams, matchup, 'home')
            const awayTeam = getTeamByHomeAway(teams, matchup, 'away')

            // A team missing from the map means ESPN returned a competitor we
            // haven't resolved; skip rather than dereference undefined.
            if (!homeTeam || !awayTeam) {
                return
            }

            const pickRow: PickKeyed = {
                matchupName: getMatchupLabel(teams, matchup),
                matchupId: getMatchupId(matchup),
            }

            for (const participant of participants) {
                if (!participant.user_id) {
                    continue
                }
                const pick = findPickForMatchup(participant.picks, matchup, index)
                const pickedTeam = getPickedTeam(pick, homeTeam, awayTeam)
                pickRow[participant.user_id] = pickedTeam?.logos[0]?.href
            }

            rowData.push(pickRow)
        })

        setColumnHeaders(columns)
        setRows(rowData)
    }, [matchups, userPicks, players, teams, seasonWeek])

    return (
        <div>
            <h1>
                {seasonWeek ? `${seasonWeek.season} Week ${seasonWeek.week}` : 'Standings'}
            </h1>
            <DataTable
                columns={columnHeaders}
                data={rows}
                border={true}
            />
        </div>
    )
}

export default Standings
