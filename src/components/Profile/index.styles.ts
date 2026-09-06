import styled from "styled-components";
import { border, color, layout, motion, radius, space, typeStyle } from "../../theme";

export const ProfileContainer = styled.div`
    max-width: 420px;
`

export const Intro = styled.p`
    color: ${color.inkMuted};
    max-width: ${layout.readWidth};
`

export const Section = styled.div`
    margin-bottom: ${space[8]};
`

export const FieldHint = styled.p`
    color: ${color.inkMuted};
    ${typeStyle('caption')}
    margin: 0 0 ${space[4]} 0;
`

export const Detail = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${space[2]};
    color: ${color.inkMuted};
    margin-bottom: ${space[2]};
`

export const DetailLabel = styled.span`
    min-width: 96px;
`

export const Message = styled.div`
    color: ${color.inkMuted};
    margin: ${space[4]} 0;
`

export const Notice = styled.div`
    color: ${color.accent};
    margin: ${space[4]} 0;
`

export const ErrorMessage = styled.div`
    color: ${color.negative};
    margin: ${space[4]} 0;
`

/* ----------------------------------------------------------------- tabs -- */

/* Deliberately a copy of the Admin page's tab styles rather than a shared
   component: the two pages are the only tabbed surfaces in the app, and pulling
   them into one would mean reworking Admin's working implementation to suit
   this one. Worth extracting if a third ever appears. */

export const TabList = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: ${space[1]};
    border-bottom: ${border.hairline};
    margin-bottom: ${space[8]};
`

// The selected tab is marked by weight and a rule that sits on the container's
// own bottom border, so nothing shifts by a pixel when the selection moves.
export const TabButton = styled.button<{ $active?: boolean }>`
    ${typeStyle('label')}
    appearance: none;
    background: none;
    border: 0;
    border-radius: ${radius.sm} ${radius.sm} 0 0;
    padding: ${space[3]} ${space[4]};
    margin-bottom: -1px;
    cursor: pointer;
    white-space: nowrap;
    color: ${({ $active }) => ($active ? color.ink : color.inkMuted)};
    border-bottom: 2px solid ${({ $active }) => ($active ? color.ink : 'transparent')};
    transition: color ${motion.fast} ${motion.ease};

    &:hover {
        color: ${color.ink};
        background: ${color.surfaceHover};
    }

    &:focus-visible {
        outline: 2px solid ${color.accent};
        outline-offset: -2px;
    }
`

export const TabPanel = styled.div`
    /* styled-components forwards the hidden attribute, but a display rule would
       beat its default styling -- this keeps the panel genuinely hidden. */
    &[hidden] {
        display: none;
    }
`

/* -------------------------------------------------------------- results -- */

// A won week. The trophy carries the meaning at a glance down the list, and the
// record is the supporting detail rather than a second heading.
export const WinRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: ${space[3]};
    padding: ${space[3]} 0;
    border-bottom: ${border.hairline};
`

export const WinWeek = styled.span`
    ${typeStyle('lead')}
    min-width: 96px;
`

export const WinCount = styled.p`
    ${typeStyle('lead')}
    margin: 0 0 ${space[4]} 0;
`
