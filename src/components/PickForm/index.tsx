import React, { useCallback, useMemo, useState } from 'react';
import { Form } from 'grommet';

import { emptyPickFormStateV2 } from '../../constants';
import { getCurrentWeekId, getCurrentWeekMatchups } from '../../resources/espn';
import { getPicksForCurrentUser, savePicks } from '../../resources/firebase';
import { EspnCompetitor, EspnMatchup, PicksForm } from '../../types';
import SelectField from '../SelectField';
import { MatchupLabel, PickContainer, StyledFormField, TeamSelectContainer, SubmitButton } from './index.styles';

const PicksForm = () => {
    const [value, setValue] = useState({});
    const [, setWeekId] = useState<number>();
    const [matchups, setMatchups] = useState<EspnMatchup[]>([]);
    const [picks, setPicks] = useState<PicksForm>();

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
            const picks = await getPicksForCurrentUser();
            if (picks) {
                setFormState(picks)
                setPicks(picks);
            }
        }
        fetchPicks()
    }, [])

    useMemo(async() => {
        const weekId = await getCurrentWeekId()
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
                await savePicks(formState);
                document.location.reload();
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
                                    value={picks?.picks[index]?.pickedTeam || formState?.picks[index]?.pickedTeam}
                                    defaultValue={picks?.picks[index]?.pickedTeam || formState?.picks[index]?.pickedTeam}
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
