import styled from "styled-components";
import { border, color, space, typeStyle } from "../../theme";

export const Section = styled.div`
    margin-bottom: ${space[8]};
`

export const Heading = styled.h2`
    ${typeStyle('subsection')}
    margin: 0 0 ${space[4]} 0;
    padding-bottom: ${space[2]};
    border-bottom: ${border.hairline};
    color: ${color.inkMuted};
`

// The kickoff time used to be pinned to the right of this row. It now lives
// under the "@" inside the matchup band's darkened centre -- on a band, the far
// right is full-saturation home-team colour -- so all this still owns is the
// spacing between one game and the next.
export const MatchupRow = styled.div`
    margin-bottom: ${space[3]};
`
