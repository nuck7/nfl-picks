import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getTeams, getWeekById } from '../../resources/nfl-picks-server';
import { Team } from '../../types';
import { emptyWeekFormState, matchupList } from '../../constants';
import { DateInput, Form, TextInput } from 'grommet';
import { MatchupContainer, MatchupLabel, TeamSelectContainer, StyledFormField, SubmitButton, AtContainer, FormFieldLabel, DateContainer } from './index.styles';
import SelectField from '../SelectField';
import CustomFormField from '../CustomFormField';
import { useParams } from 'react-router-dom';
import { submitNewWeekForm, weekDbToForm } from '../../utils/form';

const NewWeekForm = () => {
    const [value, setValue] = useState({});
    const [teams, setTeams] = useState<Team[]>([]);
    const { weekId } = useParams();
    const [formState, setFormState] = useState(emptyWeekFormState)
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    useMemo(() => {
        const fetchTeams = async () => {
            const response = await getTeams()
            setTeams(response)
        }
        fetchTeams().catch(console.error);
    }, [])

    useEffect(() => {
        if (weekId) {
            const getWeek = async () => {
                const response = await getWeekById(parseInt(weekId))
                console.log('Week by id', response)
                const formData = weekDbToForm(response)
                // setFormState(formData)
            }
            getWeek().catch(console.error);
        }
    }, [])

    return (
        <Form
            value={value}
            onChange={onChange}
            onSubmit={() => {
                console.log("Submit", formState)
                submitNewWeekForm(formState)
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
            {matchupList.map((matchupNumber) => (
                <MatchupContainer>
                    <MatchupLabel>{`Matchup ${matchupNumber}`}</MatchupLabel>
                    <TeamSelectContainer>
                        <StyledFormField name={`matchup_${matchupNumber}_away`} label={"Away Team"}>
                            <SelectField
                                id={`${matchupNumber}_away`}
                                label="Away Team"
                                name={`matchup_${matchupNumber}_away`}
                                options={teams}
                                value={formState.matchups[matchupNumber-1].away}
                                onChange={event => {
                                    let state = formState
                                    state.matchups[matchupNumber-1].away = event.value
                                    setFormState(state)
                                    console.log('formState', formState, matchupNumber, event.value)
                                }}
                                labelKey={(option) => (
                                    `${option.City} ${option.Name}`
                                )}
                                valueKey="ID"
                            />
                        </StyledFormField>
                        <AtContainer>@</AtContainer>
                        <StyledFormField name={`matchup_${matchupNumber}_home`} label={"Home Team"}>
                            <SelectField
                                id={`${matchupNumber}_home`}
                                label="Home Team"
                                name={`matchup_${matchupNumber}_home`}
                                options={teams}
                                value={formState.matchups[matchupNumber-1].home}
                                onChange={event => {
                                    let state = formState
                                    state.matchups[matchupNumber-1].home = event.value
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
            ))}
            <SubmitButton primary size="large" type="submit"> Submit</SubmitButton>
        </Form>
    );
}

export default NewWeekForm
