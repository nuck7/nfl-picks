import { Button, FormField } from "grommet";
import styled from "styled-components";
import { Paper } from "../../utils/teamColors";
import { border, color, motion, radius, space, typeStyle } from "../../theme";

export const PickContainer = styled.div`
    display: flex;
    flex-direction: column;
    /* The gap between one matchup and the next. It has to beat the gap INSIDE a
       matchup by enough to group by proximity: at 24px against an internal 20px
       the two were indistinguishable, so a day's games read as one long run of
       bands and buttons and you had to work out which pair went with which
       band. 12 inside against 40 between is the whole fix. */
    margin-bottom: ${space[10]};
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

export const TeamSelectContainer = styled.div`
    /* No margin of its own. The only gap inside a matchup is MatchupRow's 12px,
       which keeps the two buttons tight under the band they belong to; the
       separation from the next matchup is PickContainer's job. Splitting it
       across both is what made the two gaps converge in the first place. */
    margin: 0;
`

export const SubmitButton = styled(Button)`
    border: 2px solid ${color.ink};
    border-radius: ${radius.lg};
    padding: ${space[3]} ${space[8]};
    background: ${color.ink};
    color: ${color.inkInverse};
    font-weight: 500;

    &:hover:not(:disabled) {
        background: ${color.inkHover};
        border-color: ${color.inkHover};
    }

    &:disabled {
        background: ${color.surface};
        border-color: ${color.border};
        color: ${color.inkFaint};
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

/* --- Winner picker -------------------------------------------------------
 * Replaces a Select per game. Two cards, click one. The whole card is the hit
 * target rather than a radio dot, which is the point on a phone.
 * ---------------------------------------------------------------------- */

export const TeamChoices = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${space[3]};
`

export const TeamChoice = styled.button<{
    $selected: boolean
    $background: string
    $ink: string
}>`
    position: relative;
    display: flex;
    align-items: center;
    gap: ${space[3]};
    min-width: 0;
    /* 8px against a 32px logo leaves the button 52px tall -- still well clear
       of the 44px minimum tap target, which is the floor this padding is
       really set by rather than by how it looks. */
    padding: ${space[2]} ${space[4]};
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    ${typeStyle('body')}
    border-radius: ${radius.lg};
    transition: background-color ${motion.fast} ${motion.ease},
                border-color ${motion.fast} ${motion.ease};

    /* Unselected is a plain hairline card; selected fills with the team's own
       colour and takes the ink that colour needs. The 2px border is present in
       both states so selecting never shifts the layout by a pixel. */
    border: 2px solid ${({ $selected, $background }) => ($selected ? $background : color.border)};
    background: ${({ $selected, $background }) => ($selected ? $background : color.surface)};
    color: ${({ $selected, $ink }) => ($selected ? $ink : color.ink)};
    font-weight: ${({ $selected }) => ($selected ? 500 : 400)};

    &:hover:not(:disabled) {
        border-color: ${({ $selected, $background }) => ($selected ? $background : color.borderStrong)};
        background: ${({ $selected, $background }) => ($selected ? $background : color.surfaceHover)};
    }

    &:disabled {
        cursor: default;
        opacity: 0.55;
    }

    @media (prefers-contrast: more) {
        background: ${color.surface};
        color: ${color.ink};
        border-color: ${({ $selected }) => ($selected ? color.ink : color.border)};
    }
`

export const TeamChoiceLogo = styled.img`
    height: 28px;
    width: 28px;
    flex: none;
    object-fit: contain;
    /* Same white chip as the band: a team's own mark over its own colour would
       otherwise partly disappear. */
    box-sizing: content-box;
    padding: 2px;
    background: #ffffff;
    border-radius: 30%;
`

export const TeamChoiceName = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const TeamChoiceCheck = styled.span`
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    flex: none;
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
