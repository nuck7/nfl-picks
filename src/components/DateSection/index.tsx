import React from 'react';
import { formatGameDate } from '../../utils/schedule';
import { Heading, Section } from './index.styles';

interface Props {
    date: string;
    children: React.ReactNode;
}

// A day's worth of games under a single date heading.
const DateSection: React.FC<Props> = ({ date, children }) => (
    <Section>
        <Heading>{formatGameDate(date)}</Heading>
        {children}
    </Section>
)

export default DateSection
export { GameTime, MatchupRow } from './index.styles';
