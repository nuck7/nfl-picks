import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SelectField from '../SelectField';
import { EspnCompetitor, EspnMatchup, Matchup, MatchupV2, Picks, Team, Week } from '../../types';
import { useLocation } from 'react-router-dom';
import { Form } from 'grommet';
import { pickDbToForm } from '../../utils/form';
import { AtContainer, MatchupLabel, PickContainer, StyledFormField, TeamSelectContainer, SubmitButton } from './index.styles';
import { emptyPickFormStateV2 } from '../../constants';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../resources/firebase.config';
import { getDocuments } from '../../resources/firebase';
import { getCurrentWeekId, getCurrentWeekMatchups } from '../../resources/espn';

const PicksForm = () => {
    const [value, setValue] = useState({});
    const [weekId, setWeekId] = useState<number>();
    const [matchups, setMatchups] = useState<EspnMatchup[]>([]);
    const [picks, setPicks] = useState<any>();

    const { pathname } = useLocation();
    const pathMatch = pathname.match(/\/week\/(\d|5)$/);
    const weekIdPath = pathMatch ? pathMatch[1] : pathMatch;

    // if (weekIdPath != null) {
    //     setWeekId(weekIdPath)
    // }
    const matchupCollectionRef = collection(db, 'matchups')
    const pickCollectionRef = collection(db, 'picks')

    const [formState, setFormState] = useState(emptyPickFormStateV2);
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    useMemo(() => {
        const fetchMatchups = async () => {
            const matchups = await getCurrentWeekMatchups()
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
            setPicks(picks)
        }
        fetchPicks()
    }, [])

    useMemo(async() => {
        const weekId = await getCurrentWeekId()
        console.log(`weekId ${weekId}`)
        setWeekId(weekId)
        const state = formState
        state.week_id = weekId
        setFormState(formState)
    }, [matchups])

    const getMatchupOptions = (matchup: EspnMatchup, teamNames: string[]) => {
        return matchup.competitions[0].competitors.map((competitor: EspnCompetitor) => {
            return {
                name: competitor.homeAway == 'away' ? teamNames[0] : teamNames[1],
                id: parseInt(competitor.id)
            }
        })
    }

    return (
        <Form
            value={value}
            onChange={onChange}
            onSubmit={async () => {
                console.log("Submit", JSON.stringify(formState))
                // const submission = weekId ? await submitUpdatePicks(formState as any, parseInt(weekId)) : await submitCreatePicks(formState)
                // alert(`Response: ${JSON.stringify(submission)}`)
            }}
            onReset={() => setValue({})}
        >
            {matchups ? matchups.map((matchup, index: any) => {
                const teamNames = matchup.name.split(' at ')
                const options = getMatchupOptions(matchup, teamNames)

                return (
                    <PickContainer key={`matchup_cont_${index}`}>
                        <MatchupLabel>
                            {`${matchup?.name}`}
                        </MatchupLabel>
                        <TeamSelectContainer>
                            <StyledFormField name={`matchup_${index}_winning_team`} label={"Winning Team"}>
                                <SelectField
                                    id={`matchup_${index}`}
                                    label="Picked Team"
                                    name={`matchup ${index+1}`}
                                    options={options}
                                    value={formState?.picks[index]?.pickedTeam}
                                    defaultValue={formState?.picks[index]?.pickedTeam}
                                    onChange={event => {
                                        let state = formState
                                        for (const team of matchup.competitions[0].competitors) {
                                            if (team.homeAway == 'home') {
                                                state.picks[index].homeTeam.id = parseInt(team.id)
                                                state.picks[index].homeTeam.name = teamNames[1]
                                            }
                                            if (team.homeAway == 'away') {
                                                state.picks[index].awayTeam.id = parseInt(team.id)
                                                state.picks[index].awayTeam.name = teamNames[0]
                                            }
                                        }
                                        state.picks[index].pickedTeam = event.value
                                        setFormState(state)
                                    }}
                                    labelKey="name"
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