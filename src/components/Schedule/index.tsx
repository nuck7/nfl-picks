import React, { useContext, useEffect, useState } from 'react';
import { Select } from 'grommet';
import { CurrentWeek, DropdownOption, Game, TeamsKeyed } from '../../types';
import { CurrentWeekContext, TeamsContext } from '../../App';
import { getWeekMatchups } from '../../resources/espn';
import { getMatchupId } from '../../utils/teams';
import { formatGameTime, groupMatchupsByDate } from '../../utils/schedule';
import MatchupHeading from '../MatchupHeading';
import DateSection, { GameTime, MatchupRow } from '../DateSection';
import { EmptyMessage, MatchupList, WeekSelectContainer } from './index.styles';

const Schedule = () => {
    const teams = useContext<TeamsKeyed>(TeamsContext)
    // The season, its calendar and the current week's games all come from the
    // one scoreboard App already fetched.
    const currentWeek = useContext<CurrentWeek>(CurrentWeekContext)
    const [selectedWeek, setSelectedWeek] = useState<DropdownOption>()
    const [matchups, setMatchups] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)

    const weeks: DropdownOption[] = currentWeek.calendar.weeks.map((entry) => ({
        label: entry.label,
        value: entry.week,
    }))

    // Open on the current week, so the page lands somewhere useful rather than
    // on week 1.
    useEffect(() => {
        if (currentWeek.loading || selectedWeek) {
            return
        }

        setSelectedWeek(
            weeks.find((week) => week.value === currentWeek.week) ?? weeks[0]
        )
    }, [currentWeek, selectedWeek, weeks])

    useEffect(() => {
        if (currentWeek.loading || !selectedWeek) {
            return
        }

        // The current week's games arrived with the calendar; only another week
        // needs its own request.
        if (selectedWeek.value === currentWeek.week) {
            setMatchups(currentWeek.games)
            setLoading(false)
            return
        }

        // A slow request for a week the user has already navigated away from
        // must not overwrite the matchups for the week they're now on.
        let current = true
        setLoading(true)

        const fetchMatchups = async () => {
            const matchups = await getWeekMatchups(currentWeek.season, selectedWeek.value)
            if (current) {
                setMatchups(matchups)
            }
        }

        fetchMatchups()
            .catch(console.error)
            .finally(() => {
                if (current) {
                    setLoading(false)
                }
            })

        return () => { current = false }
    }, [currentWeek, selectedWeek])

    return (
        <div>
            <h1>
                {selectedWeek ? selectedWeek.label : 'Schedule'}
            </h1>
            <WeekSelectContainer>
                <Select
                    id='schedule_week'
                    name='week'
                    placeholder='Select a week'
                    options={weeks}
                    value={selectedWeek}
                    disabled={!weeks.length}
                    onChange={({ option }) => setSelectedWeek(option)}
                    labelKey='label'
                    valueKey='value'
                />
            </WeekSelectContainer>
            <MatchupList>
                {loading ? (
                    <EmptyMessage>Loading matchups&hellip;</EmptyMessage>
                ) : matchups.length ? (
                    groupMatchupsByDate(matchups).map((section) => (
                        <DateSection key={section.key} date={section.date}>
                            {section.matchups.map((matchup) => (
                                <MatchupRow key={getMatchupId(matchup)}>
                                    <MatchupHeading alignSeparator teams={teams} game={matchup} />
                                    <GameTime>{formatGameTime(matchup.date)}</GameTime>
                                </MatchupRow>
                            ))}
                        </DateSection>
                    ))
                ) : (
                    <EmptyMessage>No matchups for this week.</EmptyMessage>
                )}
            </MatchupList>
        </div>
    )
}

export default Schedule
