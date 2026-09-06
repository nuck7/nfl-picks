import styled from "styled-components";

// Text for screen readers only. Used everywhere a result is otherwise carried
// by colour, weight or a glyph.
const VisuallyHidden = styled.span`
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
`

export default VisuallyHidden
