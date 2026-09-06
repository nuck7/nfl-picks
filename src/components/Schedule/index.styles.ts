import styled from "styled-components";
import { color, space } from "../../theme";

export const WeekSelectContainer = styled.div`
    max-width: 240px;
    margin-bottom: ${space[8]};
`

export const MatchupList = styled.div`
    display: flex;
    flex-direction: column;
`

export const EmptyMessage = styled.div`
    color: ${color.inkMuted};
`
