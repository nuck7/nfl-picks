import { Button, FormField } from "grommet";
import styled from "styled-components";
import { border, color, radius, space, typeStyle } from "../../theme";

export const PickContainer = styled.div`
    display: flex;
    flex-direction: column;
    /* One band per game now, with no buttons underneath, so the games can
       sit close together. MatchupRow adds 12px; this brings it to 16. */
    margin-bottom: ${space[1]};
`

export const PointsContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
`

export const MatchupLabel = styled.div`
    ${typeStyle('section')}
    margin-bottom: ${space[4]};
    display: flex;
    flex-direction: row;
`

// The label size comes from the theme now; the horizontal inset is gone so the
// select lines up with the matchup band directly above it.
export const StyledFormField = styled(FormField)`
    margin: 0;
    display: flex;
    flex-direction: column;
`

export const StyledPointsFormField = styled(FormField)`
    max-width: 90%
`

export const SubmitButton = styled(Button)`
    border: 2px solid ${color.action};
    border-radius: ${radius.lg};
    padding: ${space[3]} ${space[8]};
    background: ${color.action};
    color: ${color.onAction};
    font-weight: 500;

    &:hover:not(:disabled) {
        background: ${color.actionHover};
        border-color: ${color.actionHover};
    }

    /* Faded rather than greyed out: it is the same button, just not ready yet
       (picks missing, saving, or the week locked). */
    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`

export const PlayerSelectContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 320px;
    margin-bottom: 32px;
`

export const PlayerSelectLabel = styled.label`
    ${typeStyle('label')}
    /* Matches the theme's FormField label gap, so a bare Select with its own
       label sits the same way a boxed field does. */
    margin-bottom: ${space[3]};
`

export const LockedNotice = styled.div`
    background: ${color.negativeSurface};
    border-left: 4px solid ${color.negative};
    padding: ${space[3]} ${space[4]};
    margin-bottom: ${space[6]};
    color: ${color.ink};
`

// The three-step explainer above the form. A neutral panel rather than the
// LockedNotice treatment beneath it -- that one is red because it is bad news,
// and instructions are not. Only rendered while picks are open; once the week
// closes there is nothing left to explain how to do.
export const Instructions = styled.div`
    border: ${border.hairline};
    border-radius: ${radius.lg};
    background: ${color.surface};
    padding: ${space[4]} ${space[5]};
    margin-bottom: ${space[6]};
`

export const InstructionsTitle = styled.h2`
    ${typeStyle('subsection')}
    margin: 0 0 ${space[3]} 0;
`

// An ol, not the ul used elsewhere: these are three things done in order, and
// the numbers are half the explanation.
export const InstructionsSteps = styled.ol`
    color: ${color.inkMuted};
    margin: 0;
    padding-left: ${space[5]};

    li + li {
        margin-top: ${space[2]};
    }
`

export const SubmitRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${space[4]};
    flex-wrap: wrap;
    margin-top: ${space[8]};
    padding-top: ${space[6]};
    border-top: ${border.hairline};
`

export const SaveMessage = styled.div<{ $error?: boolean }>`
    ${typeStyle('meta')}
    color: ${({ $error }) => ($error ? color.negative : color.inkMuted)};
`

export const PickProgress = styled.div`
    ${typeStyle('meta')}
    color: ${color.inkMuted};
    margin-left: auto;
    font-variant-numeric: tabular-nums;
`
