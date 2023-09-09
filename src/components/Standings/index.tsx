import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Box, DataTable, Image } from 'grommet';
import { getPicks } from '../../resources/firebase';
import { getCurrentWeekMatchups } from '../../resources/espn';
import { EspnMatchup, PickKeyed, PicksForm, TeamsKeyed } from '../../types';
import { TeamsContext } from '../../App';
import { getTeamByHomeAway } from '../../utils/teams';

const Standings = () => {
    const teams = useContext<TeamsKeyed>(TeamsContext)
    const [userPicks, setUserPicks] = useState<PicksForm[]>([])
    const [matchups, setMatchups] = useState<EspnMatchup[]>([])
    const [columnHeaders, setColumnHeaders] = useState<any>([])
    const [rows, setRows] = useState<any>([])

    useMemo(() => {
        const fetchMatchups = async () => {
            const matchups = await getCurrentWeekMatchups()
            setMatchups(matchups)
        }
        fetchMatchups()
    }, [])

    useEffect(() => {
        const fetchPicks = async () => {
            const userPicks: PicksForm[] = await getPicks()
            setUserPicks(userPicks)
        }
        fetchPicks()
    }, [])

    useMemo(() => {
        if (matchups && userPicks) {
            let rowData = []
            let columns: Record<string, any> = {
                matchup: {
                    property: 'matchupName',
                    header: 'Matchups'
                }
            }
            let index = 0
            for (const matchup of matchups) {
                let pickRow: PickKeyed = {
                    matchupName: matchup.name
                }
                const homeTeam = getTeamByHomeAway(teams, matchup, 'home')
                const awayTeam = getTeamByHomeAway(teams, matchup, 'away')
                for (const user of userPicks) {
                    if (user.user_id) {
                        const pickedTeam = homeTeam.id == user.picks[index].pickedTeam.id ? homeTeam : awayTeam
                        columns[user.user_id] = {
                            property: user.user_id,
                            header: user.user_name,
                            render: (datum: PickKeyed) => {
                            return (
                                    <Box height="xxsmall" width="xxsmall">
                                        <Image
                                            fit="cover"
                                            src={datum[user.user_id]}
                                        />
                                    </Box>
                                )
                            }
                        }
                        pickRow[user.user_id] = pickedTeam.logos[0].href
                        // pickRow[user.user_id].teamName = pickedTeam.displayName
                    }
                }
                rowData.push(pickRow)
                index++
            }
            setColumnHeaders(Object.values(columns))
            setRows(rowData)
        }
    }, [matchups, userPicks])

    return (
        <div>
            <DataTable
                columns={columnHeaders}
                data={rows}
                border={true}
            />
        </div>
    )
}

export default Standings