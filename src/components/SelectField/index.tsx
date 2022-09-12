import React, { ReactNode } from 'react';
import { Select } from 'grommet';

interface Props {
    name: string,
    label: string,
    id: string,
    options: Array<any>,
    defaultValue: string | object | Element | (string | number | object)[] | undefined,
    value?: string | object | Element | (string | number | object)[] | undefined,
    onChange?: (event: any) => void,
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
    defaultValue,
    value,
    onChange,
    labelKey,
    valueKey,
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
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            clear={true}
            labelKey={labelKey}
            valueKey={valueKey}
        />
    );
}

export default SelectField
