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
    const pickCollectionRef = collection(db, 'picks')

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
            console.log(`USER picks ${JSON.stringify(picks)}`)
            setUserPicks(picks)
        }
        fetchPicks()
    }, [])

    useMemo(() => {
        if (matchups && userPicks) {
            let columns = []
            let index = 0
            for (const matchup of matchups) {
                let pickRow: Record<string, string> = {} as PickRow;
                for (const user of userPicks) {
                    pickRow[`matchup${index}`] = user.picks[index].pickedTeam.name
                    console.log(`pickRow ${JSON.stringify(pickRow)}`)
                }
                columns.push(pickRow)
                index++
            }
            console.log(`ROWS ${JSON.stringify(columns)}`)
            setColumnHeaders(columns)
        }
    }, [matchups, userPicks])

    return (
        <div>
            <DataTable
                columns={columnHeaders}
                data={columnHeaders}
            />
        </div>
    )
}

export default Standings