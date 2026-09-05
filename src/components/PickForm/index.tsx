import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Form, Select, TextInput } from 'grommet';
import { createEmptyPickFormState } from '../../constants';
import { getPicksForPlayer, savePicks } from '../../resources/firebase';
import { getPlayers } from '../../resources/players';
import { CurrentUser, CurrentWeek, Game, PicksForm, Player, TeamsKeyed } from '../../types';
import { CurrentUserContext, CurrentWeekContext, PickDeadlineContext, SubmitPicksContext, TeamsContext } from '../../App';
import { getMatchupId } from '../../utils/teams';
import { alignPicksToMatchups } from '../../utils/picks';
import { formatGameTime, groupMatchupsByDate } from '../../utils/schedule';
import SelectField from '../SelectField';
import MatchupHeading from '../MatchupHeading';
import DateSection, { GameTime, MatchupRow } from '../DateSection';
import { MatchupLabel, PickContainer, StyledFormField, TeamSelectContainer, SubmitButton, PointsContainer, StyledPointsFormField, TeamOption, TeamOptionLogo, PlayerSelectContainer, PlayerSelectLabel, LockedNotice } from './index.styles';

type TeamOptionValue = {
    name: string;
    id: number;
    logo?: string;
}

// grommet uses a function labelKey for both the drop list and the selected
// value, so the icon shows up in both places.
export const renderTeamOption = (option: TeamOptionValue) => (
    <TeamOption>
        {option.logo ? <TeamOptionLogo src={option.logo} alt="" /> : null}
        {option.name}
    </TeamOption>
)

