import { Button } from "grommet";
import styled from "styled-components";
import { border, color, layout, radius, space, typeStyle } from "../../theme";

export const LoginContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-width: ${layout.formWidth};
    margin: 0 auto;
    padding: ${space[6]} 0;
`

export const SubmitButton = styled(Button)`
    margin-top: ${space[2]};
`

export const SocialButtons = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${space[2]};
    margin-bottom: ${space[6]};
`

// Each provider requires its own mark and colours, so these are plain buttons
// rather than grommet's. Padding rather than a fixed height, so they track the
// form inputs below instead of drifting whenever the input scale changes.
export const SocialButton = styled.button<{ $dark?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${space[2]};
    width: 100%;
    padding: 13px ${space[4]};
    border-radius: ${radius.lg};
    ${typeStyle('label')}
    font-family: inherit;
    cursor: pointer;
    border: 1px solid ${(props) => (props.$dark ? color.ink : color.border)};
    background: ${(props) => (props.$dark ? color.ink : color.surface)};
    color: ${(props) => (props.$dark ? color.inkInverse : color.ink)};

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
    gap: ${space[3]};
    color: ${color.inkMuted};
    margin-bottom: ${space[6]};
    ${typeStyle('meta')}

    &:before,
    &:after {
        content: '';
        flex: 1;
        border-top: ${border.hairline};
    }
`

export const ErrorMessage = styled.div`
    color: ${color.negative};
    margin-bottom: ${space[4]};
`

export const Notice = styled.div`
    color: ${color.inkMuted};
    margin-bottom: ${space[4]};
`

export const TextLink = styled.button`
    background: none;
    border: none;
    padding: 0;
    color: ${color.accent};
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    ${typeStyle('meta')}
`

export const Actions = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: ${space[4]};
    gap: ${space[4]};
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
    right: 0;
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
    color: ${color.inkMuted};

    &:hover {
        color: ${color.ink};
    }
`
