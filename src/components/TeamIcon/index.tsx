import React from 'react';
import { Grid, Image } from 'grommet';
import { EspnTeam } from '../../types';
import { StyledText, TeamContainer } from './index.styles';

interface Props {
    options: EspnTeam[]
}

const TeamIcons: React.FC<Props> = ({ options }) => {
    return (
        <Grid
            rows={['small', 'small', 'small', 'small', 'small', 'small', 'small', 'small', 'small']}
            columns={['small', 'small', 'small', 'small']}
            gap={{row: "large", column: "medium"}}
            areas={[
                { name: 'header', start: [0, 0], end: [1, 0] },
                { name: 'nav', start: [0, 1], end: [0, 1] },
                { name: 'main', start: [1, 1], end: [1, 1] },
            ]}
        >
            {options.map((option: EspnTeam) => (
                <TeamContainer key={option.id}>
                    <Image
                        fit="contain"
                        src={option.logos[0]?.href}
                    />
                    {/* displayName is "<location> <name>", so pairing it with
                        location repeated the city. name is just "Cardinals". */}
                    <StyledText>{`${option.location}`}</StyledText>
                    <StyledText>{`${option.name}`}</StyledText>
                </TeamContainer>
            ))}
        </Grid>
    )
}

export default TeamIcons
