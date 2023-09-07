import React, { useMemo, useState } from 'react';
import { EspnTeam, EspnTeams } from '../../types';
import { Box, DataTable, Text, Image } from 'grommet';
import { espnFetchUrl, getTeams } from '../../resources/espn';

const Teams = () => {
    const [teams, setTeams] = useState<EspnTeam[]>([]);

    useMemo(() => {
        let teamList: EspnTeam[] = []
        const getTeamsEspn = async () => {
            const teams: EspnTeams = await getTeams()
            for (const teamRef of teams.items) {
                const team: EspnTeam = await espnFetchUrl(teamRef.$ref)
                teamList.push(team)
            }
            setTeams(teamList)
        }
        getTeamsEspn().catch(console.error);
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
                                property: 'id',
                                header: 'ID',
                            },
                            {
                                property: 'displayName',
                                header: <Text>Name</Text>,
                                primary: true,
                            },
                            {
                                property: 'logo',
                                header: 'Logo',
                                render: datum => (
                                    <Box height="small" width="small">
                                        <Image
                                            fit="cover"
                                            src={datum?.logos[0]?.href}
                                        />
                                    </Box>
                                ),
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
