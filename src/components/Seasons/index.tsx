import React, { useContext, useEffect, useState } from 'react';
import { DataTable, Text } from 'grommet';
import { CurrentWeek, Game } from '../../types';
import { CurrentWeekContext } from '../../App';
import { fetchSeasonScoreboard, toGamesByWeek } from '../../resources/espn';
import { formatGameDateTime, getKickoffWindow } from '../../utils/schedule';

type SeasonWeekRow = {
    week: number;
    label: string;
    start?: Date;
    end?: Date;
};

// The current season's weeks, with the times its games actually kick off.
// ESPN's calendar carries start/end dates too, but they are administrative
// week boundaries -- midnight to 11:59pm, and week 1's window spans ten days --
// so the times come off the games instead.
const Seasons = () => {
    const { calendar } = useContext<CurrentWeek>(CurrentWeekContext);
    const [gamesByWeek, setGamesByWeek] = useState<Record<number, Game[]>>({});

    // One request covers the whole season, so every week's times come from a
    // single fetch rather than one per week.
    useEffect(() => {
        if (!calendar.start || !calendar.end) {
            return
        }

        fetchSeasonScoreboard(calendar)
            .then((scoreboard) => setGamesByWeek(toGamesByWeek(scoreboard)))
            .catch(console.error)
    }, [calendar.start, calendar.end])

    const rows: SeasonWeekRow[] = calendar.weeks.map((week) => {
        const window = getKickoffWindow(gamesByWeek[week.week] ?? [])

        return {
            week: week.week,
            label: week.label,
            start: window?.start,
            end: window?.end,
        }
    })

    return (
        <div>
            <h1>
                {calendar.season ? `${calendar.season} Season` : 'Season'}
            </h1>
            <div>
                {rows.length ? (
                    <DataTable
                        columns={[
                            {
                                property: 'label',
                                header: <Text>Week</Text>,
                                primary: true,
                            },
                            {
                                property: 'start',
                                header: 'First kickoff',
                                render: (row: SeasonWeekRow) => (
                                    <Text>
                                        {row.start ? formatGameDateTime(row.start.toISOString()) : '—'}
                                    </Text>
                                ),
                            },
                            {
                                property: 'end',
                                header: 'Last kickoff',
                                render: (row: SeasonWeekRow) => (
                                    <Text>
                                        {row.end ? formatGameDateTime(row.end.toISOString()) : '—'}
                                    </Text>
                                ),
                            },
                        ]}
                        data={rows}
                    />
                ) : null}
            </div>
        </div>
    )
}

export default Seasons
