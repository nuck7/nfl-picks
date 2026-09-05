import { FormField } from "grommet";
import styled from "styled-components";
import { color } from "../../theme";

export const ProfileContainer = styled.div`
    max-width: 420px;
`

export const Intro = styled.p`
    color: #666666;
`

export const StyledFormField = styled(FormField)`
    margin-bottom: 16px;
`

export const Section = styled.div`
    margin-bottom: 32px;
`

export const FieldHint = styled.p`
    color: #666666;
    font-size: 14px;
    margin: 0 0 16px 0;
`

export const Detail = styled.div`
    display: flex;
    flex-direction: row;
    gap: 8px;
    color: #666666;
    margin-bottom: 8px;
`

export const DetailLabel = styled.span`
    min-width: 96px;
`

export const Message = styled.div`
    color: #666666;
    margin: 16px 0;
`

export const Notice = styled.div`
    color: ${color.blue};
    margin: 16px 0;
`

export const ErrorMessage = styled.div`
    color: ${color.red};
    margin: 16px 0;
`
