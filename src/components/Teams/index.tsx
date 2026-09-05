import React, { useContext } from 'react';
import { TeamsKeyed } from '../../types';
import { TeamsContext } from '../../App';
import TeamIcons from '../TeamIcon';

// The teams are already loaded once into context at app start, so this page
// renders from that rather than fetching its own copy.
const Teams = () => {
    const teams = useContext<TeamsKeyed>(TeamsContext);
    const options = Object.values(teams);

    return (
        <div>
            <h1>
                Teams
            </h1>
            <div>
                {options.length ? <TeamIcons options={options} /> : null}
            </div>
        </div>
    )
}

export default Teams
