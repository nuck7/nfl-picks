import React from 'react';
import { StyledFormField, StyledText } from './index.styles';

const CustomFormField = (props: any) => (
    <StyledFormField {...props} label={<StyledText size="">{props.label}</StyledText>} >
        {props.children}
    </StyledFormField>
);

export default CustomFormField
