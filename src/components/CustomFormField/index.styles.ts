import { FormField, Text } from "grommet";
import styled from "styled-components";
import { fontSize, margin } from "../../theme";

export const StyledText = styled(Text)`
    font-size: ${fontSize.small}
`

export const StyledFormField = styled(FormField)`
    margin-bottom: ${margin.large};
`
