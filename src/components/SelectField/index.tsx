import React, { ReactNode } from 'react';
import { FormField, Select } from 'grommet';
// import { StyledFormField, StyledSelect } from './index.styles';

interface Props {
    name: string,
    label: string,
    id: string,
    options: Array<any>,
    value: string,
    labelKey: string | ((...args: any[]) => ReactNode) | undefined,
    valueKey?: string | {
        key: string;
        reduce?: boolean | undefined;
    } | ((...args: any[]) => string) | undefined
}

const SelectField: React.FC<Props> = ({
    name,
    label,
    id,
    options,
    value,
    labelKey,
    valueKey = "ID",
    ...props
}: Props) => {
    // const [state, setState] = React.useState({ value, options })

    return (
        <Select
            name={name}
            options={options}
            // onSearch={(searchText) => {
            //     const regexp = new RegExp(searchText, 'i');
            //     setState({ value, options: options.filter(o => o.match(regexp)) });
            // }}
            clear={true}
            labelKey={labelKey}
            valueKey={valueKey}
        />
    );
}

export default SelectField
