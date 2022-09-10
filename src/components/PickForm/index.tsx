import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { match } from 'assert';
import SelectField from '../SelectField';
import { getTeams } from '../../resources/nfl-picks-server';
import { Team } from '../../types';

const PickForm = () => {
    // Pass the useFormik() hook initial form values and a submit function that will
    // be called when the form is submitted
    const formik = useFormik({
        initialValues: {
            matchups: '',
        },
        onSubmit: values => {
            alert(JSON.stringify(values, null, 2));
        },
    });
    const [matchupSelctions, setMatchupSelctions] = useState({})
    const [teams, setTeams] = useState<Team[]>([])

    useEffect(() => {
        const fetchTeams = async () => {
            const response = await getTeams()
            setTeams(response)
        }

        console.log('teams', teams)
        fetchTeams().catch(console.error);
    }, [])
    // const teamsDropdown = React.useCallback(() => {

    //     return (
    //         {teams.map((team) => (

    //         ))}
    //     )
    // }, [])


    const matchups = [
        {
            "home_team": "Dallas Cowboys",
            "away_team": "Denver Broncos"
        },
        {
            "home_team": "New England Patriots",
            "away_team": "Pittsburg Steelers"
        },
        {
            "home_team": "Los Angeles Rams",
            "away_team": "New York Giants"
        },
        {
            "home_team": "Los Angeles Chargers",
            "away_team": "San Franciso 49ers"
        }
    ]


    return (
        <form onSubmit={formik.handleSubmit}>
            {matchups.map((matchup, index) => (
                <>
                    <div>
                        {`${matchup.away_team} @ ${matchup.home_team}`}
                    </div>
                    <label htmlFor={`Matchup ${index}`}></label>
                    {/* <SelectField
                        id={`matchup${index}`}
                        name={`matchup${index}`}
                        onChange={formik.handleChange}
                        options={[matchup.away_team, matchup.home_team]}
                        value={''}
                    /> */}
                </>
            ))
            }
            <button type="submit">Submit</button>
        </form>
    );
}

export default PickForm
