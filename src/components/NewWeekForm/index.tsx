import React, { useCallback, useEffect, useState } from 'react';
import { getTeams } from '../../resources/nfl-picks-server';
import { DropdownOption, Team } from '../../types';
import { matchupList } from '../../constants';
import { Button, Form, FormField, Select, TextInput } from 'grommet';
import { MatchupContainer, MatchupLabel, TeamSelectContainer, StyledFormField, SubmitButton, AtContainer, FormFieldLabel } from './index.styles';
import SelectField from '../SelectField';
import CustomFormField from '../CustomFormField';

const NewWeekForm = () => {
    const [value, setValue] = useState({});
    const [teams, setTeams] = useState<Team[]>([])
    const [weekName, setWeekName] = useState('');

    useEffect(() => {
        const fetchTeams = async () => {
            const response = await getTeams()
            setTeams(response)
        }
        fetchTeams().catch(console.error);
    }, [])
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    return (
        <Form
            value={value}
            onChange={onChange}
            onSubmit={() => console.log("Submit", value)}
            onReset={() => setValue({})}
        >
            <CustomFormField name={'week_number'} label={"Week Number"}>
                <TextInput
                    placeholder="Enter Week Number"
                    name={'week_number'}
                    value={weekName}
                    onChange={event => setWeekName(event.target.value)}
                />
            </CustomFormField>
            {matchupList.map((matchupNumber) => (
                <MatchupContainer>
                    <MatchupLabel>{`Matchup ${matchupNumber}`}</MatchupLabel>
                    <TeamSelectContainer>
                        <StyledFormField name={`matchup_${matchupNumber}_away`} label={"Away Team"}>
                            <SelectField
                                id={`${matchupNumber}_awayteam`}
                                label="Away Team"
                                name={`matchup_${matchupNumber}_away`}
                                options={teams}
                                value={''}
                                labelKey={(option) => (
                                    `${option.City} ${option.Name}`
                                )}
                                valueKey="ID"
                            />
                        </StyledFormField>
                        <AtContainer>@</AtContainer>
                        <StyledFormField name={`matchup_${matchupNumber}_home`} label={"Home Team"}>
                            <SelectField
                                id={`${matchupNumber}_hometeam`}
                                label="Home Team"
                                name={`matchup_${matchupNumber}_home`}
                                options={teams}
                                value={''}
                                labelKey={(option) => (
                                    `${option.City} ${option.Name}`
                                )}
                                valueKey="ID"
                            />
                        </StyledFormField>
                    </TeamSelectContainer>
                </MatchupContainer>
            ))}
            <SubmitButton primary size="large" type="submit"> Submit</SubmitButton>
        </Form>
    );
}

export default NewWeekForm
