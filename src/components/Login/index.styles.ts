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

export const SocialButtons = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 24px;
`

// Each provider requires its own mark and colours, so these are plain buttons
// rather than grommet's -- 40px tall, matching the height of the form inputs
// below rather than towering over them.
export const SocialButton = styled.button<{ $dark?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 40px;
    padding: 0 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    border: 1px solid ${(props) => (props.$dark ? '#000000' : '#dadce0')};
    background: ${(props) => (props.$dark ? '#000000' : '#ffffff')};
    color: ${(props) => (props.$dark ? '#ffffff' : '#3c4043')};

    &:hover:not(:disabled) {
        opacity: 0.85;
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
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

// grommet's TextInput has no suffix slot, so the toggle is overlaid on the
// right of the field. The input gets matching padding so long passwords never
// run underneath the icon.
export const PasswordField = styled.div`
    position: relative;

    input {
        padding-right: 44px;
    }
`

export const PasswordToggle = styled.button`
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    width: 32px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    color: #666666;

    &:hover {
        color: #000000;
    }
`
