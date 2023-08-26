import React, { useMemo, useState } from 'react';
import { EspnRef, EspnSeason, EspnSeasons, Season, SeasonCreate } from '../../types';
import { DataTable, Text } from 'grommet';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../resources/firebase.config';
import { getSeason, getSeasons } from '../../resources/espn';
import { Timestamp } from 'firebase/firestore';

const Seasons = () => {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const collectionRef = collection(db, 'seasons')

    useMemo(() => {
        const fetchSeasons = async () => {
            const q = query(collectionRef)
            const querySnapshot = await getDocs(q)
            const seasons = querySnapshot.docs.map((doc) => {
                const data = doc.data();
        console.log(`start ${data.start}`)

                return {
                    id: doc.id,
                    name: data.name,
                    start: data.start,
                    end: data.end
                }
            })
            // setSeasons(seasons)
        }

        fetchSeasons()
    }, [])

    useMemo(() => {
        const getSeasonsEspn = async () => {
            const response = await getSeasons()
            processSeasons(response)
        }
        getSeasonsEspn().catch(console.error);
    }, [])

    const processSeasons = async (seasons: EspnSeasons) => {
        let transformedSeasons = await Promise.all(seasons.items.map(async (seasonRef):Promise<any> => transformSeason(seasonRef)))
        setSeasons(transformedSeasons)
    }

    const transformSeason = async (seasonRef: EspnRef): Promise<any>=> {
        const season = await getSeason(seasonRef.$ref)
        if (season != null) {
            return {
                id: season.year.toString(),
                name: season.displayName,
                start: Timestamp.fromDate(new Date(season.startDate)),
                end: Timestamp.fromDate(new Date(season.endDate)),
            }
        }
    }

    return (
        <div>
            <h1>
                Seasons
            </h1>
            <div>
                {seasons.length ? (
                    <DataTable
                        columns={[
                            {
                                property: 'name',
                                header: <Text>Name</Text>,
                                primary: true,
                            },
                            {
                                property: 'start',
                                header: 'Start',
                                render: data => (
                                    <Text>{data.start.toDate().toDateString()}</Text>
                                    )
                            },
                            {
                                property: 'end',
                                header: 'End',
                                render: data => (
                                    <Text>{data.end.toDate().toDateString()}</Text>
                                )
                            },
                        ]}
                        data={seasons}
                    />
                ) : null}
            </div>
        </div>
    )
}

export default Seasons
