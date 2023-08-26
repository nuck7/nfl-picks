import React, { useMemo, useState } from 'react';
import { Team } from '../../types';
import { DataTable, Text } from 'grommet';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../resources/firebase.config';

const Teams = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const collectionRef = collection(db, 'teams')

    useMemo(() => {
        const fetchTeams = async () => {
            const q = query(collectionRef)
            const querySnapshot = await getDocs(q)
            const teams = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    city: data.city,
                }
            })
            setTeams(teams)
        }

        fetchTeams()
    }, [])

    return (
        <div>
            <h1>
                Teams
            </h1>
            <div>
                {teams.length ? (
                    <DataTable
                        columns={[
                            {
                                property: 'name',
                                header: <Text>Name</Text>,
                                primary: true,
                            },
                            {
                                property: 'city',
                                header: 'City',
                            },
                        ]}
                        data={teams}
                    />
                ) : null}
            </div>
        </div>
    )
}

export default Teams
