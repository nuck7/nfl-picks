import React, { useEffect, useState } from 'react';
import SelectField from '../SelectField';
import { getTeams } from '../../resources/nfl-picks-server';

const Standings = () => {
    useEffect(() => {
        const getStandings = async () => {
            const response = await getTeams()
            // setTeams(response)
        }

        // fetchTeams().catch(console.error);
    }, [])


    return (
        <div></div>
    )
}

export default Standings
