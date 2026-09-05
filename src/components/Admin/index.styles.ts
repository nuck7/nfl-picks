import { FormField, TextInput } from "grommet";
import styled from "styled-components";
import { color } from "../../theme";

export const Intro = styled.p`
    color: #666666;
    max-width: 640px;
`

export const Section = styled.div`
    margin-bottom: 32px;
`

export const AddPlayerForm = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 16px;
`

export const StyledFormField = styled(FormField)`
    margin: 0;
`

export const Message = styled.div`
    color: #666666;
    margin: 16px 0;
`

export const ErrorMessage = styled.div`
    color: ${color.red};
    margin: 16px 0;
`

export const RoleLabel = styled.span`
    white-space: nowrap;
`

export const SeedNote = styled.span`
    color: #666666;
    font-size: 14px;
    white-space: nowrap;
`

export const NameCell = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
`

export const NameInput = styled(TextInput)`
    max-width: 200px;
`

export const LockRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 16px;
`

export const Hint = styled.p`
    color: #666666;
    font-size: 14px;
    margin: 0 0 16px 0;
`
