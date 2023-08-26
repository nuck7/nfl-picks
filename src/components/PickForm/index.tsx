import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SelectField from '../SelectField';
import { getTeams, getWeekById } from '../../resources/nfl-picks-server';
import { Matchup, Team, Week } from '../../types';
import { useLocation } from 'react-router-dom';
import { Form } from 'grommet';
import { pickDbToForm } from '../../utils/form';
import CustomFormField from '../CustomFormField';
import { SubmitButton } from '../WeekForm/index.styles';
import { AtContainer, MatchupLabel, PickContainer, StyledFormField, TeamSelectContainer } from './index.styles';
import { emptyPickFormState, emptyWeekFormState } from '../../constants';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../resources/firebase.config';

const PicksForm = () => {
    const [value, setValue] = useState({});
    const [teams, setTeams] = useState<Team[]>([]);
    const [weekId, setWeekId] = useState<string>('');
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [week, setWeek] = useState<Week>();
    const [matchups, setMatchups] = useState<Matchup[]>([]);

    const { pathname } = useLocation();
    const pathMatch = pathname.match(/\/week\/(\d|5)$/);
    const weekIdPath = pathMatch ? pathMatch[1] : pathMatch;

    if (weekIdPath != null) {
        setWeekId(weekIdPath)
    }
    const teamCollectionRef = collection(db, 'teams')
    const weekCollectionRef = collection(db, 'weeks')
    const matchupCollectionRef = collection(db, 'matchups')

    const [formState, setFormState] = useState(emptyPickFormState);
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    useEffect(() => {
        // const getWeek = async () => {
        //     const response = await getWeekById(parseInt(weekId))
        //     const formData = weekDbToForm(response)
        //     setFormState(formData)
        // }
        // getWeek().catch(console.error);
    }, [weekId])

    useMemo(() => {
        const fetchTeams = async () => {
            const q = query(teamCollectionRef)
            const querySnapshot = await getDocs(q)
            const teams = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    city: data.city,
                }
            })
            console.log(`Teams ${teams}`)
            setTeams(teams)
        }

        fetchTeams()
    }, [])

    useEffect(() => {
        const fetchWeeks = async () => {
            const q = query(weekCollectionRef)
            const querySnapshot = await getDocs(q)
            const weeks = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    start: data.start,
                    end: data.end,
                }
            })
            console.log(`Weeks ${weeks}`)

            setWeeks(weeks)
        }

        fetchWeeks()
    }, [])

    useEffect(() => {
        const fetchCurrentWeek = async () => {
            const q = query(weekCollectionRef)
            const querySnapshot = await getDocs(q)
            const week = querySnapshot.docs[0]
            if (week) {
                const data = week.data();
                setWeek({
                    id: week.id,
                    name: data.name,
                    start: data.start,
                    end: data.end,
                })
            }
        }
        fetchCurrentWeek()
    }, [])

    useEffect(() => {
        const fetchMatchups = async () => {
            const q = query(matchupCollectionRef)
            const querySnapshot = await getDocs(q)
            const matchups = querySnapshot.docs.map((doc) => {
                const data = doc.data();
            console.log(`Matchup ${JSON.stringify({
                id: doc.id,
                weekID: data.weekID,
                homeTeamID: data.homeTeamID,
                awayTeamID: data.awayTeamID,
            })}`)
                return {
                    id: doc.id,
                    weekID: data.weekID,
                    homeTeamID: data.homeTeamID,
                    awayTeamID: data.awayTeamID,
                }
            })
            // console.log(`Matchups ${JSON.stringify(matchups)}`)

            setMatchups(matchups)
        }
        fetchMatchups()
    }, [week])

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
            {matchups.length ? weeks.map((matchup: any, index: any) => {
                return (
                    <PickContainer key={`matchup_cont_${index}`}>
                        <MatchupLabel>
                            {`${matchup.away_team_city} ${matchup.away_team_name}`}
                            <AtContainer>@</AtContainer>
                            {`${matchup.home_team_city} ${matchup.home_team_name}`}
                        </MatchupLabel>
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
                                    value={matchup?.home}
                                    defaultValue={matchup?.home}
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

            {/* {formState.picks.length ? formState.picks.map((pick: any, index: any) => {
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
            }) : null} */}
            <SubmitButton primary size="large" type="submit"> Submit</SubmitButton>
        </Form>
    );
}

export default PicksForm
