import { Button, FormField } from "grommet";
import styled from "styled-components";
import { color } from "../../theme";

export const LoginContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 360px;
    margin: 0 auto;
    padding: 24px 0;
`

export const StyledFormField = styled(FormField)`
    margin-bottom: 16px;
`

export const SubmitButton = styled(Button)`
    margin-top: 8px;
`

export const GoogleButton = styled(Button)`
    margin-bottom: 24px;
`

export const Divider = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    color: #666666;
    margin-bottom: 24px;

    &:before,
    &:after {
        content: '';
        flex: 1;
        border-top: 1px solid #dddddd;
    }
`

export const ErrorMessage = styled.div`
    color: ${color.red};
    margin-bottom: 16px;
`

export const Notice = styled.div`
    color: #666666;
    margin-bottom: 16px;
`

export const TextLink = styled.button`
    background: none;
    border: none;
    padding: 0;
    color: ${color.blue};
    cursor: pointer;
    text-decoration: underline;
    font-size: 14px;
`

export const Actions = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    gap: 16px;
`
