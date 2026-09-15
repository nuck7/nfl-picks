import { FormField, TextInput } from "grommet";
import styled from "styled-components";
import { border, color, layout, motion, radius, space, typeStyle } from "../../theme";

export const Intro = styled.p`
    color: ${color.inkMuted};
    max-width: ${layout.readWidth};
`

export const Section = styled.div`
    margin-bottom: ${space[8]};
`

export const AddPlayerForm = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: ${space[4]};
`

// The theme gives every FormField a 20px bottom margin, which is right in a
// stacked form and wrong in these inline rows -- it would push the fields out
// of alignment with the buttons beside them.
export const StyledFormField = styled(FormField)`
    margin: 0;
`

export const Message = styled.div`
    color: ${color.inkMuted};
    margin: ${space[4]} 0;
`

export const ErrorMessage = styled.div`
    color: ${color.negative};
    margin: ${space[4]} 0;
`

export const RoleLabel = styled.span`
    white-space: nowrap;
`

// Whether a player has an entry for the week the payments table is on. Three
// states rather than a tick, because a half-finished entry is neither playing
// nor sitting out -- it is the one case an admin has to judge for themselves,
// so it shows the count instead of resolving it to a yes or a no.
//
// inkMuted for 'none' rather than inkFaint: this is 14px, and faint fails AA
// below 19px. Receding is done by not being the green one.
export const PickStatus = styled.span<{ $state: 'complete' | 'partial' | 'none' }>`
    ${typeStyle('meta')}
    white-space: nowrap;
    color: ${({ $state }) => ({
        complete: color.positive,
        partial: color.ink,
        none: color.inkMuted,
    }[$state])};
`

export const SeedNote = styled.span`
    color: ${color.inkMuted};
    ${typeStyle('caption')}
    white-space: nowrap;
`

export const NameCell = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${space[3]};
`

export const NameInput = styled(TextInput)`
    max-width: 200px;
`

// Which of the two times the field is showing -- the week's default, or an
// override somebody saved. Under the field rather than in the hint above it,
// because it describes the value sitting in the box.
export const LockNote = styled.p`
    ${typeStyle('caption')}
    color: ${color.inkMuted};
    margin: ${space[3]} 0 0 0;
`

export const LockRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: ${space[4]};
`

// Without a cap the Select fills the cell, and the column stretches to whatever
// the widest option label needs -- "Apple Pay" pushing the table wider than the
// player names beside it.
export const PaymentCell = styled.div`
    max-width: 180px;
`

// The Results tab's winner dropdown, which used to borrow the payments cap
// above. It holds full player names rather than one of four payment methods, so
// 180px truncated the longer ones and left "Not recorded" filling the box edge
// to edge -- this is the same idea with room for a name.
export const WinnerCell = styled.div`
    min-width: 200px;
    max-width: 260px;
`

// The suggested winner and, when a tie was settled on it, the tie breaker that
// settled it. Stacked rather than run together on one line: SeedNote does not
// wrap, so a single line would push the table wider than the page.
export const SuggestionCell = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${space[1]};
`

// The week the payments below belong to. Above the table rather than beside the
// heading, and narrow, so it reads as a filter on what follows it.
export const WeekSelectContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 240px;
    margin-bottom: ${space[6]};
`

export const WeekSelectLabel = styled.label`
    ${typeStyle('label')}
    /* Matches the theme's FormField label gap, so a bare Select with its own
       label sits the same way a boxed field does. */
    margin-bottom: ${space[3]};
`

export const Hint = styled.p`
    color: ${color.inkMuted};
    ${typeStyle('caption')}
    margin: 0 0 ${space[4]} 0;
`

/* -------------------------------------------------------------- confirm -- */

// The Layer theme supplies the surface, radius and scrim, so this only has to
// set the room inside it.
export const ConfirmPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${space[4]};
    padding: ${space[6]};
    max-width: 420px;
`

export const ConfirmTitle = styled.h2`
    margin: 0;
`

export const ConfirmText = styled.p`
    color: ${color.inkMuted};
    margin: 0;
`

// Right-aligned, cancel first: the destructive option should not be the one
// under the thumb, and should not be the one a stray Enter lands on.
export const ConfirmActions = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: ${space[3]};
    margin-top: ${space[2]};
`

/* ----------------------------------------------------------------- tabs -- */

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
