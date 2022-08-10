import React, { ReactNode } from 'react';
import { Select } from 'grommet';

interface Props {
    name: string,
    label: string,
    id: string,
    options: Array<any>,
    value: string | number,
    onChange: (event: any) => void,
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
    onChange,
    labelKey,
    valueKey = "ID",
    ...props
}: Props) => {
    return (
        <Select
            name={name}
            options={options}
            // onSearch={(searchText) => {
            //     const regexp = new RegExp(searchText, 'i');
            //     setState({ value, options: options.filter(o => o.match(regexp)) });
            // }}
            onChange={onChange}
            clear={true}
            labelKey={labelKey}
            valueKey={valueKey}
        />
    );
}

export default SelectField
