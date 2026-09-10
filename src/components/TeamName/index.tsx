import React from 'react';
import VisuallyHidden from '../VisuallyHidden';
import { FullName, ShortName, WideOnlyShortName } from './index.styles';

interface Props {
    full: string;
    // ESPN's code -- NE, SEA, LAR. Absent while TeamsContext is still loading,
    // in which case there is nothing to shorten to and the full name stands.
    abbreviation?: string;
    // 'mobile' shows the code only below the mobile breakpoint; 'always' shows
    // it at every width; 'fromMobile' shows it from that breakpoint up and
    // nothing below, for a column too narrow on a phone to spare the width. All
    // three keep the full name as the accessible name, so a screen reader never
    // has to decode "NE".
    when?: 'always' | 'mobile' | 'fromMobile';
}

// A team name that shortens instead of truncating. An ellipsis tells you a name
// was cut off but not what it said -- "New England Patrio…" and "New England
// Pat…" are the same amount of nothing -- whereas the abbreviation is the form
// people already read on a scoreboard.
const TeamName: React.FC<Props> = ({ full, abbreviation, when = 'mobile' }) => {
    if (!abbreviation) {
        return <>{full}</>
    }

    if (when === 'always' || when === 'fromMobile') {
        const Code = when === 'always' ? 'span' : WideOnlyShortName

        return (
            <>
                <Code aria-hidden='true'>{abbreviation}</Code>
                <VisuallyHidden>{full}</VisuallyHidden>
            </>
        )
    }

    return (
        <>
            <FullName aria-hidden='true'>{full}</FullName>
            <ShortName aria-hidden='true'>{abbreviation}</ShortName>
            <VisuallyHidden>{full}</VisuallyHidden>
        </>
    )
}

export default TeamName
