import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Form, TextInput, Image } from 'grommet';
import { emptyPickFormStateV2 } from '../../constants';
import { getCurrentWeekId, getCurrentWeekMatchups, getTeamById, getTeams } from '../../resources/espn';
import { getPicksForCurrentUser, savePicks } from '../../resources/firebase';
import { EspnCompetitor, EspnMatchup, EspnTeam, EspnTeams, PicksForm } from '../../types';
import SelectField from '../SelectField';
import { MatchupLabel, PickContainer, StyledFormField, TeamSelectContainer, SubmitButton, PointsContainer, StyledPointsFormField } from './index.styles';

const PicksForm = () => {
    const [value, setValue] = useState({});
    const [matchups, setMatchups] = useState<EspnMatchup[]>([]);
    const [picks, setPicks] = useState<PicksForm>();
    const [teams, setTeams] = useState<EspnTeams[]>();
    const [formState, setFormState] = useState(emptyPickFormStateV2);
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    useEffect(() => {
        const fetchMatchups = async () => {
            const matchups = await getCurrentWeekMatchups()
            setMatchups(matchups)
        }
        fetchMatchups()
    }, [])

    useEffect(() => {
        const fetchPicks = async () => {
            const picks = await getPicksForCurrentUser();
            if (picks) {
                setFormState(picks)
                setPicks(picks);
            }
        }
        fetchPicks()
    }, [])

    useMemo(() => {
       
    }, [])

    useMemo(async () => {
        const weekId = await getCurrentWeekId()
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

    // const getMatchupLabel = async (matchup: EspnMatchup) => {
    //     const homeTeam = matchup.competitions[0].competitors[0].homeAway == 'home' ? matchup.competitions[0].competitors[0] : matchup.competitions[0].competitors[1]
    //     const awayTeam = matchup.competitions[0].competitors[1].homeAway == 'away' ? matchup.competitions[0].competitors[1] : matchup.competitions[0].competitors[0]
    //     const homeTeamData = await getTeamById(homeTeam.id)
    //     const awayTeamData = await getTeamById(awayTeam.id)
    //     return (
    //         <div>
    //             <Box height="small" width="small">
    //                 <Image
    //                     fit="cover"
    //                     src={awayTeamData.logos[0].href}
    //                 />
    //             </Box>
    //             <div>{`${awayTeamData.displayName} @`}</div>
    //             <Box height="small" width="small">
    //                 <Image
    //                     fit="cover"
    //                     src={homeTeamData.logos[0].href}
    //                 />
    //             </Box>
    //             <div>{homeTeamData.displayName}</div>
    //         </div>
    //     )
    // }

    return (
        <Form
            value={value}
            onChange={onChange}
            onSubmit={async () => {
                await savePicks(formState);
                document.location.reload();
            }}
            onReset={() => setValue({})}
            messages={{
                required: 'This is a required field.',
            }}
        >
            {matchups ? matchups.map((matchup, index: any) => {
                const teamNames = matchup.name.split(' at ')
                const options = getMatchupOptions(matchup, teamNames)
                // const matchuLabel = getMatchupLabel(matchup)
                const matchuLabel = matchup.name
                return (
                    <PickContainer key={`matchup_cont_${index}`}>
                        <MatchupLabel>
                            {`${matchuLabel}`}
                        </MatchupLabel>
                        <TeamSelectContainer>
                            <StyledFormField
                                name={`matchup${index + 1}`}
                                htmlFor={`matchup_${index}`}
                                label={"Winning Team"}
                            >
                                <SelectField
                                    id={`matchup_${index}`}
                                    label="Picked Team"
                                    name={`matchup${index + 1}`}
                                    options={options}
                                    placeholder={`Select a team`}
                                    value={picks?.picks[index]?.pickedTeam || formState?.picks[index]?.pickedTeam}
                                    defaultValue={picks?.picks[index]?.pickedTeam || formState?.picks[index]?.pickedTeam}
                                    onChange={event => {
                                        let state = formState
                                        for (const team of matchup.competitions[0].competitors) {
                                            if (team.homeAway == 'home') {
                                                state.picks[index].homeTeam.id = team.id
                                                state.picks[index].homeTeam.name = teamNames[1]
                                            }
                                            if (team.homeAway == 'away') {
                                                state.picks[index].awayTeam.id = team.id
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
            <PointsContainer>
                <MatchupLabel>
                    Tie Breaker Points
                </MatchupLabel>
                <StyledPointsFormField name='tieBreakerPoints'>
                    <TextInput
                        focusIndicator={true}
                        name='tieBreakerPoints'
                        placeholder={`Enter total points for Monday's Game`}
                        value={formState.tieBreakerPoints}
                        onChange={event => {
                            let state = formState
                            state.tieBreakerPoints = parseInt(event.target.value) ? parseInt(event.target.value) : ''
                            setFormState(state)
                        }}
                    />
                </StyledPointsFormField>
            </PointsContainer>
            <SubmitButton primary size="large" type="submit">Submit</SubmitButton>
        </Form>
    );
}

export default PicksForm
