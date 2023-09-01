import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SelectField from '../SelectField';
import { EspnCompetitor, EspnMatchup, Matchup, MatchupV2, Picks, Team, Week } from '../../types';
import { useLocation } from 'react-router-dom';
import { Form } from 'grommet';
import { pickDbToForm } from '../../utils/form';
import CustomFormField from '../CustomFormField';
import { AtContainer, MatchupLabel, PickContainer, StyledFormField, TeamSelectContainer, SubmitButton } from './index.styles';
import { emptyPickFormState, emptyPickFormStateV2, emptyWeekFormState } from '../../constants';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../resources/firebase.config';
import { getDocuments } from '../../resources/firebase';
import { getCurrentWeekMatchups } from '../../resources/espn';

const PicksForm = () => {
    const [value, setValue] = useState({});
    const [teams, setTeams] = useState<Team[]>([]);
    const [weekId, setWeekId] = useState<string>('');
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [week, setWeek] = useState<Week>();
    const [matchups, setMatchups] = useState<EspnMatchup[]>([]);
    const [picks, setPicks] = useState<any>();

    const { pathname } = useLocation();
    const pathMatch = pathname.match(/\/week\/(\d|5)$/);
    const weekIdPath = pathMatch ? pathMatch[1] : pathMatch;

    if (weekIdPath != null) {
        setWeekId(weekIdPath)
    }
    const teamCollectionRef = collection(db, 'teams')
    const weekCollectionRef = collection(db, 'weeks')
    const matchupCollectionRef = collection(db, 'matchups')
    const pickCollectionRef = collection(db, 'picks')

    const [formState, setFormState] = useState(emptyPickFormStateV2);
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    useMemo(() => {
        const fetchMatchups = async () => {
            const matchups = await getCurrentWeekMatchups()
            console.log(`matchups ${JSON.stringify(matchups)}`)
            setMatchups(matchups)
        }
        fetchMatchups()
    }, [])

    useMemo(() => {
        const fetchPicks = async () => {
            const docs = await getDocuments(pickCollectionRef)
            const doc = docs[0]
            const data = doc.data();
            const picks = {
                id: doc.id,
                userID: data.userId,
                pickedTeam: data.pickedTeam,
                weekId: data.weekId,
                matchups: data.matchups,
            }
            // console.log(`picks ${JSON.stringify(picks)}`)
            setPicks(picks)
        }
        fetchPicks()
    }, [])

    // useMemo(() => {
    //     const fetchTeams = async () => {
    //         const q = query(teamCollectionRef)
    //         const querySnapshot = await getDocs(q)
    //         const teams = querySnapshot.docs.map((doc) => {
    //             const data = doc.data();
    //             return {
    //                 id: doc.id,
    //                 name: data.name,
    //                 city: data.city,
    //             }
    //         })
    //         console.log(`Teams ${teams}`)
    //         setTeams(teams)
    //     }

    //     fetchTeams()
    // }, [])

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

    // useEffect(() => {
    //     const fetchMatchups = async () => {
    //         // const q = query(matchupCollectionRef)
    //         // const querySnapshot = await getDocs(q)
    //         const docs = await getDocuments(matchupCollectionRef)
    //         console.log(`docs ${JSON.stringify(docs)}`)

    //         const matchups = docs.map((doc) => {
    //             // let data = doc.data();                
    //             let matchup = doc.data();
    //             // matchup.id = matchup._document.key.path.segments;
    //             // console.log(`Matchups length ${JSON.stringify(_document._key)}`)

    //             // const q = query(matchupCollectionRef)
    //             // const querySnapshot = await getDocs(q)
    //             // const matchups = querySnapshot.docs.map((doc) => {
    //             //     matchup.pickRef.get()
    //             //         .then((res: { data: () => any; }) => {
    //             //             matchup.weekID = res.data()
    //             //         })
    //             //         .catch((err: any) => console.error(err));
    //             // }
    //             console.log(`Matchup ${JSON.stringify({
    //                 id: doc.id,
    //                 weekID: matchup.weekID._key.path.segments[6],
    //                 homeTeamID: matchup.homeTeamID._key.path.segments[6],
    //                 awayTeamID: matchup.awayTeamID._key.path.segments[6],
    //             })}`)
    //             return {
    //                 id: doc.id,
    //                 weekID: matchup.weekID._key.path.segments[6],
    //                 homeTeamID: matchup.homeTeamID._key.path.segments[6],
    //                 awayTeamID: matchup.awayTeamID._key.path.segments[6],
    //             }
    //         })
    //         console.log(`Matchups ${JSON.stringify(matchups)}`)

    //         setMatchups(matchups)
    //     }
    //     fetchMatchups()
    // }, [week])

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
            {matchups ? matchups.map((matchup, index: any) => {
                const teamNames = matchup.name.split(' at ')
                const options = matchup.competitions[0].competitors.map((competitor: EspnCompetitor) => {
                    return {
                        name: competitor.homeAway == 'away' ? teamNames[0] : teamNames[1],
                        id: competitor.id
                    }
                })

                return (
                    <PickContainer key={`matchup_cont_${index}`}>
                        <MatchupLabel>
                            {`${matchup?.name}`}
                        </MatchupLabel>
                        <TeamSelectContainer>
                            <StyledFormField name={`matchup_${index}_away`} label={"Winning Team"}>
                                <SelectField
                                    id={`matchup_${index}`}
                                    label="Picked Team"
                                    name={`matchup_${index}`}
                                    options={options}
                                    value={formState?.picks[index]?.pickedTeam}
                                    defaultValue={formState?.picks[index]?.pickedTeam}
                                    onChange={event => {
                                        let state = formState
                                        state.picks[index].pickedTeam.id = event.value
                                        state.picks[index].pickedTeam.name = event.label
                                        console.log(`event value ${JSON.stringify(event.value)}`)
                                        console.log(`state ${JSON.stringify(state)}`)
                                        setFormState(state)
                                    }}
                                    labelKey={(option) => (
                                        `${option.name}`
                                    )}
                                    valueKey="id"
                                />
                            </StyledFormField>
                        </TeamSelectContainer>
                    </PickContainer>
                )
            }) : null}
            <SubmitButton primary size="large" type="submit">Submit</SubmitButton>
        </Form>
    );
}

export default PicksForm