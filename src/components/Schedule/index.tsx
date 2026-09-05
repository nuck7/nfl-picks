import React, { useContext, useEffect, useState } from 'react';
import { Select } from 'grommet';
import { DropdownOption, EspnMatchup, TeamsKeyed } from '../../types';
import { TeamsContext } from '../../App';
import { getCurrentWeekId, getSeasonWeeks, getWeekMatchups } from '../../resources/espn';
import { getCurrentYear } from '../../utils/espn';
import { getMatchupId } from '../../utils/teams';
import { formatGameTime, groupMatchupsByDate } from '../../utils/schedule';
import MatchupHeading from '../MatchupHeading';
import DateSection, { GameTime, MatchupRow } from '../DateSection';
import { EmptyMessage, MatchupList, WeekSelectContainer } from './index.styles';

const Schedule = () => {
    const teams = useContext<TeamsKeyed>(TeamsContext)
    const year = getCurrentYear()
    const [weeks, setWeeks] = useState<DropdownOption[]>([])
    const [selectedWeek, setSelectedWeek] = useState<DropdownOption>()
    const [matchups, setMatchups] = useState<EspnMatchup[]>([])
    const [loading, setLoading] = useState(true)

    // Week list plus the week to open on. Defaults to the current week so the
    // page lands somewhere useful rather than on week 1.
    useEffect(() => {
        const fetchWeeks = async () => {
            const [seasonWeeks, currentWeek] = await Promise.all([
                getSeasonWeeks(year),
                getCurrentWeekId(),
            ])
            const weekOptions = seasonWeeks.items.map((_, index) => ({
                label: `Week ${index + 1}`,
                value: index + 1,
            }))
            setWeeks(weekOptions)
            setSelectedWeek(
                weekOptions.find((week) => week.value === currentWeek) ?? weekOptions[0]
            )
        }
        fetchWeeks().catch(console.error)
    }, [year])

    useEffect(() => {
        if (!selectedWeek) {
            return
        }

        // A slow request for a week the user has already navigated away from
        // must not overwrite the matchups for the week they're now on.
        let current = true
        setLoading(true)

        const fetchMatchups = async () => {
            const matchups = await getWeekMatchups(year, selectedWeek.value)
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
    }, [year, selectedWeek])

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
                                    <MatchupHeading alignSeparator teams={teams} matchup={matchup} />
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
