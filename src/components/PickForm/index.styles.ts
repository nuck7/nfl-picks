import { Button, FormField } from "grommet";
import styled from "styled-components";
import { fontSize } from "../../theme";

export const PickContainer = styled.div`
    display: flex;
    flex-direction: column;
`

export const MatchupLabel = styled.div`
    font-size: 24px;
    margin-bottom: 16px;
`

export const AtContainer = styled.div`
    font-size: ${fontSize.medium};
    padding-top: 48px;
`

export const StyledFormField = styled(FormField)`
   margin: 0 24px;
`

export const TeamSelectContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin: 0px 24px 40px 24px;
`
