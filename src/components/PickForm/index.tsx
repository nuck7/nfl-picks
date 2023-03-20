import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SelectField from '../SelectField';
import { getTeams, getWeekById } from '../../resources/nfl-picks-server';
import { Team } from '../../types';
import { useLocation } from 'react-router-dom';
import { Form } from 'grommet';
import { pickDbToForm } from '../../utils/form';
import CustomFormField from '../CustomFormField';
import { SubmitButton } from '../WeekForm/index.styles';
import { AtContainer, MatchupLabel, PickContainer, StyledFormField, TeamSelectContainer } from './index.styles';
import { emptyPickFormState, emptyWeekFormState } from '../../constants';

const PicksForm = () => {
    const [value, setValue] = useState({});
    const [teams, setTeams] = useState<Team[]>([]);
    const { pathname } = useLocation();

    const [formState, setFormState] = useState(emptyPickFormState);
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    useMemo(() => {
        const fetchTeams = async () => {
            const response = await getTeams()
            setTeams(response)
        }
        fetchTeams().catch(console.error);
    }, [])

    // useEffect(() => {
    //     const getWeek = async () => {
    //         const response = await getPicks(parseInt(weekId))
    //         const formData = pickDbToForm(response)
    //         setFormState(formData)
    //     }
    //     getWeek().catch(console.error);
    // }, [weekId])

    return (
        <Form
            value={value}
            onChange={onChange}
            onSubmit={async () => {
                console.log("Submit", formState)
                // const submission = weekId ? await submitUpdatePicks(formState as any, parseInt(weekId)) : await submitCreatePicks(formState)

                // alert(`Response: ${JSON.stringify(submission)}`)
            }}
            onReset={() => setValue({})}
        >
            {formState.picks.length ? formState.picks.map((pick: any, index: any) => {
                return (
                    <PickContainer key={`matchup_cont_${index}`}>
                        <MatchupLabel>
                            {`${pick.away_team_city} ${pick.away_team_name}`}
                            <AtContainer>@</AtContainer>
                            {`${pick.home_team_city} ${pick.home_team_name}`}
                        </MatchupLabel>
                        <TeamSelectContainer>
                            <StyledFormField name={`matchup_${index}_away`} label={"Away Team"}>
                                <SelectField
                                    id={`matchup_${index}_away`}
                                    label="Away Team"
                                    name={`matchup_${index}_away`}
                                    options={teams}
                                    value={pick?.away}
                                    defaultValue={pick?.away}
                                    onChange={event => {
                                        let state = formState
                                        state.picks[index].away = event.value
                                        setFormState(state)
                                    }}
                                    labelKey={(option) => (
                                        `${option.City} ${option.Name}`
                                    )}
                                    valueKey="ID"
                                />
                            </StyledFormField>
                            <AtContainer>@</AtContainer>
                            <StyledFormField name={`matchup_${index}_home`} label={"Home Team"}>
                                <SelectField
                                    id={`matchup_${index}_home`}
                                    label="Home Team"
                                    name={`matchup_${index}_home`}
                                    options={teams}
                                    value={pick?.home}
                                    defaultValue={pick?.home}
                                    onChange={event => {
                                        let state = formState
                                        state.picks[index].home = event.value
                                        setFormState(state)
                                    }}
                                    labelKey={(option) => (
                                        `${option.City} ${option.Name}`
                                    )}
                                    valueKey="ID"
                                />
                            </StyledFormField>
                        </TeamSelectContainer>
                    </PickContainer>
                )
            }) : null}
            <SubmitButton primary size="large" type="submit"> Submit</SubmitButton>
        </Form>
    );
}

export default PicksForm
