import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Form, Select, TextInput } from 'grommet';
import { Checkmark } from 'grommet-icons';
import { createEmptyPickFormState } from '../../constants';
import { getPicksForPlayer, savePicks } from '../../resources/firebase';
import { getPlayers } from '../../resources/players';
import { CurrentUser, CurrentWeek, Game, GameTeam, PicksForm, Player, TeamsKeyed } from '../../types';
import { CurrentUserContext, CurrentWeekContext, PickDeadlineContext, SubmitPicksContext, TeamsContext } from '../../App';
import { getMatchupId } from '../../utils/teams';
import { alignPicksToMatchups, createEmptyPick } from '../../utils/picks';
import { readableTextOn, resolveBandColors } from '../../utils/teamColors';
import { formatGameTime, groupMatchupsByDate } from '../../utils/schedule';
import MatchupHeading from '../MatchupHeading';
import VisuallyHidden from '../VisuallyHidden';
import DateSection, { MatchupRow } from '../DateSection';
import {
    Instructions, InstructionsSteps, InstructionsTitle,
    MatchupLabel, PickContainer, TeamSelectContainer, SubmitButton, PointsContainer,
    StyledPointsFormField, PlayerSelectContainer, PlayerSelectLabel, LockedNotice,
    TeamChoice, TeamChoiceCheck, TeamChoiceLogo, TeamChoiceName, TeamChoices,
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

    // `fill` is the colour that team occupies in the band directly above, not its
    // raw primary. Three teams share #002a5c (DAL, NE, SEA) and two are both
    // #000000 (LV, PIT), so a matchup between any pair of them would otherwise
    // paint two identical buttons -- while the band beside it had already
    // resolved one of them to its alternate.
    const renderChoice = (matchup: Game, index: number, which: 'away' | 'home', fill: string) => {
        const side: GameTeam = matchup[which]
        const team = teams[side.id]
        const selected = formState.picks[index]?.pickedTeam?.id === side.id
        const background = fill
        // The band clamps its ends so white always clears 3:1, which puts every
        // team at or below 0.30 luminance -- but these labels are 16px body
        // text, needing 4.5:1, so the ink is chosen per colour rather than
        // assumed white.
        const ink = readableTextOn(background)

        return (
            <TeamChoice
                key={side.id}
                type='button'
                role='radio'
                aria-checked={selected}
                disabled={locked}
                $selected={selected}
                $background={background}
                $ink={ink}
                onClick={() => choose(matchup, index, side)}
            >
                {team?.logo ? <TeamChoiceLogo src={team.logo} alt='' /> : null}
                <TeamChoiceName>{team?.displayName ?? side.displayName}</TeamChoiceName>
                {selected ? (
                    <TeamChoiceCheck aria-hidden='true'><Checkmark size='18px' color='currentColor' /></TeamChoiceCheck>
                ) : null}
                <VisuallyHidden>{selected ? 'Selected' : 'Not selected'}</VisuallyHidden>
            </TeamChoice>
        )
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
                            Pick a winner for every game by tapping one of the two
                            teams. Tapping your pick again clears it.
                        </li>
                        <li>
                            Enter a tie breaker: the combined score of both teams in
                            the last game of the week. It only decides the week if
                            two people finish level on correct picks, and the closest
                            guess takes it.
                        </li>
                        <li>
                            Hit Submit picks. You can come back and change anything
                            until picks lock
                            {deadline ? ` at ${deadline.toLocaleString()}` : ''}.
                        </li>
                    </InstructionsSteps>
                </Instructions>
            ) : null}
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
                        // Same call MatchupHeading makes for this game, and the
                        // result is memoised, so the buttons and the band above
                        // them cannot disagree.
                        const bandColors = resolveBandColors(
                            teams[matchup.away.id],
                            teams[matchup.home.id]
                        )

                        return (
                            <PickContainer key={getMatchupId(matchup)}>
                                <MatchupRow>
                                    {/* No showResult here: the answer must not
                                        appear above the buttons you pick with. */}
                                    <MatchupHeading
                                        size='medium'
                                        tone='band'
                                        teams={teams}
                                        game={matchup}
                                        meta={formatGameTime(matchup.date)}
                                    />
                                </MatchupRow>
                                <TeamSelectContainer>
                                    <TeamChoices
                                        role='radiogroup'
                                        aria-label={`Winner of ${matchup.away.displayName} at ${matchup.home.displayName}`}
                                    >
                                        {renderChoice(matchup, index, 'away', bandColors.away)}
                                        {renderChoice(matchup, index, 'home', bandColors.home)}
                                    </TeamChoices>
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
                <SubmitButton type="submit" disabled={locked || saveState.status === 'saving'}>
                    {saveState.status === 'saving' ? 'Saving…' : 'Submit picks'}
                </SubmitButton>
                {saveState.status === 'saved' ? (
                    <SaveMessage role='status'>Picks saved.</SaveMessage>
                ) : null}
                {saveState.status === 'error' ? (
                    <SaveMessage role='alert' $error>{saveState.message}</SaveMessage>
                ) : null}
                <PickProgress>{pickedCount} of {matchups.length} picked</PickProgress>
            </SubmitRow>
        </Form>
    );
}

export default PicksForm
