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

// The other direction: the code from the mobile breakpoint up, and nothing at
// all below it. For the standings matchup column, where a phone has no room for
// two names beside two logos -- the logos say which teams these are, and the
// full name is still on the element for a screen reader.
export const WideOnlyShortName = styled.span`
    ${media.upToMobile} {
        display: none;
    }
`
