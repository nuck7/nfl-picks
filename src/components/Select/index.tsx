import React from 'react';
import { Select } from 'grommet';

interface Props {
    name: String,
    id: String,
    options: String[],
    value: String,
    onChange: Function,
}

const SelectField: React.FC<Props> = ({
    // value,
    // setValue,
    name,
    id,
    options,
    value,
    onChange,
    ...props
}: Props) => {
    // const [value, setValue] = React.useState({
    return (
        <Select
            options={options}
            value={value}
            onChange={({ option }) => onChange(option)}
        />
    );
}

export default SelectField