const PicksForm = () => {
    const teams = useContext<TeamsKeyed>(TeamsContext);
    const currentUser = useContext<CurrentUser>(CurrentUserContext);
    const canSubmit = useContext<boolean>(SubmitPicksContext);
    const deadline = useContext<Date | undefined>(PickDeadlineContext);
    // Admins can still enter picks after the lock -- that is the whole point of
    // entering them on someone's behalf.
    const locked = !canSubmit && !currentUser.isAdmin;
    // The week and its games are resolved once in App.
    const { games: matchups, weekId } = useContext<CurrentWeek>(CurrentWeekContext);
    const [value, setValue] = useState({});
    const [picks, setPicks] = useState<PicksForm>();
    // Who the picks are being entered for. Always the signed-in player unless an
    // admin switches it.
    const [targetPlayer, setTargetPlayer] = useState<Player>();
    const [players, setPlayers] = useState<Player[]>([]);
    const [formState, setFormState] = useState(createEmptyPickFormState);
    const onChange = useCallback((nextValue: React.SetStateAction<{}>) => setValue(nextValue), []);

    useEffect(() => {
        if (currentUser.user && !targetPlayer) {
            setTargetPlayer(currentUser.user)
        }
    }, [currentUser.user, targetPlayer])

    // Only admins can enter picks for someone else, so only they need the roster.
    useEffect(() => {
        if (!currentUser.isAdmin) {
            return
        }
        getPlayers().then(setPlayers).catch(console.error)
    }, [currentUser.isAdmin])

    useEffect(() => {
        if (!targetPlayer) {
            return
        }

        // Switching player mid-load must not let the previous player's picks land.
        let current = true

        const fetchPicks = async () => {
            const picks = await getPicksForPlayer(weekId, targetPlayer.id);
            if (!current) {
                return
            }
            // No document yet for this player and week -- start from a blank form
            // rather than leaving the previous player's picks on screen.
            setPicks(picks)
            setFormState(picks ?? createEmptyPickFormState())
        }
        fetchPicks().catch(console.error)

        return () => { current = false }
    }, [weekId, targetPlayer])

    // One slot per game in the week, carrying over anything already picked.
    // Re-runs when the saved document arrives so its picks are re-seated against
    // this week's matchups rather than left at whatever length it was stored at.
    // targetPlayer is a dependency because switching between two players who both
    // have no saved picks leaves `picks` undefined either side -- without it the
    // form would reset to zero slots and render no games at all.
    useEffect(() => {
        if (!matchups.length) {
            return
        }
        setFormState((state) => ({
            ...state,
            picks: alignPicksToMatchups(state.picks, matchups),
        }))
    }, [matchups, picks, targetPlayer])

    useEffect(() => {
        setFormState((state) => ({ ...state, week_id: weekId }))
    }, [weekId])

    // Away first, matching the order the matchup heading reads in.
    const getMatchupOptions = (matchup: Game): TeamOptionValue[] =>
        [matchup.away, matchup.home].map((side) => ({
            name: side.displayName,
            id: parseInt(side.id),
            logo: teams[side.id]?.logo,
        }))

    // formState.picks is aligned 1:1 with matchups by alignPicksToMatchups.
    const pickIndexes = new Map(matchups.map((matchup, index) => [getMatchupId(matchup), index]))

    return (
        <Form
            value={value}
            onChange={onChange}
            onSubmit={async () => {
                if (!targetPlayer || locked) {
                    return
                }
                await savePicks(formState, targetPlayer);
                document.location.reload();
            }}
            onReset={() => setValue({})}
            messages={{
                required: 'This is a required field.',
            }}
        >
            {locked ? (
                <LockedNotice>
                    Picks for this week closed{deadline ? ` at ${deadline.toLocaleString()}` : ''}.
                    You can look, but changes will not be saved.
                </LockedNotice>
            ) : null}
            {!canSubmit && currentUser.isAdmin ? (
                <LockedNotice>
                    Picks closed{deadline ? ` at ${deadline.toLocaleString()}` : ''}.
                    You can still submit as an admin.
                </LockedNotice>
            ) : null}
            {currentUser.isAdmin && players.length ? (
                <PlayerSelectContainer>
                    <PlayerSelectLabel htmlFor='pick_player'>Entering picks for</PlayerSelectLabel>
                    <Select
                        id='pick_player'
                        name='player'
                        options={players}
                        value={targetPlayer}
                        labelKey='name'
                        valueKey={{ key: 'id', reduce: false }}
                        onChange={({ option }) => setTargetPlayer(option)}
                    />
                </PlayerSelectContainer>
            ) : null}
            {groupMatchupsByDate(matchups).map((section) => (
                <DateSection key={section.key} date={section.date}>
                    {section.matchups.map((matchup) => {
                        // Grouping reorders the matchups for display, so the pick
                        // slot is looked up by id rather than by position.
                        const index = pickIndexes.get(getMatchupId(matchup)) ?? -1
                        const options = getMatchupOptions(matchup)
                        // Empty slots hold a { id: 0, name: '' } sentinel, which
                        // grommet would treat as a selection (it only checks
                        // truthiness), showing the clear button and hiding the
                        // placeholder. Pass undefined so an unpicked matchup reads
                        // as genuinely empty.
                        const pickedTeam = formState.picks[index]?.pickedTeam
                        const selectedTeam = pickedTeam?.id ? pickedTeam : undefined

                        return (
                            <PickContainer key={getMatchupId(matchup)}>
                                <MatchupRow>
                                    <MatchupHeading leadingLogos alignSeparator teams={teams} game={matchup} />
                                    <GameTime>{formatGameTime(matchup.date)}</GameTime>
                                </MatchupRow>
                                <TeamSelectContainer>
                                    <StyledFormField
                                        name={`matchup${index + 1}`}
                                        htmlFor={`matchup_${index}`}
                                    >
                                        <SelectField
                                            id={`matchup_${index}`}
                                            label="Picked Team"
                                            name={`matchup${index + 1}`}
                                            options={options}
                                            placeholder={`Select winning team`}
                                            value={selectedTeam}
                                            defaultValue={selectedTeam}
                                            onChange={event => {
                                                setFormState((state) => {
                                                    const nextPicks = [...state.picks]
                                                    nextPicks[index] = {
                                                        matchupId: getMatchupId(matchup),
                                                        homeTeam: {
                                                            id: matchup.home.id,
                                                            name: matchup.home.displayName,
                                                        },
                                                        awayTeam: {
                                                            id: matchup.away.id,
                                                            name: matchup.away.displayName,
                                                        },
                                                        // The clear button fires onChange
                                                        // with value '', and options carry
                                                        // a logo we don't want persisted.
                                                        // Store just the team, or the
                                                        // empty sentinel.
                                                        pickedTeam: event.value?.id
                                                            ? { id: event.value.id, name: event.value.name }
                                                            : { id: 0, name: '' },
                                                    }

                                                    return { ...state, picks: nextPicks }
                                                })
                                            }}
                                            labelKey={renderTeamOption}
                                            valueKey="id"
                                        />
                                    </StyledFormField>
                                </TeamSelectContainer>
                            </PickContainer>
                        )
                    })}
                </DateSection>
            ))}
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
                            const tieBreakerPoints = parseInt(event.target.value)
                            setFormState((state) => ({
                                ...state,
                                tieBreakerPoints: tieBreakerPoints ? tieBreakerPoints : '',
                            }))
                        }}
                    />
                </StyledPointsFormField>
            </PointsContainer>
            <SubmitButton primary size="large" type="submit" disabled={locked}>Submit</SubmitButton>
        </Form>
    );
}

export default PicksForm
