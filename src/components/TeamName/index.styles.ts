import styled from "styled-components";
import { media } from "../../theme";

// The pair is swapped by media query rather than by measuring the viewport in
// JS: no resize listener, and no flash of the wrong one on first paint. Both
// are always in the DOM, which is why the visual halves are aria-hidden and the
// real name is announced separately.
export const FullName = styled.span`
    ${media.upToMobile} {
        display: none;
    }
`

export const ShortName = styled.span`
    display: none;

    ${media.upToMobile} {
        display: inline;
    }
`
