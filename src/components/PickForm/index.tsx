import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Form, Select, TextInput } from 'grommet';
import { createEmptyPickFormState } from '../../constants';
import { getPicksForPlayer, savePicks } from '../../resources/firebase';
import { getPlayers, sortPlayersByName } from '../../resources/players';
import { CurrentUser, CurrentWeek, Game, GameTeam, PicksForm, Player, TeamsKeyed } from '../../types';
import { CurrentUserContext, CurrentWeekContext, PickDeadlineContext, SubmitPicksContext, TeamsContext } from '../../App';
import { getMatchupId } from '../../utils/teams';
import { alignPicksToMatchups, createEmptyPick } from '../../utils/picks';
import { formatDeadline, formatGameTime, groupMatchupsByDate } from '../../utils/schedule';
import MatchupHeading from '../MatchupHeading';
import DateSection, { MatchupRow } from '../DateSection';
import {
    Instructions, InstructionsSteps, InstructionsTitle,
    MatchupLabel, PickContainer, SubmitButton, PointsContainer,
    StyledPointsFormField, PlayerSelectContainer, PlayerSelectLabel, LockedNotice,
    SubmitRow, SaveMessage, PickProgress,
} from './index.styles';

type SaveState =
    | { status: 'idle' }
    | { status: 'saving' }
    | { status: 'saved' }
    | { status: 'error'; message: string }

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
    const [picks, setPicks] = useState<PicksForm>();
    // Who the picks are being entered for. Always the signed-in player unless an
    // admin switches it.
    const [targetPlayer, setTargetPlayer] = useState<Player>();
    const [players, setPlayers] = useState<Player[]>([]);
    // Alphabetical, so an admin entering someone's picks can find the name by
    // scanning rather than reading the whole list. Memoised so the Select isn't
    // handed a new options array on every keystroke in the form below it.
    const playerOptions = useMemo(() => sortPlayersByName(players), [players]);
    const [formState, setFormState] = useState(createEmptyPickFormState);
    const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });

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

    // formState.picks is aligned 1:1 with matchups by alignPicksToMatchups.
    const pickIndexes = useMemo(
        () => new Map(matchups.map((matchup, index) => [getMatchupId(matchup), index])),
        [matchups]
    )

    const pickedCount = formState.picks.filter((pick) => pick?.pickedTeam).length
    // Every game and the tie breaker are required; the save button stays faded
    // and disabled until both are done.
    const tieBreakerMissing = formState.tieBreakerPoints === ''
    const complete = matchups.length > 0 && pickedCount === matchups.length && !tieBreakerMissing

    // Clicking the selected team again clears it, which is what the Select's
    // clear button used to be for.
    const choose = (matchup: Game, index: number, side: GameTeam) => {
        if (locked || index < 0) {
            return
        }
        setSaveState({ status: 'idle' })
        setFormState((state) => {
            const nextPicks = [...state.picks]
            const alreadyPicked = nextPicks[index]?.pickedTeam?.id === side.id

            nextPicks[index] = {
                ...createEmptyPick(matchup),
                // Left off entirely when clearing: an unmade pick has no team.
                ...(alreadyPicked
                    ? {}
                    : { pickedTeam: { id: side.id, name: side.displayName } }),
            }

            return { ...state, picks: nextPicks }
        })
    }

    const handleSubmit = async () => {
        if (!targetPlayer) {
            setSaveState({ status: 'error', message: 'No player selected. Try reloading the page.' })
            return
        }
        if (locked) {
            setSaveState({ status: 'error', message: 'Picks are closed for this week.' })
            return
        }
        // Enter in the tie-breaker input submits the form even while the
        // button is disabled.
        if (!complete) {
            setSaveState({ status: 'error', message: 'Pick every game and enter a tie breaker.' })
            return
        }
        // Without a week the document is unfindable: both the standings and this
        // form look picks up by week_id, so a blank one saves into a void.
        if (!weekId) {
            setSaveState({ status: 'error', message: 'Still loading this week. Try again in a moment.' })
            return
        }

        setSaveState({ status: 'saving' })
        try {
            // The week comes from context at save time rather than being mirrored
            // into form state. It used to be kept there by an effect, which lost a
            // race with the effect that replaces form state when a player's saved
            // picks arrive -- that reset week_id to '' and every pick saved
            // unfindable.
            const key = await savePicks({ ...formState, week_id: weekId }, targetPlayer)
            // Keep the document id so the next submit updates this document
            // rather than creating a second one for the same player and week.
            setFormState((state) => ({ ...state, key }))
            setSaveState({ status: 'saved' })
        } catch (error) {
            // This used to be swallowed entirely -- the page reloaded whether or
            // not the write landed, so a failure was indistinguishable from a
            // success that simply didn't show up.
            console.error('Saving picks failed', error)
            setSaveState({
                status: 'error',
                message: error instanceof Error ? error.message : 'Could not save your picks.',
            })
        }
    }

    return (
        <Form onSubmit={handleSubmit}>
            {/* Hidden once the week closes -- an explainer for a form nobody can
                fill in is just noise above the notice saying why. */}
            {canSubmit ? (
                <Instructions>
                    <InstructionsTitle>How to submit your picks</InstructionsTitle>
                    <InstructionsSteps>
                        <li>
                            Tap a team in each game to pick the winner. Tap it
                            again to clear it.
                        </li>
                        <li>
                            Required: enter a tie breaker, the combined score of both teams in
                            the last game of the week. It only decides the week if
                            two people finish level on correct picks, and the closest
                            guess takes it.
                        </li>
                        <li>
                            Hit Save picks. You can come back and change anything
                            until picks lock
                            {deadline ? ` on ${formatDeadline(deadline)}` : ''}.
                        </li>
                    </InstructionsSteps>
                </Instructions>
            ) : null}
            {locked ? (
                <LockedNotice>
                    Picks for this week closed{deadline ? ` on ${formatDeadline(deadline)}` : ''}.
                    You can look, but changes will not be saved.
                </LockedNotice>
            ) : null}
            {!canSubmit && currentUser.isAdmin ? (
                <LockedNotice>
                    Picks closed{deadline ? ` on ${formatDeadline(deadline)}` : ''}.
                    You can still submit as an admin.
                </LockedNotice>
            ) : null}
            {currentUser.isAdmin && players.length ? (
                <PlayerSelectContainer>
                    <PlayerSelectLabel htmlFor='pick_player'>Entering picks for</PlayerSelectLabel>
                    <Select
                        id='pick_player'
                        name='player'
                        options={playerOptions}
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
                        const pickedId = formState.picks[index]?.pickedTeam?.id
                        const selected = pickedId === matchup.away.id ? 'away'
                            : pickedId === matchup.home.id ? 'home'
                            : undefined

                        return (
                            <PickContainer key={getMatchupId(matchup)}>
                                <MatchupRow>
                                    {/* No showResult here: the answer must not
                                        appear on the band you pick with. */}
                                    <MatchupHeading
                                        size='medium'
                                        abbreviateOnMobile
                                        tone='band'
                                        teams={teams}
                                        game={matchup}
                                        meta={formatGameTime(matchup.date)}
                                        selected={selected}
                                        disabled={locked}
                                        onSelect={(side) => choose(matchup, index, matchup[side])}
                                    />
                                </MatchupRow>
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
                        // The team buttons go dead at the lock, so leaving this
                        // one live let a closed week still look half-editable.
                        disabled={locked}
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
            <SubmitRow>
                <SubmitButton type="submit" disabled={locked || !complete || saveState.status === 'saving'}>
                    {saveState.status === 'saving' ? 'Saving…' : 'Save picks'}
                </SubmitButton>
                {saveState.status === 'saved' ? (
                    <SaveMessage role='status'>Picks saved.</SaveMessage>
                ) : null}
                {saveState.status === 'error' ? (
                    <SaveMessage role='alert' $error>{saveState.message}</SaveMessage>
                ) : null}
                <PickProgress>
                    {pickedCount} of {matchups.length} picked
                    {tieBreakerMissing ? ' · No tie breaker' : ''}
                </PickProgress>
            </SubmitRow>
        </Form>
    );
}

export default PicksForm
