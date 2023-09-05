import React, { useEffect, useMemo, useState } from 'react';
import SelectField from '../SelectField';
import { Table, TableHeader, TableRow, TableCell, TableBody, DataTable } from 'grommet';
import { db } from '../../resources/firebase.config';
import { getDocuments, getPicks } from '../../resources/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { getCurrentWeekMatchups } from '../../resources/espn';
import { Picks, EspnMatchup, PickRow, PicksForm, Team } from '../../types';

const Standings = () => {
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
            const picks: PicksForm[] = await getPicks()
            setUserPicks(picks)
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
                let pickRow: Record<string, any> = {
                    matchupName: matchup.name
                }
                for (const user of userPicks) {
                    if (user.user_id) {
                        columns[user.user_id] = {
                            property: user.user_id,
                            header: user.user_name,
                        }
                        pickRow[user.user_id] = user.picks[index].pickedTeam.name
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
            />
        </div>
    )
}

export default Standings