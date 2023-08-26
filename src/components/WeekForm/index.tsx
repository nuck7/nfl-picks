import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getTeams, getWeekById } from '../../resources/nfl-picks-server';
import { Team } from '../../types';
import { emptyWeekFormState } from '../../constants';
import { DateInput, Form, TextInput } from 'grommet';
import { MatchupContainer, MatchupLabel, TeamSelectContainer, StyledFormField, SubmitButton, AtContainer, FormFieldLabel, DateContainer } from './index.styles';
import SelectField from '../SelectField';
import CustomFormField from '../CustomFormField';
import { useLocation } from 'react-router-dom';
import { submitCreateWeek, submitUpdateWeek, weekDbToForm } from '../../utils/form';

const WeekForm = () => {
    const [value, setValue] = useState({});
    const [teams, setTeams] = useState<Team[]>([]);
    const { pathname } = useLocation();
    const pathMatch = pathname.match(/\/week\/(\d|5)$/);
    const weekId = pathMatch ? pathMatch[1] : pathMatch;

    const [formState, setFormState] = useState(emptyWeekFormState);
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    // useMemo(() => {
    //     const fetchTeams = async () => {
    //         const response = await getTeams()
    //         setTeams(response)
    //     }
    //     fetchTeams().catch(console.error);
    // }, [])

    useEffect(() => {
        if (weekId) {
            const getWeek = async () => {
                const response = await getWeekById(parseInt(weekId))
                const formData = weekDbToForm(response)
                setFormState(formData)
            }
            getWeek().catch(console.error);
        }
    }, [weekId])

    return (
        <Form
            value={value}
            onChange={onChange}
            onSubmit={async () => {
                console.log("Submit", formState)
                const submission = weekId ? await submitUpdateWeek(formState as any, parseInt(weekId)) : await submitCreateWeek(formState)

                alert(`Response: ${JSON.stringify(submission)}`)
            }}
            onReset={() => setValue({})}
        >
            <CustomFormField name={'name'} label={"Week Name"}>
                <TextInput
                    placeholder="Enter Week Number"
                    name={'name'}
                    value={formState.name}
                    onChange={event => {
                        let newFormState = formState
                        newFormState.name = event.target.value
                        setFormState(newFormState)
                    }}
                />
            </CustomFormField>
            <DateContainer>
                <CustomFormField name={'start_date'} label={"Start Date"}>
                    <DateInput
                        format="mm/dd/yyyy"
                        name={'start_date'}
                        value={formState.start_date}
                        onChange={event => {
                            let newFormState = formState
                            newFormState.start_date = event.value.toString()
                            setFormState(newFormState)
                            // setStartDate(event.value.toString())
                        }}
                    />
                </CustomFormField>
                <CustomFormField name={'end_date'} label={"End Date"}>
                    <DateInput
                        format="mm/dd/yyyy"
                        name={'end_date'}
                        value={formState.end_date}
                        onChange={event => {
                            let newFormState = formState
                            newFormState.end_date = event.value.toString()
                            setFormState(newFormState)
                            // setEndDate(event.value.toString())
                        }}
                    />
                </CustomFormField>
            </DateContainer>
            {formState.matchups.length ? formState.matchups.map((matchup, index) => {
                return (
                <MatchupContainer key={`matchup_cont_${index}`}>
                    <MatchupLabel>{`Matchup ${index + 1}`}</MatchupLabel>
                    <TeamSelectContainer>
                        <StyledFormField name={`matchup_${index}_away`} label={"Away Team"}>
                            <SelectField
                                id={`matchup_${index}_away`}
                                label="Away Team"
                                name={`matchup_${index}_away`}
                                options={teams}
                                value={matchup?.away}
                                defaultValue={matchup?.away}
                                onChange={event => {
                                    let state = formState
                                    state.matchups[index].away = event.value
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
                                value={matchup?.home}
                                defaultValue={matchup?.home}
                                onChange={event => {
                                    let state = formState
                                    state.matchups[index].home = event.value
                                    setFormState(state)
                                }}
                                labelKey={(option) => (
                                    `${option.City} ${option.Name}`
                                )}
                                valueKey="ID"
                            />
                        </StyledFormField>
                    </TeamSelectContainer>
                </MatchupContainer>
            )}): null}
            <SubmitButton primary size="large" type="submit"> Submit</SubmitButton>
        </Form>
    );
}

export default WeekForm
