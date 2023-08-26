import React, { useMemo, useState } from 'react';
import { Week } from '../../types';
import { DataTable, Text } from 'grommet';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../resources/firebase.config';

const Weeks = () => {
    const [weeks, setWeeks] = useState<Week[]>([]);
    const collectionRef = collection(db, 'weeks')

    useMemo(() => {
        const fetchWeeks = async () => {
            const q = query(collectionRef)
            const querySnapshot = await getDocs(q)
            const weeks = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    start: data.start,
                    end: data.end
                }
            })
            setWeeks(weeks)
        }

        fetchWeeks()
    }, [])

    return (
        <div>
            <h1>
                Weeks
            </h1>
            <div>
                {weeks.length ? (
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
                        data={weeks}
                    />
                ) : null}
            </div>
        </div>
    )
}

export default Weeks
